import { Injectable, inject } from '@angular/core';
import { ParserService } from './parser.service';

export type FormField = 'name' | 'phone' | 'city';

// Conversation phases:
//   asking     — a question is open, waiting for the field's value
//   confirming — a value was heard, waiting for the user's yes/no
//   summary    — all fields filled, reading them back for final verification
//   completed  — done; corrections are still accepted and re-confirmed
type Phase = 'idle' | 'asking' | 'confirming' | 'summary' | 'completed';

const FIELDS: FormField[] = ['name', 'phone', 'city'];

const QUESTIONS: Record<FormField, string> = {
  name: 'What is your name?',
  phone: 'What is your phone number?',
  city: 'Which city are you from?'
};

const LABELS: Record<FormField, string> = {
  name: 'name',
  phone: 'phone number',
  city: 'city'
};

@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly parser = inject(ParserService);

  private phase: Phase = 'idle';
  private active?: FormField;
  private pending?: string;
  private data: Partial<Record<FormField, string>> = {};

  /** confirmed values plus the value currently awaiting confirmation */
  get view(): Partial<Record<FormField, string>> {
    const view = { ...this.data };
    if (this.active && this.pending) {
      view[this.active] = this.pending;
    }
    return view;
  }

  get completed(): boolean {
    return this.phase === 'completed';
  }

  /** opening prompt; resumes mid-conversation if stopped and restarted */
  start(): string {
    if (this.phase === 'completed') {
      return 'Your form is already complete.';
    }
    if (this.phase === 'confirming' && this.active && this.pending) {
      return this.confirmPrompt();
    }
    const next = this.nextMissing();
    if (!next) {
      this.phase = 'summary';
      return `${this.summaryText()} Is everything correct?`;
    }
    this.phase = 'asking';
    this.active = next;
    return QUESTIONS[next];
  }

  /** returns the reply to speak, or null to stay quiet */
  handle(rawText: string): string | null {
    const text = rawText.trim();
    if (!text) {
      return null;
    }

    switch (this.phase) {
      case 'asking':
        return this.onAsking(text);
      case 'confirming':
        return this.onConfirming(text);
      case 'summary':
        return this.onSummary(text);
      case 'completed':
        return this.findCorrection(text);
      default:
        return null;
    }
  }

  reset(): void {
    this.phase = 'idle';
    this.active = undefined;
    this.pending = undefined;
    this.data = {};
  }

  private onAsking(text: string): string | null {
    const active = this.active!;
    const explicit = this.parser.parse(text);

    // volunteered values for other empty fields ("I'm Waheed from Hyderabad")
    // are captured directly; the final summary verifies them
    for (const field of FIELDS) {
      if (field !== active && !this.data[field] && explicit[field]) {
        this.data[field] = explicit[field];
      }
    }

    const value = explicit[active] ?? this.parser.directAnswer(active, text);
    if (!value) {
      return null;
    }
    this.pending = value;
    this.phase = 'confirming';
    return this.confirmPrompt();
  }

  private onConfirming(text: string): string | null {
    const active = this.active!;
    const explicit = this.parser.parse(text);

    // "no, it's Rahul" — correction with a replacement value beats plain yes/no
    const corrected = explicit[active] ?? this.parser.correction(active, text);
    if (corrected && corrected.toLowerCase() !== this.pending!.toLowerCase()) {
      this.pending = corrected;
      return `Okay, ${corrected}. Is that correct?`;
    }

    if (this.parser.isNo(text)) {
      this.pending = undefined;
      this.phase = 'asking';
      return `Sorry about that. ${QUESTIONS[active]}`;
    }

    if (this.parser.isYes(text)) {
      this.data[active] = this.pending!;
      this.pending = undefined;
      const next = this.nextMissing();
      if (next) {
        this.active = next;
        this.phase = 'asking';
        return `Great. ${QUESTIONS[next]}`;
      }
      this.active = undefined;
      this.phase = 'summary';
      return `Let me verify. ${this.summaryText()} Is everything correct?`;
    }

    return `Please say yes or no. ${this.confirmPrompt()}`;
  }

  private onSummary(text: string): string | null {
    const correction = this.findCorrection(text);
    if (correction) {
      return correction;
    }
    if (this.parser.isNo(text)) {
      return 'What would you like to change? You can say, for example: change my name to Rahul.';
    }
    if (this.parser.isYes(text)) {
      this.phase = 'completed';
      return 'Perfect. Your form is complete. Thank you!';
    }
    return null;
  }

  /** explicit re-statement of any field ("change my city to Mumbai") */
  private findCorrection(text: string): string | null {
    const explicit = this.parser.parse(text);
    for (const field of FIELDS) {
      const value = explicit[field];
      if (value && value.toLowerCase() !== (this.data[field] ?? '').toLowerCase()) {
        this.active = field;
        this.pending = value;
        this.phase = 'confirming';
        return `Okay, changing your ${LABELS[field]} to ${value}. Is that correct?`;
      }
    }
    return null;
  }

  private confirmPrompt(): string {
    return `I heard ${this.pending} for your ${LABELS[this.active!]}. Is that correct?`;
  }

  private nextMissing(): FormField | undefined {
    return FIELDS.find((field) => !this.data[field]);
  }

  private summaryText(): string {
    return `Your name is ${this.data.name}, your phone number is ${this.data.phone}, and your city is ${this.data.city}.`;
  }
}
