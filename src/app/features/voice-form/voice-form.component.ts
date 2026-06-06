import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AgentService } from '../../core/services/agent.service';
import { MicService } from '../../core/services/mic.service';
import { ParserService } from '../../core/services/parser.service';
import { TtsService } from '../../core/services/tts.service';
import { WhisperService } from '../../core/services/whisper.service';

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
  private readonly parser = inject(ParserService);
  private readonly agent = inject(AgentService);
  private readonly tts = inject(TtsService);
  private readonly subscriptions = new Subscription();

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
        if (!text) {
          return;
        }

        this.transcript = text;
        const parsed = this.parser.parse(text);
        this.agent.update(parsed);
        this.form.patchValue(this.agent.state.data);

        const next = this.agent.next();
        if (next) {
          this.tts.speak(this.agent.question(next));
        } else {
          this.tts.speak('Form completed.');
          this.status = 'Form completed.';
        }
      })
    );

    this.subscriptions.add(
      this.whisper.status$.subscribe((status) => {
        this.status = status;
      })
    );
  }

  async start(): Promise<void> {
    await this.mic.start((audio) => this.whisper.process(audio));
    this.isListening = true;
    this.status = 'Listening...';

    const next = this.agent.next();
    if (next) {
      this.tts.speak(this.agent.question(next));
    }
  }

  stop(): void {
    this.mic.stop();
    this.isListening = false;
    this.status = 'Stopped';
  }

  reset(): void {
    this.stop();
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
