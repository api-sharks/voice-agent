---
title: Troubleshooting
---

# Troubleshooting

Common issues and solutions.

## Microphone Issues

| Symptom | Solution |
|---------|----------|
| Permission denied | Allow mic in browser settings, reload |
| No sound input | Check mic is plugged in, not muted |
| Very quiet input | Move closer to mic, check levels |

## Whisper Issues

| Symptom | Solution |
|---------|----------|
| Loads very slowly | First load is ~5s (normal); cached after |
| Doesn't transcribe | Check console for errors, check mic input |
| Wrong language | Change LANGUAGE in WhisperService |

## Barge-in Issues

See [Barge-in Troubleshooting](../features/barge-in.md#troubleshooting).

## TTS Issues

| Symptom | Solution |
|---------|----------|
| Can't hear bot | Check speaker volume, unmute browser |
| Bot speaks too fast/slow | Check browser speech synthesis settings |

---

Not listed? Open a [GitHub Issue](https://github.com/yourusername/voice-agent/issues).
