'use client';

/**
 * Enhanced audio service with duplex (bidirectional) communication support
 * - Simultaneous recording and playback
 * - Barge-in detection (user interrupts bot)
 * - Echo cancellation
 * - Real-time audio streaming
 */

export interface DuplexAudioConfig {
  enableEchoCancellation?: boolean;
  enableNoiseSuppression?: boolean;
  enableAutoGainControl?: boolean;
  bargeInThreshold?: number; // RMS threshold for barge-in detection
  enableVAD?: boolean; // Voice Activity Detection
}

export interface BargeInEvent {
  detected: boolean;
  timestamp: number;
  rms: number;
}

export class DuplexAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private isSpeaking = false;
  private bargeInListeners: ((event: BargeInEvent) => void)[] = [];
  private config: DuplexAudioConfig;
  private recordedChunks: Blob[] = [];
  private silenceStart = 0;
  private speechDetected = false;

  constructor(config: DuplexAudioConfig = {}) {
    this.config = {
      enableEchoCancellation: config.enableEchoCancellation ?? true,
      enableNoiseSuppression: config.enableNoiseSuppression ?? true,
      enableAutoGainControl: config.enableAutoGainControl ?? true,
      bargeInThreshold: config.bargeInThreshold ?? 0.02,
      enableVAD: config.enableVAD ?? true,
    };
  }

  /**
   * Start recording with full duplex support
   * Audio is processed for echo cancellation and VAD
   */
  async startRecording(): Promise<void> {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config.enableEchoCancellation,
          noiseSuppression: this.config.enableNoiseSuppression,
          autoGainControl: this.config.enableAutoGainControl,
          sampleRate: 16000,
        },
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);

      // Create analyser for real-time audio analysis (VAD and barge-in detection)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      // Start monitoring for speech activity
      this.monitorAudioActivity();

      // Set up media recorder for audio capture
      this.mediaRecorder = new MediaRecorder(this.audioStream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        this.recordedChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      console.log('[DuplexAudio] Recording started with echo cancellation enabled');
    } catch (error) {
      console.error('[DuplexAudio] Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Monitor audio input for voice activity and barge-in detection
   */
  private monitorAudioActivity(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const checkInterval = setInterval(() => {
      if (!this.isRecording || !this.analyser) {
        clearInterval(checkInterval);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate RMS (Root Mean Square) for volume detection
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length) / 255;

      // VAD: Detect speech
      const threshold = this.config.bargeInThreshold ?? 0.02;
      if (rms > threshold) {
        this.speechDetected = true;
        this.silenceStart = 0;

        // Barge-in detection: if bot is speaking and user starts speaking
        if (this.isSpeaking) {
          this.notifyBargeIn({
            detected: true,
            timestamp: Date.now(),
            rms,
          });
        }
      } else {
        // Silence detected
        if (this.speechDetected) {
          this.silenceStart++;
        }

        // If silence lasts > 0.5s, consider speech ended
        if (this.silenceStart > 10) {
          this.speechDetected = false;
        }
      }
    }, 50); // Check every 50ms
  }

  /**
   * Notify listeners of barge-in event
   */
  private notifyBargeIn(event: BargeInEvent): void {
    this.bargeInListeners.forEach(listener => listener(event));
  }

  /**
   * Register callback for barge-in events
   */
  onBargeIn(callback: (event: BargeInEvent) => void): () => void {
    this.bargeInListeners.push(callback);
    return () => {
      this.bargeInListeners = this.bargeInListeners.filter(l => l !== callback);
    };
  }

  /**
   * Stop recording and return audio blob
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/wav' });
        this.isRecording = false;

        if (this.audioStream) {
          this.audioStream.getTracks().forEach(track => track.stop());
        }

        if (this.audioContext) {
          this.audioContext.close();
        }

        console.log('[DuplexAudio] Recording stopped');
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Start TTS playback (marks bot as speaking for barge-in detection)
   */
  async speakText(text: string, lang: string = 'en-US'): Promise<void> {
    if (!('speechSynthesis' in window)) {
      console.error('[DuplexAudio] Speech synthesis not supported');
      return;
    }

    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('[DuplexAudio] TTS started - listening for barge-in');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      console.log('[DuplexAudio] TTS ended');
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);

    return new Promise((resolve) => {
      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };
    });
  }

  /**
   * Stop playback immediately
   */
  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Check if currently speaking
   */
  getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if user is currently speaking
   */
  getUserSpeakingStatus(): boolean {
    return this.speechDetected;
  }

  /**
   * Cancel recording
   */
  cancelRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.recordedChunks = [];
      this.isRecording = false;

      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
      }

      if (this.audioContext) {
        this.audioContext.close();
      }

      console.log('[DuplexAudio] Recording cancelled');
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): boolean {
    return this.isRecording;
  }
}

export const duplexAudioService = new DuplexAudioService();
