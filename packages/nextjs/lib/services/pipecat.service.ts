'use client';

export interface PipecatMessage {
  type: 'audio' | 'transcription' | 'text' | 'status' | 'error';
  text?: string;
  data?: number[];
  error?: string;
}

export class PipecatService {
  private static instance: PipecatService;
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageListeners: ((message: PipecatMessage) => void)[] = [];
  private statusListeners: ((status: string) => void)[] = [];

  private constructor(url: string = 'ws://localhost:8765') {
    this.url = url;
  }

  static getInstance(url?: string): PipecatService {
    if (!PipecatService.instance) {
      PipecatService.instance = new PipecatService(url);
    }
    return PipecatService.instance;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to Pipecat server at ${this.url}...`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('Connected to Pipecat server');
          this.reconnectAttempts = 0;
          this.emitStatus('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: PipecatMessage = JSON.parse(event.data);
            console.log('Received from Pipecat:', message);
            this.messageListeners.forEach(listener => listener(message));
          } catch (error) {
            console.error('Failed to parse Pipecat message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emitStatus('error');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from Pipecat server');
          this.emitStatus('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emitStatus('connection_failed');
    }
  }

  sendAudio(audioData: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Convert Float32Array to regular array for JSON serialization
    const data = Array.from(audioData);

    const message: PipecatMessage = {
      type: 'audio',
      data,
    };

    this.ws.send(JSON.stringify(message));
  }

  interrupt(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const message: PipecatMessage = {
      type: 'audio',
      text: 'interrupt',
    };

    this.ws.send(JSON.stringify(message));
  }

  onMessage(listener: (message: PipecatMessage) => void): () => void {
    this.messageListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  onStatus(listener: (status: string) => void): () => void {
    this.statusListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private emitStatus(status: string): void {
    this.statusListeners.forEach(listener => listener(status));
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getStatus(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

export const pipecatService = PipecatService.getInstance();
