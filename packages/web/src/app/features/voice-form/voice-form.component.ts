import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AgentService } from '../../core/services/agent.service';
import { MicService } from '../../core/services/mic.service';
import { TtsService } from '../../core/services/tts.service';
import { WhisperService } from '../../core/services/whisper.service';

// Barge-in: while TTS is speaking, sustained loud mic input means the user
// is interrupting — cancel the speech and transcribe what they said.
// Echo cancellation keeps most of the TTS voice out of the mic, so the
// threshold is higher than the whisper service's silence threshold.
const BARGE_IN_RMS = 0.04;
const BARGE_IN_CHUNKS = 2; // ~0.5s at 4096 samples / 16kHz

@Component({
  selector: 'app-voice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './voice-form.component.html',
  styleUrl: './voice-form.component.css'
})
export class VoiceFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly mic = inject(MicService);
  private readonly whisper = inject(WhisperService);
  private readonly agent = inject(AgentService);
  private readonly tts = inject(TtsService);
  private readonly subscriptions = new Subscription();
  private bargeInChunks: Float32Array[] = [];

  transcript = '';
  status = 'Idle';
  isListening = false;

  readonly form = this.fb.group({
    name: this.fb.control(''),
    phone: this.fb.control(''),
    city: this.fb.control('')
  });

  constructor() {
    this.subscriptions.add(
      this.whisper.transcript$.subscribe((text) => {
        this.transcript = text;
      })
    );

    this.subscriptions.add(
      this.whisper.utterance$.subscribe((utterance) => {
        this.handleUtterance(utterance);
      })
    );

    this.subscriptions.add(
      this.whisper.status$.subscribe((status) => {
        this.status = status;
      })
    );
  }

  async start(): Promise<void> {
    try {
      await this.mic.start((audio) => this.onAudioChunk(audio));
    } catch (error) {
      this.status =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow mic permission and try again.'
          : 'Could not start the microphone.';
      return;
    }

    this.isListening = true;
    this.status = 'Listening...';

    // TtsService cancels prior speech on each call, so greeting and
    // question must go out as one utterance
    this.tts.speak(
      `${this.greeting()} I am your voice form assistant. ${this.agent.start()}`
    );
  }

  private onAudioChunk(audio: Float32Array): void {
    if (!this.tts.speaking) {
      this.bargeInChunks = [];
      this.whisper.process(audio);
      return;
    }

    // assistant is talking: listen only for an interruption
    if (this.rms(audio) > BARGE_IN_RMS) {
      this.bargeInChunks.push(audio);
      if (this.bargeInChunks.length >= BARGE_IN_CHUNKS) {
        this.tts.stop();
        for (const chunk of this.bargeInChunks) {
          this.whisper.process(chunk);
        }
        this.bargeInChunks = [];
      }
    } else {
      this.bargeInChunks = [];
    }
  }

  private rms(audio: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audio.length; i++) {
      sum += audio[i] * audio[i];
    }
    return Math.sqrt(sum / audio.length);
  }

  private handleUtterance(utterance: string): void {
    const reply = this.agent.handle(utterance);

    const view = this.agent.view;
    this.form.patchValue({
      name: view.name ?? '',
      phone: view.phone ?? '',
      city: view.city ?? ''
    });

    if (this.agent.completed) {
      this.status = 'Form completed.';
    }
    if (reply) {
      this.tts.speak(reply);
    }
  }

  private greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning!';
    }
    if (hour < 17) {
      return 'Good afternoon!';
    }
    return 'Good evening!';
  }

  stop(): void {
    this.mic.stop();
    this.tts.stop();
    this.isListening = false;
    this.status = 'Stopped';
  }

  reset(): void {
    this.stop();
    this.whisper.reset();
    this.agent.reset();
    this.form.reset({
      name: '',
      phone: '',
      city: ''
    });
    this.transcript = '';
    this.status = 'Idle';
  }

  ngOnDestroy(): void {
    this.stop();
    this.subscriptions.unsubscribe();
  }
}
