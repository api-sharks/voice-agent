'use client';

export class WebSpeechService {
  private static instance: WebSpeechService;
  private recognition: any = null;
  private isListening = false;
  private transcript = '';
  private listeners: ((text: string) => void)[] = [];
  private errorListeners: ((error: string) => void)[] = [];
  private partialListeners: ((text: string) => void)[] = [];
  private finalListeners: ((text: string) => void)[] = [];

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
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('Web Speech Recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          this.transcript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Emit interim results (streaming)
      if (interimTranscript) {
        this.partialListeners.forEach(listener => listener(interimTranscript));
      }

      // Emit final results immediately
      if (finalTranscript) {
        this.finalListeners.forEach(listener => listener(finalTranscript.trim()));
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error;
      console.error('Speech recognition error:', error);

      // Handle specific error cases
      switch (error) {
        case 'no-speech':
          console.warn('No speech detected. Make sure your microphone is working and you are speaking clearly.');
          break;
        case 'audio-capture':
          console.error('No microphone found or microphone permission denied.');
          break;
        case 'network':
          console.error('Network error occurred during speech recognition.');
          break;
        default:
          console.error(`Speech recognition error: ${error}`);
      }

      // Notify error listeners
      this.errorListeners.forEach(listener => listener(error));
    };

    this.recognition.onend = () => {
      console.log('Web Speech Recognition ended, transcript:', this.transcript.trim() || 'empty');
      this.isListening = false;

      // Emit final transcript
      if (this.transcript.trim()) {
        this.listeners.forEach(listener => listener(this.transcript.trim()));
      } else {
        // No speech was captured - notify error listeners
        this.errorListeners.forEach(listener => listener('no-speech'));
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

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        this.listeners = this.listeners.filter(l => l !== listener);
      };

      const listener = (text: string) => {
        if (hasResolved) return;
        hasResolved = true;
        cleanup();
        resolve(text);
      };

      this.listeners.push(listener);

      try {
        this.recognition.start();
      } catch (error) {
        // Already listening or error starting
        console.warn('Recognition error:', error);
        reject(error);
        return;
      }

      // Timeout after 12 seconds
      timeoutId = setTimeout(() => {
        if (hasResolved) return;
        hasResolved = true;
        cleanup();
        try {
          this.recognition.stop();
        } catch (e) {
          // Already stopped
        }
        reject(new Error('No speech detected. Please speak clearly and try again.'));
      }, 12000);
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

  onError(listener: (error: string) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to partial (interim) transcription results in real-time
   */
  onPartialResult(listener: (text: string) => void): () => void {
    this.partialListeners.push(listener);
    return () => {
      this.partialListeners = this.partialListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to final transcription results
   */
  onFinalResult(listener: (text: string) => void): () => void {
    this.finalListeners.push(listener);
    return () => {
      this.finalListeners = this.finalListeners.filter(l => l !== listener);
    };
  }

  /**
   * Start streaming transcription (keeps listening, emits results as they come)
   * Use onPartialResult and onFinalResult to get results
   */
  async startStreaming(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Web Speech API not supported in this browser');
    }

    this.transcript = '';
    this.isListening = true;

    try {
      this.recognition.start();
      console.log('Web Speech Recognition streaming started');
    } catch (error) {
      console.warn('Recognition already in progress');
    }
  }

  /**
   * Stop streaming transcription and return accumulated transcript
   */
  async stopStreaming(): Promise<string> {
    if (!this.recognition) return this.transcript;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping streaming:', error);
    }

    return this.transcript.trim();
  }
}

export const webSpeechService = WebSpeechService.getInstance();
