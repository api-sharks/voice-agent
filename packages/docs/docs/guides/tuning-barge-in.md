---
title: Tuning Barge-in
---

# Tuning Guide: Optimize Barge-in for Your Environment

This guide walks you through fine-tuning barge-in detection for different environments and use cases.

## Quick Diagnostics

Before tuning, run this diagnostic:

1. **Start the app** — `npm start` → http://localhost:4200
2. **Open DevTools** — F12 → Console tab
3. **Click Start** in the app
4. **Wait for bot to speak** (first greeting)
5. **Speak over the bot** — Try different volumes
6. **Check console output** — Look for barge-in events

## Tuning Parameters

### `BARGE_IN_RMS`
**Current value:** `0.04`

Energy threshold (Root Mean Square) below which audio is considered quiet.

- **0.02** — Very sensitive (easy to trigger on small sounds)
- **0.04** — Balanced (default, works for most)
- **0.06** — Less sensitive (requires louder speech)
- **0.08** — Very insensitive (only very loud speech triggers)

### `BARGE_IN_CHUNKS`
**Current value:** `2`

Number of consecutive loud chunks required to trigger barge-in. Each chunk ≈ 256ms at 16kHz.

- **1** — Fast (~256ms) but prone to false positives
- **2** — Balanced (~500ms, default)
- **3** — Longer (~750ms) for noisier environments
- **4** — Very long (~1s) for very noisy places

## Scenarios

### Scenario 1: Home Office (Ideal)

**Environment:** Quiet, good mic, good speakers

**Initial test:**
- Bot speaks greeting
- User speaks at normal volume
- Does barge-in work? ✅ Yes

**Action:** Keep defaults. No tuning needed.

**Defaults:**
```typescript
const BARGE_IN_RMS = 0.04;
const BARGE_IN_CHUNKS = 2;
```

### Scenario 2: Noisy Office (False Positives)

**Environment:** Open office, traffic sounds, people talking

**Symptom:** Keyboard clicks or conversation trigger interruptions

**Diagnosis:**
- Each time someone talks nearby, bot stops

**Solution:**
1. **Increase `BARGE_IN_RMS`** to 0.05 or 0.06
2. **Increase `BARGE_IN_CHUNKS`** to 3 or 4
3. **Test:** Ambient noise should not trigger, your speech should

**Recommended:**
```typescript
const BARGE_IN_RMS = 0.05;
const BARGE_IN_CHUNKS = 3;
```

### Scenario 3: Quiet Voice (Won't Detect)

**Environment:** User has soft voice, or mic is far away

**Symptom:** Barge-in doesn't trigger even when user speaks

**Diagnosis:**
- User's RMS never exceeds 0.04
- Check mic input levels in system settings

**Solutions (in priority order):**
1. **Move mic closer** (best)
2. **Increase speaker volume** (so user must speak louder)
3. **Lower `BARGE_IN_RMS`** to 0.03 or 0.02
4. **Lower `BARGE_IN_CHUNKS`** to 1

**Recommended:**
```typescript
const BARGE_IN_RMS = 0.03;
const BARGE_IN_CHUNKS = 1;
```

### Scenario 4: Mobile Phone (Weak Echo Cancellation)

**Environment:** Smartphone with weaker echo cancellation

**Symptom:** Barge-in doesn't work well, or works inconsistently

**Diagnosis:**
- Phone's echo cancellation filters too much user speech
- Speaker is too quiet on phones

**Solutions:**
1. **Increase phone speaker volume** to max
2. **Lower `BARGE_IN_RMS`** to 0.02 or 0.01
3. **Reduce `BARGE_IN_CHUNKS`** to 1
4. **Hold phone closer** when speaking

**Recommended (for mobile):**
```typescript
const BARGE_IN_RMS = 0.02;
const BARGE_IN_CHUNKS = 1;
```

### Scenario 5: Noisy Environment (Loud Places)

**Environment:** Coffee shop, street, car

**Symptom:** Everything triggers barge-in, or nothing does

**Diagnosis:**
- Ambient noise is high: ~0.05-0.08 RMS baseline
- Impossible to distinguish user from background

**Recommendation:**
Barge-in is **not suitable** for loud environments. Consider alternatives:
- Use a noise-cancelling microphone (wired or Bluetooth)
- Move to a quieter location
- Use push-to-talk instead of barge-in

**If you must tune:**
```typescript
const BARGE_IN_RMS = 0.08;      // Very high threshold
const BARGE_IN_CHUNKS = 4;      // Long sustain
```

## Step-by-Step Tuning Process

### Step 1: Establish Baseline

1. Open DevTools Console
2. Add temporary logging in `VoiceFormComponent.onAudioChunk()`:
   ```typescript
   private onAudioChunk(audio: Float32Array): void {
     const rmsValue = this.rms(audio);
     console.log('RMS:', rmsValue.toFixed(3), 'Speaking:', this.tts.speaking);
     // ... rest of method
   }
   ```

3. Run the app, let bot speak
4. **Note the RMS values:**
   - Silence: 0.002 - 0.01
   - Background noise: 0.01 - 0.02
   - Quiet speech: 0.02 - 0.04
   - Normal speech: 0.04 - 0.08
   - Loud speech: 0.08 - 0.15

### Step 2: Calculate Target Threshold

**Formula:**
```
BARGE_IN_RMS = (max noise RMS + min user speech RMS) / 2
```

**Example:**
- Ambient noise peaks at 0.02
- Quiet user speech is 0.03
- Target: (0.02 + 0.03) / 2 = 0.025

### Step 3: Test and Iterate

1. Set threshold (e.g., 0.025)
2. Test multiple times:
   - Speak over bot at normal volume — should trigger
   - Stay silent while bot speaks — should not trigger
   - Cough or make noise — should not trigger
3. If false positives: increase by 0.01
4. If misses: decrease by 0.01
5. Repeat until happy

### Step 4: Adjust Chunk Count

Once threshold is set:
1. Set `BARGE_IN_CHUNKS = 1`
2. Test: Feel responsive?
3. If false positives: increase to 2 or 3
4. Repeat

## Advanced: Adaptive Threshold

For production, consider making threshold adaptive:

```typescript
// Measure noise floor during startup
private noiseFloor = 0.01;

async start(): Promise<void> {
  // Listen for 1 second of ambient noise
  const silenceRMS = await this.measureAmbientNoise();
  this.BARGE_IN_RMS = silenceRMS * 2; // 2x noise floor
}

private async measureAmbientNoise(): Promise<number> {
  // Capture audio for 1 second, return max RMS
  // ...
}
```

## Monitoring in Production

### Metrics to Track

- **Barge-in success rate** — % of attempts that trigger
- **False positives** — Interrupts when user wasn't speaking
- **False negatives** — User speaks but doesn't interrupt
- **User satisfaction** — Does it feel responsive?

### Logging Template

```typescript
private onBargeInDetected(): void {
  console.log({
    timestamp: new Date(),
    rms: this.currentRMS,
    chunks: this.bargeInChunks.length,
    utterance: 'will-be-set-after-whisper'
  });
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Only tuning RMS | Ignores chunk count impact | Tune both together |
| Not testing in target environment | Settings work at home, fail on mobile | Test in real conditions |
| Tuning while bot is quiet | Threshold makes sense, but bot's voice is loud | Test with actual bot output |
| Using single sample | One test isn't representative | Test 10+ times |
| Not considering speaker output | Threshold too high because speakers are loud | Use realistic speaker volume |

## Checklist

- [ ] Installed app and tested default behavior
- [ ] Ran diagnostics (console logging)
- [ ] Measured ambient noise and user speech RMS
- [ ] Calculated initial threshold
- [ ] Tested normal speech (should trigger)
- [ ] Tested silence (should not trigger)
- [ ] Tested ambient noise (should not trigger)
- [ ] Adjusted chunk count for feel
- [ ] Verified no false positives in 10+ tests
- [ ] Deployed and monitored

---

**Next:** [Troubleshooting](../guides/troubleshooting) | [Barge-in Feature](../features/barge-in)
