import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TtsService {
  /** true while a prompt is queued or being spoken */
  get speaking(): boolean {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }

  speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  /** cancel any queued or in-progress speech (user barge-in) */
  stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
