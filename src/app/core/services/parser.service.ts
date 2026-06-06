import { Injectable } from '@angular/core';

export interface ParsedFormData {
  name?: string;
  phone?: string;
  city?: string;
}

@Injectable({ providedIn: 'root' })
export class ParserService {
  parse(rawText: string): ParsedFormData {
    const text = rawText.trim().toLowerCase();

    return {
      name: this.extractName(text),
      phone: this.extractPhone(text),
      city: this.extractCity(text)
    };
  }

  private extractPhone(text: string): string | undefined {
    const match = text.match(/\b(?:\+91[- ]?)?[6-9]\d{9}\b/);
    return match?.[0]?.replace(/[- ]/g, '');
  }

  private extractName(text: string): string | undefined {
    const patterns = [
      /my name is ([a-z]+(?: [a-z]+)?)/,
      /i am ([a-z]+(?: [a-z]+)?)/,
      /mera naam ([a-z]+(?: [a-z]+)?)/,
      /main ([a-z]+(?: [a-z]+)?) hoon/,
      /na peru ([a-z]+(?: [a-z]+)?)/,
      /mera nam ([a-z]+(?: [a-z]+)?)/
    ];

    return this.firstMatch(patterns, text);
  }

  private extractCity(text: string): string | undefined {
    const patterns = [
      /i am from ([a-z]+(?: [a-z]+)?)/,
      /from ([a-z]+(?: [a-z]+)?)/,
      /mein ([a-z]+(?: [a-z]+)?)(?: se hoon)?/,
      /mai[n]? ([a-z]+(?: [a-z]+)?) se hoon/,
      /nundi ([a-z]+(?: [a-z]+)?)/,
      /city is ([a-z]+(?: [a-z]+)?)/
    ];

    return this.firstMatch(patterns, text);
  }

  private firstMatch(patterns: RegExp[], text: string): string | undefined {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return this.toTitleCase(match[1]);
      }
    }

    return undefined;
  }

  private toTitleCase(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
