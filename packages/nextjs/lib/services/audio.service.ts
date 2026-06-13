'use client';

export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioStream: MediaStream | null = null;
  private isRecording = false;

  async startRecording(): Promise<void> {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.audioStream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.isRecording = false;

        if (this.audioStream) {
          this.audioStream.getTracks().forEach(track => track.stop());
        }

        console.log('Recording stopped');
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.audioChunks = [];
      this.isRecording = false;

      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
      }

      console.log('Recording cancelled');
    }
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  playAudio(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  }

  async speakText(text: string, lang: string = 'en-US'): Promise<void> {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  isSpeaking(): boolean {
    return 'speechSynthesis' in window ? window.speechSynthesis.speaking : false;
  }
}

export const audioService = new AudioService();
