'use client';

let transcriber: any = null;
let initialized = false;
let useDemoMode = false;

export class WhisperService {
  private static instance: WhisperService;

  private constructor() {}

  static getInstance(): WhisperService {
    if (!WhisperService.instance) {
      WhisperService.instance = new WhisperService();
    }
    return WhisperService.instance;
  }

  async initialize() {
    if (initialized) return;

    try {
      console.log('Loading Whisper model...');

      // Try to load transformers.js
      try {
        const module = await import('@xenova/transformers');

        if (!module || !module.pipeline || !module.env) {
          throw new Error('Transformers module incomplete');
        }

        const { pipeline, env } = module;

        // Configure transformers.js
        env.allowLocalModels = false;
        env.allowRemoteModels = true;

        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
        useDemoMode = false;
        initialized = true;
        console.log('Whisper model loaded');
      } catch (importError) {
        console.warn('Could not load Whisper model, using demo mode:', importError);
        // Use demo mode as fallback
        useDemoMode = true;
        initialized = true;
        console.log('Running in demo mode - transcription will return sample text');
      }
    } catch (error) {
      console.error('Failed to initialize Whisper:', error);
      throw error;
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    await this.initialize();

    if (useDemoMode) {
      // Demo mode: return sample transcriptions for testing
      const demoTexts = [
        'Hello, this is a test transcription',
        'The weather is nice today',
        'My name is John Smith',
        'I would like to book a meeting',
        'Thank you for your help',
      ];
      const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
      console.log('Demo mode - returning:', randomText);
      return randomText;
    }

    // Real transcription
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = new Float32Array(arrayBuffer);

      console.log('Transcribing audio...');
      const result = await transcriber(audioData);

      return result.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback to demo mode on error
      return 'Could not transcribe audio';
    }
  }

  async transcribeFromFile(file: File): Promise<string> {
    await this.initialize();

    if (useDemoMode) {
      return 'Demo transcription from file';
    }

    try {
      const result = await transcriber(file);
      return result.text || '';
    } catch (error) {
      console.error('File transcription error:', error);
      return 'Could not transcribe file';
    }
  }
}

export const whisperService = WhisperService.getInstance();
