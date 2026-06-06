import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WhisperService {
  readonly transcript$ = new BehaviorSubject<string>('');
  readonly status$ = new BehaviorSubject<string>('Idle');

  private readonly worker = new Worker(
    new URL('../../../assets/whisper/whisper.worker.js', import.meta.url),
    { type: 'module' }
  );

  constructor() {
    this.worker.onmessage = ({ data }: MessageEvent<{ type: string; text?: string; status?: string }>) => {
      if (data.type === 'transcript' && data.text) {
        this.transcript$.next(data.text);
      }

      if (data.type === 'status' && data.status) {
        this.status$.next(data.status);
      }
    };

    this.worker.onerror = () => {
      this.status$.next('Whisper worker failed to load.');
    };
  }

  process(audio: Float32Array): void {
    this.status$.next('Processing audio...');
    this.worker.postMessage(audio);
  }
}
