import { Injectable } from '@angular/core';
import { WHISPER_SAMPLE_RATE } from './whisper.service';

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

    // echoCancellation keeps the assistant's TTS voice (played through the
    // speakers) out of the mic signal as much as the platform allows
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    // Whisper expects 16kHz mono; the browser resamples the mic input for us
    this.context = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE });
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
