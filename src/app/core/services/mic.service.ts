import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MicService {
  private context?: AudioContext;
  private processor?: ScriptProcessorNode;
  private source?: MediaStreamAudioSourceNode;
  private stream?: MediaStream;

  async start(callback: (data: Float32Array) => void): Promise<void> {
    if (this.processor) {
      return;
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.context = new AudioContext();
    this.source = this.context.createMediaStreamSource(this.stream);
    this.processor = this.context.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
      const input = event.inputBuffer.getChannelData(0);
      callback(new Float32Array(input));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.context.destination);
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close();

    this.processor = undefined;
    this.source = undefined;
    this.stream = undefined;
    this.context = undefined;
  }
}
