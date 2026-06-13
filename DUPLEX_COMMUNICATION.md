# Duplex Communication Improvements

This document describes the enhanced bidirectional (duplex) communication features implemented in the Voice AI application.

## Overview

Duplex communication enables simultaneous audio input and output, allowing users to interrupt the bot while it's speaking (barge-in), with automatic echo cancellation and improved voice activity detection.

## Features

### 1. **Barge-in Detection**

Users can interrupt the bot while it's speaking. The system detects when user speech starts while the bot is playing audio.

- **How it works:**
  - Monitors microphone input while TTS is active
  - Detects sudden increase in audio energy (RMS > threshold)
  - Stops bot speech immediately and restarts listening

- **Configuration:**
  ```typescript
  const config: DuplexAudioConfig = {
    bargeInThreshold: 0.02, // RMS threshold for barge-in
  };
  ```

### 2. **Echo Cancellation**

Browser's built-in echo cancellation removes feedback when user speaks over bot audio.

- **How it works:**
  - Enabled via `getUserMedia` constraints: `echoCancellation: true`
  - Filters bot audio from microphone input
  - Combined with noise suppression for cleaner audio

- **Configuration:**
  ```typescript
  const config: DuplexAudioConfig = {
    enableEchoCancellation: true,
    enableNoiseSuppression: true,
    enableAutoGainControl: true,
  };
  ```

### 3. **Real-time Audio Streaming**

Continuous monitoring of audio input for voice activity and barge-in detection.

- **How it works:**
  - Web Audio API `AnalyserNode` for frequency analysis
  - 50ms interval checks for audio activity
  - No latency - immediate response to user speech

### 4. **Enhanced Voice Activity Detection (VAD)**

Improved speech detection using energy-based analysis with confidence scoring.

- **How it works:**
  - Calculates RMS (Root Mean Square) energy from audio
  - Compares against configurable threshold
  - Tracks minimum speech duration and silence duration
  - Returns confidence level (0-1)

- **Configuration:**
  ```typescript
  const vadConfig: VADConfig = {
    threshold: 0.02,           // Energy threshold
    minSpeechDuration: 200,    // Min speech length (ms)
    minSilenceDuration: 500,   // Min silence length (ms)
  };
  ```

### 5. **Overlapping Speech Handling**

System detects when user speaks while bot is speaking and handles it gracefully.

- **How it works:**
  - VAD tracks user speaking status continuously
  - Barge-in detector alerts when overlap occurs
  - Bot speech is stopped, clearing way for user input
  - Next turn begins without repetition

## Architecture

### Services

#### `DuplexAudioService`
- Handles recording, playback, and real-time monitoring
- Manages barge-in events
- Provides echo cancellation support

```typescript
import { duplexAudioService, type BargeInEvent } from '@/lib/services';

// Register for barge-in events
const unsubscribe = duplexAudioService.onBargeIn((event: BargeInEvent) => {
  console.log('Barge-in detected at RMS:', event.rms);
  duplexAudioService.stopSpeaking();
});
```

#### `VADService`
- Real-time voice activity detection
- Energy-based analysis with confidence scoring
- Configurable thresholds

```typescript
import { vadService, type VADEvent } from '@/lib/services';

// Listen for VAD state changes
const unsubscribe = vadService.onVADChange((event: VADEvent) => {
  console.log('User speaking:', event.isSpeaking);
  console.log('Confidence:', event.confidence);
});
```

## Components

### `VoiceChatDuplex`
Enhanced voice chat component with duplex features.

- Visual indicators for:
  - Bot speaking (blue pulse)
  - User speaking (amber pulse)
  - Barge-in detected (orange bounce)
  
- Real-time status updates in header

## Usage

### Enable Duplex Features

```typescript
// 1. Import duplex service
import { duplexAudioService } from '@/lib/services';

// 2. Start recording with duplex support
await duplexAudioService.startRecording();

// 3. Register for barge-in events
duplexAudioService.onBargeIn((event) => {
  if (event.detected) {
    // Stop bot speech on interrupt
    duplexAudioService.stopSpeaking();
  }
});

// 4. Speak text with barge-in support
await duplexAudioService.speakText('Hello user!');

// 5. Stop recording
await duplexAudioService.stopRecording();
```

### Configure VAD

```typescript
import { VADService } from '@/lib/services';

const vad = new VADService({
  threshold: 0.03,              // Higher = less sensitive
  minSpeechDuration: 300,       // Wait 300ms before confirming speech
  minSilenceDuration: 800,      // Wait 800ms before confirming silence
});
```

## Performance Metrics

### Latency
- **Barge-in detection:** ~50ms (50ms check interval)
- **VAD response:** ~100ms (from speech start to detection)
- **Echo cancellation:** Real-time (hardware-assisted)

### Compatibility
- **Desktop:** Chrome, Firefox, Safari, Edge (all modern versions)
- **Mobile:** iOS Safari, Chrome Android (with limitations)
- **Echo cancellation:** Supported on all devices with `getUserMedia`

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Echo Cancellation | ✅ | ✅ | ✅ | ✅ |
| Noise Suppression | ✅ | ✅ | ⚠️ | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Media Recorder | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### Barge-in Not Detecting

**Problem:** User speech isn't detected while bot is speaking.

**Solution:** 
1. Increase speaker volume (bot audio needs to be loud enough for barge-in)
2. Adjust `bargeInThreshold` (lower = more sensitive):
   ```typescript
   new DuplexAudioService({ bargeInThreshold: 0.01 });
   ```
3. Check microphone permissions and input levels

### Echo Not Cancelled

**Problem:** User hears bot audio echoing through microphone.

**Solution:**
1. Ensure speaker and mic aren't too close
2. Enable echo cancellation explicitly:
   ```typescript
   new DuplexAudioService({ enableEchoCancellation: true });
   ```
3. Test in DevTools: check `getUserMedia` constraints

### VAD Too Sensitive

**Problem:** Background noise triggers speech detection.

**Solution:**
1. Increase threshold:
   ```typescript
   new VADService({ threshold: 0.03 });
   ```
2. Increase min silence duration:
   ```typescript
   new VADService({ minSilenceDuration: 1000 });
   ```
3. Use in quiet environment

## Testing

### Manual Testing

1. Navigate to `/duplex` page
2. Initialize engine
3. Click "Start Listening"
4. Speak a phrase
5. While bot is responding, interrupt with "stop" or any other word
6. Observe barge-in indicator and bot speech stopping

### Automated Testing

```typescript
// Example test
describe('DuplexAudioService', () => {
  it('should detect barge-in when user speaks while bot is speaking', async () => {
    const service = new DuplexAudioService();
    let bargeInDetected = false;

    service.onBargeIn((event) => {
      bargeInDetected = event.detected;
    });

    await service.startRecording();
    service.speakText('Hello');
    
    // Simulate user speaking
    // ... audio injection ...

    expect(bargeInDetected).toBe(true);
  });
});
```

## Future Improvements

- [ ] Endpoint detection using more advanced ML models
- [ ] Opus codec for better compression and latency
- [ ] WebRTC data channels for network duplex
- [ ] Custom VAD using TensorFlow.js models
- [ ] Speaker diarization (distinguish multiple speakers)
- [ ] Sentiment analysis on interruptions

## References

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Speech Synthesis API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
