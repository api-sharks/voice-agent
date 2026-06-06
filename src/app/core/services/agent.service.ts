import { Injectable } from '@angular/core';
import { ParsedFormData } from './parser.service';

type FormField = 'name' | 'phone' | 'city';

interface AgentState {
  missing: FormField[];
  data: Partial<Record<FormField, string>>;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  readonly state: AgentState = {
    missing: ['name', 'phone', 'city'],
    data: {}
  };

  update(parsed: ParsedFormData): void {
    (Object.keys(parsed) as FormField[]).forEach((key) => {
      const value = parsed[key];
      if (value) {
        this.state.data[key] = value;
        this.state.missing = this.state.missing.filter((field) => field !== key);
      }
    });
  }

  next(): FormField | undefined {
    return this.state.missing[0];
  }

  question(field: FormField): string {
    return {
      name: 'What is your name?',
      phone: 'What is your phone number?',
      city: 'Which city are you from?'
    }[field];
  }

  reset(): void {
    this.state.data = {};
    this.state.missing = ['name', 'phone', 'city'];
  }
}
