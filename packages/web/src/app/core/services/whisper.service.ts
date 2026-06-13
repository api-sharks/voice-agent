import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

// whisper.cpp stream.wasm build (assets/whisper/stream.js). Embind API:
// init(model, lang) -> instance, set_audio(instance, Float32Array @16kHz),
// get_transcribed() (poll, returns-and-clears), get_status().
// The build is pthread-based and needs cross-origin isolation (COOP/COEP
// headers, configured for ng serve in angular.json).
const RUNTIME_URL = 'assets/whisper/stream.js';
const MODEL_URL = 'assets/whisper/ggml-tiny.bin';
const LANGUAGE = 'en';

export const WHISPER_SAMPLE_RATE = 16000;

// The C++ side consumes the last 5s of whatever buffer it was given and
// clears it, so each utterance must be pushed exactly once — re-sending a
// rolling buffer makes the same speech get transcribed repeatedly.
const MAX_BUFFER_SECONDS = 30;
const POLL_INTERVAL_MS = 250;

// crude voice activity detection: flush the buffered audio to Whisper once
// the speaker pauses, or when the buffer reaches the engine's 5s window
const SPEECH_RMS_THRESHOLD = 0.01;
const SILENCE_FLUSH_SECONDS = 0.8;
const MAX_UTTERANCE_SECONDS = 5;
const LEAD_IN_SECONDS = 1;

@Injectable({ providedIn: 'root' })
export class WhisperService {
  readonly transcript$ = new BehaviorSubject<string>('');
  readonly status$ = new BehaviorSubject<string>('Idle');
  /** one emission per transcribed utterance (transcript$ stays cumulative) */
  readonly utterance$ = new Subject<string>();

  // process() is called from onaudioprocess, which zone.js does not patch,
  // so every emission must re-enter the Angular zone or the UI won't update
  private readonly zone = inject(NgZone);
  private module: any;
  private instance = 0;
  private loading?: Promise<void>;
  private audio = new Float32Array(0);
  private hasSpeech = false;
  private silenceSeconds = 0;
  private lastStatus = '';
  private text = '';
  private pollTimer?: ReturnType<typeof setInterval>;

  process(chunk: Float32Array): void {
    const merged = new Float32Array(this.audio.length + chunk.length);
    merged.set(this.audio);
    merged.set(chunk, this.audio.length);
    const max = WHISPER_SAMPLE_RATE * MAX_BUFFER_SECONDS;
    this.audio = merged.length > max ? merged.slice(merged.length - max) : merged;

    if (!this.instance) {
      void this.ensureLoaded();
      return;
    }

    let sum = 0;
    for (let i = 0; i < chunk.length; i++) {
      sum += chunk[i] * chunk[i];
    }
    const rms = Math.sqrt(sum / chunk.length);
    if (rms > SPEECH_RMS_THRESHOLD) {
      this.hasSpeech = true;
      this.silenceSeconds = 0;
    } else {
      this.silenceSeconds += chunk.length / WHISPER_SAMPLE_RATE;
    }

    const bufferedSeconds = this.audio.length / WHISPER_SAMPLE_RATE;
    if (
      this.hasSpeech &&
      (this.silenceSeconds >= SILENCE_FLUSH_SECONDS ||
        bufferedSeconds >= MAX_UTTERANCE_SECONDS)
    ) {
      this.module.set_audio(this.instance, this.audio);
      this.clearAudio();
    } else if (!this.hasSpeech && bufferedSeconds > LEAD_IN_SECONDS) {
      // no speech yet: keep only a short lead-in so accumulated silence
      // doesn't get sent along with the next utterance
      this.audio = this.audio.slice(
        this.audio.length - WHISPER_SAMPLE_RATE * LEAD_IN_SECONDS
      );
    }
  }

  reset(): void {
    this.clearAudio();
    this.text = '';
    this.transcript$.next('');
  }

  private clearAudio(): void {
    this.audio = new Float32Array(0);
    this.hasSpeech = false;
    this.silenceSeconds = 0;
  }

  private ensureLoaded(): Promise<void> {
    if (!this.loading) {
      this.loading = this.load().catch((error) => {
        this.loading = undefined;
        this.zone.run(() =>
          this.status$.next(
            error instanceof Error ? error.message : 'Failed to load Whisper.'
          )
        );
      });
    }
    return this.loading;
  }

  private async load(): Promise<void> {
    if (!window.crossOriginIsolated) {
      throw new Error(
        'Whisper needs cross-origin isolation (COOP/COEP headers missing).'
      );
    }

    this.zone.run(() => this.status$.next('Loading Whisper model...'));

    const moduleConfig: any = {
      print: (text: string) => console.log('[whisper]', text),
      printErr: (text: string) => console.warn('[whisper]', text)
    };
    const runtimeReady = new Promise<void>((resolve) => {
      moduleConfig.onRuntimeInitialized = () => resolve();
    });
    // stream.js is a classic emscripten script: it picks up and reuses the
    // pre-existing global `Module` object
    (window as any).Module = moduleConfig;

    const [model] = await Promise.all([
      fetch(MODEL_URL).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to download the Whisper model.');
        }
        return response.arrayBuffer();
      }),
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = RUNTIME_URL;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error('Failed to load the Whisper runtime.'));
        document.body.appendChild(script);
      }).then(() => runtimeReady)
    ]);

    this.module = (window as any).Module;
    this.module.FS_createDataFile('/', 'whisper.bin', new Uint8Array(model), true, true);

    this.instance = this.module.init('whisper.bin', LANGUAGE);
    if (!this.instance) {
      throw new Error('Failed to initialize Whisper.');
    }

    this.zone.run(() => {
      this.status$.next('Whisper ready. Listening...');
      this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    });
  }

  private poll(): void {
    const status = this.module.get_status() as string;
    if (status && status !== this.lastStatus) {
      this.lastStatus = status;
      this.status$.next(status);
    }

    const transcribed = (this.module.get_transcribed() as string) || '';
    // drop non-speech annotations like [BLANK_AUDIO] or (wind blowing)
    const cleaned = transcribed.replace(/\[[^\]]*\]|\([^)]*\)/g, '').trim();
    if (cleaned) {
      this.text = this.text ? `${this.text} ${cleaned}` : cleaned;
      this.transcript$.next(this.text);
      this.utterance$.next(cleaned);
    }
  }
}
