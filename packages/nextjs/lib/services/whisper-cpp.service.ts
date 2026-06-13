'use client';

const RUNTIME_URL = '/whisper/stream.js';
const MODEL_URL = '/whisper/ggml-tiny.bin';
const LANGUAGE = 'en';
const WHISPER_SAMPLE_RATE = 16000;
const BROWSER_SAMPLE_RATE = 48000;

const MAX_BUFFER_SECONDS = 30;
const POLL_INTERVAL_MS = 250;
const SPEECH_RMS_THRESHOLD = 0.001; // Much lower threshold for 48kHz audio
const SILENCE_FLUSH_SECONDS = 1.2;
const MAX_UTTERANCE_SECONDS = 5;
const LEAD_IN_SECONDS = 1;

export class WhisperCppService {
  private static instance: WhisperCppService;
  private module: any = null;
  private instanceId = 0;
  private loading: Promise<void> | null = null;
  private audio = new Float32Array(0);
  private hasSpeech = false;
  private silenceSeconds = 0;
  private lastStatus = '';
  private text = '';
  private pollTimer: NodeJS.Timeout | null = null;
  private utteranceCallback: ((text: string) => void) | null = null;
  private statusCallback: ((status: string) => void) | null = null;

  private constructor() {}

  static getInstance(): WhisperCppService {
    if (!WhisperCppService.instance) {
      WhisperCppService.instance = new WhisperCppService();
    }
    return WhisperCppService.instance;
  }

  async initialize(
    onStatus?: (status: string) => void,
    onUtterance?: (text: string) => void
  ): Promise<void> {
    if (this.instanceId) return; // Already loaded

    this.statusCallback = onStatus;
    this.utteranceCallback = onUtterance;

    if (!this.loading) {
      this.loading = this.load();
    }

    return this.loading;
  }

  private async load(): Promise<void> {
    this.updateStatus('Loading Whisper model (75MB)...');

    try {
      // Check if cross-origin isolation is available
      if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
        console.warn('Cross-origin isolation not available');
      }

      const moduleConfig: any = {
        print: (text: string) => console.log('[whisper]', text),
        printErr: (text: string) => console.warn('[whisper]', text),
      };

      const runtimeReady = new Promise<void>((resolve) => {
        moduleConfig.onRuntimeInitialized = () => resolve();
      });

      // Load WASM runtime
      (window as any).Module = moduleConfig;

      const [model] = await Promise.all([
        fetch(MODEL_URL).then((response) => {
          if (!response.ok) {
            throw new Error('Failed to download Whisper model');
          }
          return response.arrayBuffer();
        }),
        new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = RUNTIME_URL;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Whisper runtime'));
          document.body.appendChild(script);
        }).then(() => runtimeReady),
      ]);

      this.module = (window as any).Module;
      this.module.FS_createDataFile(
        '/',
        'whisper.bin',
        new Uint8Array(model),
        true,
        true
      );

      this.instanceId = this.module.init('whisper.bin', LANGUAGE);
      if (!this.instanceId) {
        throw new Error('Failed to initialize Whisper');
      }

      this.updateStatus('Whisper ready. Listening...');
      this.startPolling();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load Whisper';
      console.error(message);
      this.updateStatus(message);
      throw error;
    }
  }

  process(chunk: Float32Array): void {
    if (!this.instanceId) {
      void this.initialize();
      return;
    }

    // Resample from 48kHz to 16kHz (take every 3rd sample)
    const resampleRatio = BROWSER_SAMPLE_RATE / WHISPER_SAMPLE_RATE; // 48000/16000 = 3
    const resampled = new Float32Array(Math.floor(chunk.length / resampleRatio));
    for (let i = 0; i < resampled.length; i++) {
      resampled[i] = chunk[Math.floor(i * resampleRatio)];
    }

    // Buffer resampled audio
    const merged = new Float32Array(this.audio.length + resampled.length);
    merged.set(this.audio);
    merged.set(resampled, this.audio.length);
    const max = WHISPER_SAMPLE_RATE * MAX_BUFFER_SECONDS;
    this.audio = merged.length > max ? merged.slice(merged.length - max) : merged;

    // Voice activity detection with RMS
    let sum = 0;
    for (let i = 0; i < resampled.length; i++) {
      sum += resampled[i] * resampled[i];
    }
    const rms = Math.sqrt(sum / resampled.length);

    if (rms > SPEECH_RMS_THRESHOLD) {
      this.hasSpeech = true;
      this.silenceSeconds = 0;
      console.log(`[Whisper] Speech detected! RMS: ${rms.toFixed(5)}, buffered: ${(this.audio.length / WHISPER_SAMPLE_RATE).toFixed(1)}s`);
    } else {
      this.silenceSeconds += resampled.length / WHISPER_SAMPLE_RATE;
    }

    // Send to Whisper when speech ends or buffer is full
    const bufferedSeconds = this.audio.length / WHISPER_SAMPLE_RATE;
    if (
      this.hasSpeech &&
      (this.silenceSeconds >= SILENCE_FLUSH_SECONDS ||
        bufferedSeconds >= MAX_UTTERANCE_SECONDS)
    ) {
      console.log(`[Whisper] Flushing audio to engine. Buffer: ${bufferedSeconds.toFixed(1)}s, silence: ${this.silenceSeconds.toFixed(1)}s`);
      this.module.set_audio(this.instanceId, this.audio);
      this.clearAudio();
    } else if (!this.hasSpeech && bufferedSeconds > LEAD_IN_SECONDS) {
      // Keep only lead-in silence
      this.audio = this.audio.slice(
        this.audio.length - WHISPER_SAMPLE_RATE * LEAD_IN_SECONDS
      );
    }
  }

  private startPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(() => {
      const status = this.module?.get_status?.() as string;
      if (status && status !== this.lastStatus) {
        this.lastStatus = status;
        this.updateStatus(status);
      }

      const transcribed = (this.module?.get_transcribed?.() as string) || '';
      // Clean annotations like [BLANK_AUDIO] or (wind blowing)
      const cleaned = transcribed
        .replace(/\[[^\]]*\]|\([^)]*\)/g, '')
        .trim();

      if (cleaned && this.utteranceCallback) {
        this.text = this.text ? `${this.text} ${cleaned}` : cleaned;
        this.utteranceCallback(cleaned);
      }
    }, POLL_INTERVAL_MS);
  }

  private clearAudio(): void {
    this.audio = new Float32Array(0);
    this.hasSpeech = false;
    this.silenceSeconds = 0;
  }

  private updateStatus(status: string): void {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  reset(): void {
    this.clearAudio();
    this.text = '';
  }

  getTranscript(): string {
    return this.text;
  }

  isInitialized(): boolean {
    return this.instanceId !== 0;
  }

  destroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.instanceId = 0;
    this.module = null;
    this.loading = null;
  }
}

export const whisperCppService = WhisperCppService.getInstance();
