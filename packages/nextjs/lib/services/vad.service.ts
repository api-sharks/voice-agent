'use client';

/**
 * Voice Activity Detection (VAD) service for improved speech recognition
 * - Detects speech presence in audio stream
 * - Calculates confidence levels
 * - Manages silence detection
 */

export interface VADConfig {
  threshold?: number; // Energy threshold for speech
  minSpeechDuration?: number; // Minimum speech duration in ms
  minSilenceDuration?: number; // Minimum silence to consider speech ended
  sampleRate?: number;
}

export interface VADEvent {
  isSpeaking: boolean;
  confidence: number; // 0-1
  energy: number; // RMS energy
  timestamp: number;
}

export class VADService {
  private config: VADConfig;
  private isSpeaking = false;
  private speechStartTime = 0;
  private silenceStartTime = 0;
  private listeners: ((event: VADEvent) => void)[] = [];

  constructor(config: VADConfig = {}) {
    this.config = {
      threshold: config.threshold ?? 0.02,
      minSpeechDuration: config.minSpeechDuration ?? 200,
      minSilenceDuration: config.minSilenceDuration ?? 500,
      sampleRate: config.sampleRate ?? 16000,
    };
  }

  /**
   * Analyze audio chunk for voice activity
   */
  analyze(audioData: Float32Array): VADEvent {
    const energy = this.calculateEnergy(audioData);
    const confidence = this.calculateConfidence(energy);
    const threshold = this.config.threshold ?? 0.02;
    const now = Date.now();

    const wasSpeaking = this.isSpeaking;

    if (energy > threshold) {
      // Speech detected
      if (!this.isSpeaking) {
        this.speechStartTime = now;
      }
      this.isSpeaking = true;
      this.silenceStartTime = 0;
    } else {
      // Silence detected
      if (this.isSpeaking) {
        if (!this.silenceStartTime) {
          this.silenceStartTime = now;
        }

        const silenceDuration = now - this.silenceStartTime;
        const minSilence = this.config.minSilenceDuration ?? 500;

        if (silenceDuration > minSilence) {
          this.isSpeaking = false;
          this.silenceStartTime = 0;
        }
      }
    }

    const event: VADEvent = {
      isSpeaking: this.isSpeaking,
      confidence,
      energy,
      timestamp: now,
    };

    // Notify listeners on state change
    if (this.isSpeaking !== wasSpeaking) {
      this.notifyListeners(event);
    }

    return event;
  }

  /**
   * Calculate RMS energy from audio data
   */
  private calculateEnergy(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * Calculate confidence level (0-1)
   * Higher energy = higher confidence that speech is present
   */
  private calculateConfidence(energy: number): number {
    const threshold = this.config.threshold ?? 0.02;
    if (energy < threshold) return 0;
    if (energy > threshold * 5) return 1;
    return (energy - threshold) / (threshold * 4);
  }

  /**
   * Register listener for VAD events
   */
  onVADChange(callback: (event: VADEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify listeners of VAD state change
   */
  private notifyListeners(event: VADEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Get current speaking status
   */
  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Reset VAD state
   */
  reset(): void {
    this.isSpeaking = false;
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
  }
}

export const vadService = new VADService();
