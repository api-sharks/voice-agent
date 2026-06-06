import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TtsService {
  speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}
