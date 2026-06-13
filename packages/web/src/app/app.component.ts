import { Component } from '@angular/core';
import { VoiceFormComponent } from './features/voice-form/voice-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VoiceFormComponent],
  template: '<app-voice-form />'
})
export class AppComponent {}
