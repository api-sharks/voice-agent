'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FullScreenContainer,
  ControlBar,
  SpinLoader,
  ErrorCard,
} from '@pipecat-ai/voice-ui-kit';
import { webSpeechService } from '@/lib/services/web-speech.service';
import { webllmService, duplexAudioService, vadService, audioService, type LLMMessage } from '@/lib/services';
import type { BargeInEvent, VADEvent } from '@/lib/services';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VoiceChatDuplex() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState('');
  const [engineReady, setEngineReady] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const [error, setError] = useState<string>('');
  const [bargeInDetected, setBargeInDetected] = useState(false);
  const [userSpeakingStatus, setUserSpeakingStatus] = useState(false);
  const [botSpeakingStatus, setBotSpeakingStatus] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');

  const loopModeRef = useRef(false);
  const bargeInUnsubscribe = useRef<(() => void) | null>(null);
  const vadUnsubscribe = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingActiveRef = useRef(false);
  const partialTranscriptRef = useRef('');
  const unsubscribesRef = useRef<Array<() => void>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);

  // Set up barge-in and VAD listeners
  useEffect(() => {
    bargeInUnsubscribe.current = duplexAudioService.onBargeIn((event: BargeInEvent) => {
      setBargeInDetected(event.detected);
      if (event.detected) {
        console.log('[BargeIn] User interrupted bot at RMS:', event.rms.toFixed(4));
        // Stop bot speaking on barge-in
        if (botSpeakingStatus) {
          duplexAudioService.stopSpeaking();
          setBotSpeakingStatus(false);
        }
      }
    });

    vadUnsubscribe.current = vadService.onVADChange((event: VADEvent) => {
      setUserSpeakingStatus(event.isSpeaking);
      console.log('[VAD] User speaking:', event.isSpeaking, 'Confidence:', event.confidence.toFixed(2));
    });

    return () => {
      bargeInUnsubscribe.current?.();
      vadUnsubscribe.current?.();
    };
  }, [botSpeakingStatus]);


  const initializeEngine = async () => {
    if (engineReady) return;

    setIsInitializing(true);
    setError('');

    try {
      // Initialize WebLLM
      await webllmService.initialize(
        'TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC',
        (progress) => {
          setInitProgress(progress);
        }
      );

      setEngineReady(true);
    } catch (err) {
      setError(`Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    } finally {
      setIsInitializing(false);
      setInitProgress('');
    }
  };

  const handleStartListening = async () => {
    setError('');
    setIsListening(true);
    setBargeInDetected(false);
    setPartialTranscript('');
    partialTranscriptRef.current = '';
    streamingActiveRef.current = true;

    try {
      if (!webSpeechService.isSupported()) {
        setError('Speech recognition not supported in your browser');
        setIsListening(false);
        return;
      }

      // Start duplex audio recording
      await duplexAudioService.startRecording();

      // Wait for speech to be transcribed
      const userText = await webSpeechService.transcribe();

      // Get partial transcripts for display
      const unsubscribePartial = webSpeechService.onPartialResult((partial) => {
        partialTranscriptRef.current = partial;
        setPartialTranscript(partial);
        console.log('[Streaming] Partial:', partial);
      });

      unsubscribesRef.current = [unsubscribePartial];

      if (!userText.trim()) {
        setError('No speech detected. Make sure: 1) Microphone is enabled, 2) Browser has microphone permission, 3) Speak clearly and loudly. Try again.');
        setIsListening(false);
        setPartialTranscript('');
        duplexAudioService.cancelRecording();
        if (loopModeRef.current) {
          setTimeout(() => handleStartListening(), 1000);
        }
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsListening(false);
      setPartialTranscript('');
      setIsProcessing(true);

      // Build context for LLM
      const llmMessages: LLMMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful voice assistant. Keep responses concise and natural for voice interaction.',
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userText,
        },
      ];

      // Stream response tokens and speak as sentences complete
      setBotSpeakingStatus(true);
      let fullResponse = '';
      let sentenceBuffer = '';
      const speakingQueue: Promise<void>[] = [];

      try {
        console.log('[Duplex] Streaming response...');
        await webllmService.streamResponse(
          llmMessages,
          (token) => {
            console.log('[Streaming] Token:', token);
            fullResponse += token;
            sentenceBuffer += token;

            // Check if we have a complete sentence
            const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
            let hasSentenceEnd = sentenceEnders.some(ender => sentenceBuffer.includes(ender));

            // Also speak on certain punctuation even without space
            if (!hasSentenceEnd && sentenceBuffer.match(/[.!?]$/)) {
              hasSentenceEnd = true;
            }

            // Speak when we have a complete sentence or buffer gets large
            if ((hasSentenceEnd && sentenceBuffer.trim().length > 0) || sentenceBuffer.length > 100) {
              const textToSpeak = sentenceBuffer.trim();
              if (textToSpeak) {
                console.log('[Duplex] Speaking sentence:', textToSpeak);
                // Queue the speech without waiting (fire and forget for true streaming)
                // But limit concurrent speech to 2 to avoid overwhelming the API
                if (speakingQueue.length < 2) {
                  const speakPromise = duplexAudioService.speakText(textToSpeak).then(
                    () => {
                      speakingQueue.splice(speakingQueue.indexOf(speakPromise), 1);
                    },
                    () => {
                      speakingQueue.splice(speakingQueue.indexOf(speakPromise), 1);
                    }
                  );
                  speakingQueue.push(speakPromise);
                }
                sentenceBuffer = '';
              }
            }
          }
        );

        // Speak any remaining text
        if (sentenceBuffer.trim()) {
          console.log('[Duplex] Speaking final:', sentenceBuffer.trim());
          const speakPromise = duplexAudioService.speakText(sentenceBuffer.trim());
          speakingQueue.push(speakPromise);
        }

        // Wait for all speech to complete
        await Promise.all(speakingQueue);
        console.log('[Duplex] All speech completed');
      } catch (err) {
        console.error('[Duplex] Streaming error:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      } finally {
        setBotSpeakingStatus(false);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);

      // Handle barge-in or loop mode
      if (bargeInDetected) {
        console.log('[Duplex] User interrupted - restarting immediately');
        setBargeInDetected(false);
        streamingActiveRef.current = false;
        setTimeout(() => handleStartListening(), 100);
      } else if (loopModeRef.current) {
        streamingActiveRef.current = false;
        setTimeout(() => handleStartListening(), 500);
      } else {
        await duplexAudioService.stopRecording();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Duplex error:', err);

      // Provide specific guidance based on error type
      let userError = errorMsg;
      if (errorMsg.includes('No speech detected')) {
        userError = 'No speech detected. Check: Microphone enabled? Browser permissions granted? Try speaking louder and clearer.';
      } else if (errorMsg.includes('not supported')) {
        userError = 'Speech Recognition not supported in your browser. Please use Chrome, Edge, or Safari.';
      } else if (errorMsg.includes('timeout')) {
        userError = 'Recognition timeout. Check your internet and try again.';
      }

      setError(`Failed: ${userError}`);
      setIsListening(false);
      setIsProcessing(false);
      setPartialTranscript('');
      streamingActiveRef.current = false;
      unsubscribesRef.current.forEach(unsub => unsub());
      duplexAudioService.cancelRecording();
    }
  };

  const toggleLoopMode = () => {
    const newLoopMode = !loopMode;
    setLoopMode(newLoopMode);

    if (newLoopMode && engineReady && !isListening && !isProcessing) {
      handleStartListening();
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError('');
  };

  if (isInitializing) {
    return (
      <FullScreenContainer>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <SpinLoader />
            <p className="text-sm text-slate-400 mt-4">{initProgress || 'Initializing...'}</p>
          </div>
        </div>
      </FullScreenContainer>
    );
  }

  if (error && !engineReady) {
    return (
      <FullScreenContainer>
        <div className="flex items-center justify-center h-full">
          <ErrorCard error={error} />
        </div>
      </FullScreenContainer>
    );
  }

  return (
    <FullScreenContainer>
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Voice AI (Duplex)</h1>
            {engineReady && (
              <button
                onClick={toggleLoopMode}
                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                  loopMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {loopMode ? '🔄 Loop ON' : '⏸️ Loop OFF'}
              </button>
            )}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4 text-sm mb-2">
            <div className="flex items-center gap-2">
              {engineReady ? (
                <>
                  <div className="h-2 w-2 bg-green-400 rounded-full" />
                  <span className="text-green-400">Ready</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 bg-yellow-400 rounded-full" />
                  <span className="text-yellow-400">Not initialized</span>
                </>
              )}
            </div>

            {/* Duplex Status */}
            {engineReady && (
              <>
                {botSpeakingStatus && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-xs">Bot speaking</span>
                  </div>
                )}

                {userSpeakingStatus && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-amber-400 text-xs">You speaking</span>
                  </div>
                )}

                {bargeInDetected && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce" />
                    <span className="text-orange-400 text-xs">Barge-in detected</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Enhanced duplex communication with echo cancellation, VAD, and barge-in detection
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !error && (
            <div className="h-full flex items-center justify-center text-center">
              <div className="text-slate-400">
                <p className="text-lg mb-4">No messages yet</p>
                <p className="text-sm max-w-xs">
                  Initialize the engine and click the microphone to start speaking. You can interrupt the bot with barge-in.
                </p>
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {/* Streaming Partial Transcript */}
          {partialTranscript && (
            <div className="flex justify-end">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-blue-500 text-white rounded-br-none opacity-75">
                <p className="break-words text-sm italic">{partialTranscript}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 text-red-100 p-4 rounded-lg border border-red-700">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="bg-slate-800 border-t border-slate-700 p-4 space-y-4">
          {!engineReady && !isInitializing && (
            <button
              onClick={initializeEngine}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Initialize Engine (Download 75MB Model)
            </button>
          )}

          <ControlBar>
            <button
              onClick={handleStartListening}
              disabled={isProcessing || isListening || !engineReady}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">🎤</span>
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Start Listening'}
            </button>

            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                disabled={isProcessing}
                className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </ControlBar>

          <p className="text-xs text-slate-400 text-center">
            ✅ 100% Offline • Echo Cancellation • VAD • Barge-in Detection
          </p>
        </div>
      </div>
    </FullScreenContainer>
  );
}
