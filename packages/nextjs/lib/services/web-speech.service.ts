'use client';

export class WebSpeechService {
  private static instance: WebSpeechService;
  private recognition: any = null;
  private isListening = false;
  private transcript = '';
  private listeners: ((text: string) => void)[] = [];

  private constructor() {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
      }
    }
  }

  static getInstance(): WebSpeechService {
    if (!WebSpeechService.instance) {
      WebSpeechService.instance = new WebSpeechService();
    }
    return WebSpeechService.instance;
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Set language to English
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      console.log('Web Speech Recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Log interim results for feedback
      if (interimTranscript) {
        console.log('Interim: ' + interimTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.onend = () => {
      console.log('Web Speech Recognition ended');
      this.isListening = false;

      // Emit final transcript
      if (this.transcript.trim()) {
        this.listeners.forEach(listener => listener(this.transcript.trim()));
      }
      this.transcript = '';
    };
  }

  async transcribe(): Promise<string> {
    if (!this.recognition) {
      throw new Error('Web Speech API not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      this.transcript = '';
      let hasResolved = false;
      let timeoutId: NodeJS.Timeout | null = null;

      const listener = (text: string) => {
        if (hasResolved) return;
        hasResolved = true;
        if (timeoutId) clearTimeout(timeoutId);
        this.listeners = this.listeners.filter(l => l !== listener);
        resolve(text);
      };

      this.listeners.push(listener);

      try {
        this.recognition.start();
      } catch (error) {
        // Already listening or error starting
        console.warn('Recognition error:', error);
      }

      // Timeout after 60 seconds (Web Speech API can take time)
      timeoutId = setTimeout(() => {
        if (hasResolved) return;
        hasResolved = true;
        this.listeners = this.listeners.filter(l => l !== listener);
        try {
          this.recognition.stop();
        } catch (e) {
          // Already stopped
        }
        reject(new Error('Speech recognition timeout - please try again'));
      }, 60000);

      // Clear timeout when we get a result
      const originalListener = this.listeners[this.listeners.length - 1];
      if (originalListener) {
        this.listeners[this.listeners.length - 1] = (text: string) => {
          if (!hasResolved) {
            hasResolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            originalListener(text);
          }
        };
      }
    });
  }

  startListening(): void {
    if (!this.recognition) {
      console.error('Web Speech API not supported');
      return;
    }

    try {
      this.transcript = '';
      this.recognition.start();
    } catch (error) {
      console.warn('Recognition already in progress');
    }
  }

  stopListening(): string {
    if (!this.recognition) return this.transcript;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }

    return this.transcript;
  }

  abort(): void {
    if (!this.recognition) return;

    try {
      this.recognition.abort();
      this.transcript = '';
    } catch (error) {
      console.error('Error aborting recognition:', error);
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  setLanguage(lang: string): void {
    if (!this.recognition) return;
    this.recognition.lang = lang;
  }
}

export const webSpeechService = WebSpeechService.getInstance();
