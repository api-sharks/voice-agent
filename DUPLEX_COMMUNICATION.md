# Duplex Communication: Barge-in Implementation

This document describes how the Voice AI application implements duplex communication, enabling users to interrupt the bot while it's speaking (barge-in).

## Overview

The application supports simultaneous audio input and output, allowing natural conversation with the ability to interrupt. When the bot is speaking (via Web Speech API), the system monitors the microphone and detects when the user speaks loudly enough to interrupt, immediately stopping the bot's speech and processing the user's input.

## Architecture

### Services

#### `MicService` ([mic.service.ts](packages/web/src/app/core/services/mic.service.ts))
Manages microphone input via the Web Audio API.

- Captures audio at 16kHz mono (Whisper's expected sample rate)
- Enables **echo cancellation** via `getUserMedia` constraints to filter out bot audio
- Also enables **noise suppression** and **auto gain control** for cleaner input
- Calls a callback on each audio chunk (4096 samples ≈ 256ms at 16kHz)

```typescript
async start(callback: (data: Float32Array) => void): Promise<void> {
  this.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,  // Filter bot audio from mic
      noiseSuppression: true,
      autoGainControl: true
    }
  });
  // ... setup Web Audio API ...
  this.processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    callback(new Float32Array(input));
  };
}
```

#### `TtsService` ([tts.service.ts](packages/web/src/app/core/services/tts.service.ts))
Wraps the Web Speech API for text-to-speech.

- `speak(text)` — Start speaking
- `stop()` — Cancel speech immediately (used for barge-in)
- `speaking` getter — Check if audio is currently playing

#### `WhisperService` ([whisper.service.ts](packages/web/src/app/core/services/whisper.service.ts))
Converts audio chunks to text using Whisper.cpp WASM.

- Buffers audio and uses RMS-based voice activity detection
- Emits `utterance$` when a complete utterance is detected
- Processes incoming audio chunks one at a time

#### `AgentService` ([agent.service.ts](packages/web/src/app/core/services/agent.service.ts))
Conversational state machine for form collection.

- Asks for confirmation on each captured field
- Reads back values and accepts corrections
- Tracks state: asking → confirming → summary → completed

### Component Logic

#### `VoiceFormComponent` ([voice-form.component.ts](packages/web/src/app/features/voice-form/voice-form.component.ts))
Orchestrates the entire voice flow, including barge-in detection.

**Barge-in Detection:**

```typescript
const BARGE_IN_RMS = 0.04;      // RMS energy threshold
const BARGE_IN_CHUNKS = 2;      // ~0.5s at 16kHz

private onAudioChunk(audio: Float32Array): void {
  if (!this.tts.speaking) {
    // Bot not talking: transcribe normally
    this.bargeInChunks = [];
    this.whisper.process(audio);
    return;
  }

  // Bot is talking: listen for interruption
  if (this.rms(audio) > BARGE_IN_RMS) {
    // User is loud enough to interrupt
    this.bargeInChunks.push(audio);
    if (this.bargeInChunks.length >= BARGE_IN_CHUNKS) {
      // Sustained loud audio detected: stop bot
      this.tts.stop();
      // Send buffered chunks to Whisper
      for (const chunk of this.bargeInChunks) {
        this.whisper.process(chunk);
      }
      this.bargeInChunks = [];
    }
  } else {
    // Sound level dropped: reset buffer
    this.bargeInChunks = [];
  }
}

private rms(audio: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < audio.length; i++) {
    sum += audio[i] * audio[i];
  }
  return Math.sqrt(sum / audio.length);
}
```

## How Barge-in Works

1. **User speaks while bot is speaking**
   - Mic captures audio chunks continuously
   - RMS energy is calculated for each chunk

2. **Energy threshold met**
   - If RMS > 0.04, the chunk is buffered
   - Detection requires 2 consecutive loud chunks (~0.5s sustained speech)

3. **Barge-in triggered**
   - `tts.stop()` cancels the bot's speech immediately
   - Buffered chunks are sent to Whisper for transcription
   - Barge-in buffer is cleared

4. **Next turn**
   - User's speech is transcribed
   - Agent processes the interruption (usually a correction or "stop")
   - Flow continues normally

## Key Features

### Echo Cancellation
The browser's native echo cancellation (via `getUserMedia` constraints) filters most bot audio from the mic signal. This is why the barge-in threshold is higher (0.04) than Whisper's silence threshold (typically 0.02) — the bot's voice has been mostly removed by echo cancellation, so only the user's speech remains loud.

### Multi-stage Detection
Barge-in requires **sustained** speech (2+ chunks) to avoid false positives from noise or artifacts. A single loud chunk doesn't trigger it.

### Graceful Degradation
- If the browser doesn't support `echoCancellation`, the feature still works but sensitivity will vary
- Users with loud speakers or quiet microphones may need volume adjustment
- Web Speech API timeout is configured (recent improvements increased from 5s default)

## Configuration

To adjust barge-in sensitivity:

| Parameter | Value | Effect |
|-----------|-------|--------|
| `BARGE_IN_RMS` | 0.04 | Energy threshold (higher = harder to trigger) |
| `BARGE_IN_CHUNKS` | 2 | Sustain duration in chunks; 1 chunk ≈ 256ms at 16kHz |

Example adjustments:

```typescript
// More sensitive (easier to interrupt)
const BARGE_IN_RMS = 0.02;      // Lower threshold
const BARGE_IN_CHUNKS = 1;      // Faster detection (256ms)

// Less sensitive (require louder/longer speech)
const BARGE_IN_RMS = 0.06;      // Higher threshold
const BARGE_IN_CHUNKS = 4;      // Longer sustain (1s)
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Web Speech API (TTS) | ✅ | ✅ | ✅ | ✅ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ |
| Echo Cancellation | ✅ | ✅ | ✅ | ✅ |
| Noise Suppression | ✅ | ✅ | ⚠️ limited | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### Barge-in Not Working

**Problem:** Interruptions aren't being detected.

**Cause & Solution:**
1. **Speaker volume too low** — Bot audio is too quiet for user to speak over
   - Increase speaker/system volume
   - Test in a quiet environment
   
2. **Microphone too far away** — User's voice is too quiet relative to bot
   - Move closer to the microphone
   - Check mic input levels in system settings
   
3. **Threshold too high** — Lower the `BARGE_IN_RMS` constant
   - Reduce from 0.04 to 0.03 or 0.02
   - Reduce `BARGE_IN_CHUNKS` from 2 to 1
   
4. **Echo cancellation fighting you** — On some hardware, echo cancellation filters user speech too
   - Test without echo cancellation (remove from `getUserMedia` constraints)

### Barge-in Too Sensitive

**Problem:** Every small sound triggers an interruption.

**Cause & Solution:**
1. **Threshold too low** — Increase `BARGE_IN_RMS`
   - Increase from 0.04 to 0.05 or 0.06
   
2. **Noisy environment** — Background noise registers as speech
   - Move to a quieter location
   - Increase `BARGE_IN_CHUNKS` from 2 to 3 or 4 (requires longer sustained sound)
   
3. **Loud fan/AC** — Constant background noise
   - Disable `noiseSuppression` if the browser's implementation isn't helping
   - Or increase threshold further

### Web Speech API Timing Out

**Problem:** Bot stops speaking before finishing.

**Cause:** Web Speech API has internal timeouts (browser-dependent).

**Solution:** Already implemented — recent updates increased timeout handling for longer utterances.

## Performance Notes

- **Latency:** Barge-in detection is ~256ms (one audio chunk) after the threshold is met; actual interrupt stops speech in the next 50-100ms
- **CPU:** Negligible — RMS calculation is lightweight
- **Memory:** Barge-in buffer holds at most 2-4 chunks (~32-64KB each)

## Future Improvements

- [ ] Configurable RMS threshold via UI
- [ ] Real-time RMS visualization for debugging
- [ ] Adaptive threshold based on environment noise
- [ ] Machine learning-based VAD (more accurate than RMS)
- [ ] Speaker diarization (distinguish user from bot)

## References

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Root Mean Square (RMS)](https://en.wikipedia.org/wiki/Root_mean_square)
