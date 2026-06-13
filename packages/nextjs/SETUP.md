# Voice AI Setup & Configuration Guide

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

## First-Time Usage

### Step 1: Start the Application
The dev server will start at `http://localhost:3000`

### Step 2: Initialize the Engine
- Click "Initialize Engine" button
- First load downloads the LLM model (~400MB - 3.5GB)
- This can take 2-5 minutes depending on model size
- Subsequent loads use cached model (much faster)

### Step 3: Start Speaking
- Click the microphone button to record
- Speak naturally into your microphone
- Click "Stop Recording" when done
- AI will transcribe, generate response, and speak back

## Configuration Options

### Change LLM Model

Edit `components/VoiceChat.tsx` line ~90:

```typescript
await webllmService.initialize('MODEL_ID', (progress) => {
```

#### Available Models

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC | 400MB | Fast | Good |
| Mistral-7B-Instruct-v0.2-q4f16_1-MLC | 3.5GB | Slower | Better |
| Llama-2-7b-chat-hf-q4f32_1-MLC | 3.5GB | Slower | Better |

**Recommendation for first-time:** Use `TinyLlama-1.1B` (default)

### Change Whisper Model

Edit `lib/services/whisper.service.ts` line ~18:

```typescript
transcriber = await pipeline('automatic-speech-recognition', 'MODEL_NAME');
```

#### Available Models

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| Xenova/whisper-tiny | 75MB | Very Fast | Fair |
| Xenova/whisper-base | 140MB | Fast | Good |
| Xenova/whisper-small | 450MB | Medium | Very Good |
| Xenova/whisper-medium | 1.5GB | Slow | Excellent |
| Xenova/whisper-large | 3.1GB | Very Slow | Best |

**Recommendation for first-time:** Use `whisper-tiny` (default)

### Customize Audio Settings

Edit `lib/services/audio.service.ts` in `startRecording()`:

```typescript
const audioStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,      // Reduce echo
    noiseSuppression: true,      // Reduce background noise
    autoGainControl: true,       // Auto volume
    sampleRate: 16000,           // Keep at 16kHz for Whisper
  },
});
```

### Customize System Prompt

Edit `components/VoiceChat.tsx` in `handleStopRecording()`:

```typescript
const llmMessages: LLMMessage[] = [
  {
    role: 'system',
    content: 'Your custom system prompt here',
  },
  // ...rest
];
```

## Browser Requirements

### Required Features
- ✅ Web Audio API (for recording)
- ✅ MediaRecorder API (for audio processing)
- ✅ WebAssembly (WASM) support
- ✅ Web Workers (for model inference)
- ✅ IndexedDB (for model caching)

### Recommended Hardware
- CPU: Modern processor (Intel i5+ / AMD Ryzen 5+)
- RAM: 4GB+ (8GB+ for larger models)
- Storage: 5GB+ free space
- Internet: 10+ Mbps for downloads

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 15+

## Troubleshooting

### Issue: "Model initialization is slow"
**Cause:** First-time download of large model files
**Solution:** 
- Use smaller model (`TinyLlama-1.1B`)
- Check internet speed
- Wait 5-10 minutes for large models

### Issue: "Microphone permission denied"
**Cause:** Browser permission not granted
**Solution:**
- Allow microphone access when prompted
- Check browser settings: Settings → Privacy → Microphone
- Try in incognito mode

### Issue: "No speech detected"
**Cause:** Quiet speech or high background noise
**Solution:**
- Speak clearly and louder
- Reduce background noise
- Ensure microphone is working

### Issue: "Memory error or app crashes"
**Cause:** Insufficient RAM for model
**Solution:**
- Use smaller model
- Close other browser tabs
- Increase available RAM
- Use mobile device with 4GB+ RAM

### Issue: "WASM not supported"
**Cause:** Browser doesn't support WebAssembly
**Solution:**
- Update browser to latest version
- Try different browser
- Use Chrome/Firefox for best support

### Issue: "Model download fails"
**Cause:** Network interruption or browser storage full
**Solution:**
- Check internet connection
- Clear browser cache/storage
- Try disabling VPN/proxy
- Increase storage space

## Performance Tips

### For Better Transcription
- Speak clearly and naturally
- Minimize background noise
- Keep pauses short (< 2 seconds)
- Use `whisper-base` or larger for better accuracy

### For Faster Responses
- Use `TinyLlama-1.1B` model
- Adjust temperature (lower = faster, more predictable)
- Keep conversation history small (clear periodically)

### For Smoother Experience
- Pre-warm models on page load
- Use smaller batch sizes
- Monitor browser memory usage
- Clear messages periodically

## Advanced Configuration

### Enable Streaming Responses

Modify `components/VoiceChat.tsx` to use streaming:

```typescript
// Replace generateResponse with streamResponse
let fullResponse = '';
await webllmService.streamResponse(llmMessages, (chunk) => {
  fullResponse += chunk;
  // Update UI incrementally
});
```

### Custom System Prompt for Different Personalities

Create different prompts:

```typescript
const prompts = {
  assistant: 'You are a helpful assistant...',
  creative: 'You are a creative writer...',
  technical: 'You are a technical expert...',
};
```

### Language Configuration

Change TTS language:

```typescript
await audioService.speakText(text, 'es-ES');  // Spanish
await audioService.speakText(text, 'fr-FR');  // French
await audioService.speakText(text, 'de-DE');  // German
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_DEFAULT_MODEL=TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC
NEXT_PUBLIC_WHISPER_MODEL=Xenova/whisper-tiny
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel deploy
```

**Note:** Ensure Vercel project settings include:
- Increase build timeout (15+ minutes)
- Add environment variables if using custom models

### Self-Hosted (Node.js)

```bash
npm run build
npm run start
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t voice-ai .
docker run -p 3000:3000 voice-ai
```

## Storage Requirements

### IndexedDB Usage
- Whisper-tiny: ~300MB
- Whisper-base: ~140MB
- TinyLlama-1.1B: ~400MB
- Mistral-7B: ~3.5GB

**Total recommendation:** 5GB+ free space

### Clear Cache if Needed

Browser DevTools:
1. F12 → Application
2. Storage → IndexedDB
3. Select database → Delete

## Monitoring & Debugging

### Check Browser Console
```javascript
// In browser console
localStorage.getItem('models')      // View cached models
indexedDB.databases()               // List IndexedDB stores
performance.now()                   // Check timing
```

### Monitor Network
- DevTools → Network tab
- Filter by type (wasm, xhr)
- Check download progress

### Check Memory Usage
- DevTools → Performance
- Record and check memory graph
- Look for memory leaks

## Getting Help

1. Check [README.md](./README.md) for overview
2. Check [CLAUDE.md](./CLAUDE.md) for architecture
3. Check console logs for errors
4. Try smaller models first
5. Check browser compatibility

## Next Steps

- Customize UI colors in `components/VoiceChat.tsx`
- Adjust system prompt for different use cases
- Experiment with different model combinations
- Deploy to Vercel or self-hosted
