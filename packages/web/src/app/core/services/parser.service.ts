import { Injectable } from '@angular/core';

export interface ParsedFormData {
  name?: string;
  phone?: string;
  city?: string;
}

// short utterances that are conversational noise, not answers
const FILLER_UTTERANCES = new Set([
  'yes', 'no', 'okay', 'ok', 'hello', 'hi', 'hey', 'bye', 'goodbye',
  'please', 'sorry', 'thank you', 'thanks', 'um', 'uh', 'hmm', 'haan', 'nahi'
]);

// leading words to strip when the user corrects a value, e.g.
// "no, it's Rahul" / "not Waheed, Rahul" / "sorry I said Rahul"
const CORRECTION_PREFIXES = new Set([
  'no', 'nope', 'not', 'wrong', 'actually', 'sorry', 'i', 'said',
  'it', 'its', 'is', 'the', 'nahi', 'galat'
]);

// NO is checked before YES by callers: "that's not right" must read as a no
// even though it contains "right"
const NO_PATTERN = /\b(no|nope|not|wrong|incorrect|nahi|galat|kaadu)\b/;
const YES_PATTERN = /\b(yes|yeah|yep|yup|ok|okay|correct|right|sure|perfect|fine|haan|sahi|avunu)\b/;

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

  /**
   * Interpret an utterance as a bare answer to the field the agent just
   * asked about (e.g. the user says "Waheed" after "What is your name?",
   * instead of a full phrase like "my name is Waheed").
   */
  directAnswer(field: keyof ParsedFormData, rawText: string): string | undefined {
    const text = rawText.trim().toLowerCase();

    if (field === 'phone') {
      const digits = text.replace(/\D/g, '');
      return digits.match(/([6-9]\d{9})$/)?.[1];
    }

    const words = text
      .replace(/[^a-z\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0 || words.length > 3) {
      return undefined;
    }
    const phrase = words.join(' ');
    if (FILLER_UTTERANCES.has(phrase)) {
      return undefined;
    }
    return this.toTitleCase(phrase);
  }

  /**
   * Extract a replacement value from a correction utterance like
   * "no, it's Rahul" — strips leading negation words, then reads the rest
   * as a bare answer.
   */
  correction(field: keyof ParsedFormData, rawText: string): string | undefined {
    if (field === 'phone') {
      return this.directAnswer(field, rawText);
    }

    const words = rawText
      .trim()
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    let start = 0;
    while (start < words.length && CORRECTION_PREFIXES.has(words[start])) {
      start++;
    }
    const rest = words.slice(start).join(' ');
    return rest ? this.directAnswer(field, rest) : undefined;
  }

  isNo(rawText: string): boolean {
    return NO_PATTERN.test(rawText.trim().toLowerCase());
  }

  isYes(rawText: string): boolean {
    const text = rawText.trim().toLowerCase();
    return !NO_PATTERN.test(text) && YES_PATTERN.test(text);
  }

  private extractPhone(text: string): string | undefined {
    // whisper often inserts spaces between digit groups ("98765 43210")
    const compact = text.replace(/(\d)[\s-]+(?=\d)/g, '$1');
    const match = compact.match(/(?<!\d)(?:\+?91)?([6-9]\d{9})(?!\d)/);
    return match?.[1];
  }

  private extractName(text: string): string | undefined {
    const patterns = [
      /my name is ([a-z]+(?: [a-z]+)?)/,
      /name (?:is|to|should be) ([a-z]+(?: [a-z]+)?)/,
      // "i am from Hyderabad" / "i am in ..." is a city phrase, not a name
      /i am (?!from\b|in\b)([a-z]+(?: [a-z]+)?)/,
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
      /i live in ([a-z]+(?: [a-z]+)?)/,
      /city (?:is|to|should be) ([a-z]+(?: [a-z]+)?)/,
      /from ([a-z]+(?: [a-z]+)?)/,
      /mein ([a-z]+(?: [a-z]+)?)(?: se hoon)?/,
      /mai[n]? ([a-z]+(?: [a-z]+)?) se hoon/,
      /nundi ([a-z]+(?: [a-z]+)?)/
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
