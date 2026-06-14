---
title: Barge-in (Interrupt) Feature
---

# Barge-in: Interrupt Detection

Barge-in enables users to interrupt the bot mid-sentence by speaking loudly enough. The bot immediately stops and listens to the user's input.

## How It Works

### Detection Algorithm

```typescript
const BARGE_IN_RMS = 0.04;      // Energy threshold
const BARGE_IN_CHUNKS = 2;      // ~0.5s at 16kHz (4096 samples/chunk)

private onAudioChunk(audio: Float32Array): void {
  if (!this.tts.speaking) {
    // Bot not talking: transcribe normally
    this.bargeInChunks = [];
    this.whisper.process(audio);
    return;
  }

  // Bot is talking: listen for interruption
  if (this.rms(audio) > BARGE_IN_RMS) {
    this.bargeInChunks.push(audio);
    if (this.bargeInChunks.length >= BARGE_IN_CHUNKS) {
      // Sustained loud audio detected
      this.tts.stop();
      for (const chunk of this.bargeInChunks) {
        this.whisper.process(chunk);
      }
      this.bargeInChunks = [];
    }
  } else {
    // Sound level dropped
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

### Step-by-Step Execution

1. **User is quiet, bot is speaking**
   - RMS < 0.04: buffer is empty
   - Audio chunks ignored (not sent to Whisper)

2. **User starts speaking loudly**
   - RMS > 0.04 for chunk 1: buffer = [chunk1]
   - RMS > 0.04 for chunk 2: buffer = [chunk1, chunk2]

3. **Barge-in triggered**
   - `tts.stop()` cancels Web Speech API utterance immediately
   - Both chunks sent to Whisper for transcription
   - Buffer cleared

4. **Next turn**
   - Whisper detects user's utterance
   - Agent processes it
   - Normal flow resumes

## Echo Cancellation Effect

The `getUserMedia` constraint `echoCancellation: true` filters most bot audio from the mic signal. This is **critical** for barge-in to work:

- Without echo cancellation: bot's voice is ~0.1 RMS on speakers → hard to distinguish from user
- With echo cancellation: bot's voice is filtered → only user's speech remains loud

**Result:** The barge-in threshold (0.04) is higher than Whisper's silence detection (0.02) because echo cancellation removes bot audio.

## Latency

| Stage | Latency | Notes |
|-------|---------|-------|
| User speaks to RMS > threshold | ~0 | Real-time |
| RMS threshold to buffer full (2 chunks) | ~500ms | 2 × 256ms chunks |
| Buffer full to TTS stop | ~0 | Immediate |
| TTS stop to Whisper processing | ~10ms | Process buffered chunks |
| **Total barge-in latency** | ~500ms | User perceives ~half a second |

## Configuration

### Tuning the Threshold

Edit `VoiceFormComponent`:

```typescript
// More sensitive (easier to interrupt)
const BARGE_IN_RMS = 0.02;      // Lower threshold
const BARGE_IN_CHUNKS = 1;      // Faster detection (256ms)

// Less sensitive (require louder/longer speech)
const BARGE_IN_RMS = 0.06;      // Higher threshold
const BARGE_IN_CHUNKS = 4;      // Longer sustain (1s)
```

### When to Adjust

| Problem | Cause | Solution |
|---------|-------|----------|
| Won't interrupt | Speaker too quiet | Increase speaker volume **or** lower `BARGE_IN_RMS` |
| Interrupts on coughs/noise | Too sensitive | Increase `BARGE_IN_RMS` **or** increase `BARGE_IN_CHUNKS` |
| Slow to detect | Waiting for 2 chunks | Reduce `BARGE_IN_CHUNKS` to 1 |
| Takes too long | Waiting too long | Reduce both threshold and chunk count |

## Browser Compatibility

| Browser | Echo Cancellation | Noise Suppression | Status |
|---------|-------------------|-------------------|--------|
| Chrome | ✅ Hardware-assisted | ✅ | Full support |
| Firefox | ✅ Software | ✅ | Full support |
| Safari | ✅ Hardware-assisted | ⚠️ Limited | Works well |
| Edge | ✅ Hardware-assisted | ✅ | Full support |

**Key:** Hardware-assisted echo cancellation (Chrome, Safari, Edge) works better than software.

## Troubleshooting

### Barge-in Not Working

**Symptom:** Interruptions are not detected.

**Diagnosis:**
1. Check if speaker volume is loud enough
   - Bot output should be clearly audible
   - User should be able to speak over it

2. Open DevTools → Console
   - Speak while bot is speaking
   - Check if `tts.speaking` is true
   - Manually calculate RMS: if < 0.04, you're not loud enough

**Solutions (in order):**
1. **Increase speaker volume** (most common fix)
2. **Move microphone closer** to capture more user voice
3. **Reduce `BARGE_IN_RMS`** from 0.04 to 0.03
4. **Reduce `BARGE_IN_CHUNKS`** from 2 to 1 (faster detection)
5. **Check echo cancellation** — some hardware has issues
   - Try disabling: remove `echoCancellation: true` from `MicService`
   - If it helps, your hardware's echo cancellation is over-aggressive

### Too Sensitive (Interrupts on Noise)

**Symptom:** Background noise, coughs, or keyboard sounds trigger interruption.

**Solutions (in order):**
1. **Increase `BARGE_IN_RMS`** from 0.04 to 0.05 or 0.06
2. **Increase `BARGE_IN_CHUNKS`** from 2 to 3 or 4 (require longer sustained sound)
3. **Reduce background noise** — move to a quieter location
4. **Check `noiseSuppression`** — ensure enabled in `MicService`

### Works on Desktop but Not on Mobile

**Symptom:** Barge-in works on laptop but not on phone.

**Causes:**
1. **Phone speaker too quiet** — Mobile devices have lower speaker volume
2. **Phone mic too sensitive** — Picks up less ambient sound, more echo
3. **Echo cancellation hardware different** — Mobile echo cancellation varies

**Solutions:**
1. **Increase phone speaker volume** to maximum
2. **Hold phone closer** to speaker when testing
3. **Use headphones with mic** if available (removes echo issue)
4. **Relax thresholds** — increase `BARGE_IN_CHUNKS` to 3 or 4

## Use Cases

### When Barge-in Shines
- **Interactive forms** — "Can I correct you? Yes, my city is Mumbai."
- **Quick interactions** — User knows what to say; wants to interrupt preamble
- **Hands-free** — User multitasking; speaks when ready

### When Barge-in Struggles
- **Noisy environments** — Coffee shop, traffic (false positives)
- **Whisper-quiet speech** — User mumbling (doesn't trigger)
- **Overlapping speech** — Multiple people talking (unpredictable)

## Performance Impact

- **CPU:** Negligible — RMS calculation is O(n) per chunk
- **Memory:** Minimal — Buffer holds max 4 chunks (~64KB)
- **Latency:** ~500ms (by design)

## Future Improvements

- [ ] Configurable thresholds via UI (not just code)
- [ ] Real-time RMS visualization for tuning
- [ ] Adaptive threshold based on ambient noise
- [ ] ML-based VAD for more accurate detection
- [ ] Speaker diarization (distinguish user from others)

---

**See also:** [Troubleshooting Guide](../guides/troubleshooting) | [Tuning Guide](../guides/tuning-barge-in)
