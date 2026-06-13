'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FullScreenContainer,
  ControlBar,
  SpinLoader,
  ErrorCard,
} from '@pipecat-ai/voice-ui-kit';
import { webSpeechService } from '@/lib/services/web-speech.service';
import { webllmService, audioService, type LLMMessage } from '@/lib/services';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VoiceChatOffline() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState('');
  const [engineReady, setEngineReady] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const [error, setError] = useState<string>('');
  const loopModeRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);

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

      // Initialize Whisper.cpp
      await whisperCppService.initialize(
        (status) => setInitProgress(status)
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

    try {
      console.log('Starting speech recognition...');

      if (!webSpeechService.isSupported()) {
        setError('Speech recognition not supported in your browser');
        setIsListening(false);
        return;
      }

      // Use Web Speech API for transcription (built-in, no models needed)
      const userText = await webSpeechService.transcribe();

      console.log('Speech recognized:', userText);

      if (!userText.trim()) {
        setError('No speech detected. Please try again.');
        setIsListening(false);
        if (loopModeRef.current) {
          setTimeout(() => handleStartListening(), 500);
        }
        return;
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsListening(false);
      setIsProcessing(true);

      // Generate response
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

      const assistantText = await webllmService.generateResponse(llmMessages);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak response
      await audioService.speakText(assistantText);
      setIsProcessing(false);

      // Auto-restart in loop mode
      if (loopModeRef.current) {
        setTimeout(() => handleStartListening(), 500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Speech recognition error:', err);
      setError(`Failed: ${errorMsg}`);
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const handleStopListening = async () => {
    setIsListening(false);
    setIsProcessing(true);

    // Stop audio capture
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    // Get transcribed text
    const userText = whisperCppService.getTranscript();
    whisperCppService.reset();

    if (!userText.trim()) {
      setError('No speech detected. Please try again.');
      setIsProcessing(false);
      if (loopModeRef.current) {
        setTimeout(() => handleStartListening(), 500);
      }
      return;
    }

    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Generate response
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

      const assistantText = await webllmService.generateResponse(llmMessages);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak response
      await audioService.speakText(assistantText);

      // Auto-restart in loop mode
      if (loopModeRef.current) {
        setTimeout(() => handleStartListening(), 500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${errorMsg}`);
      console.error(err);
      if (loopModeRef.current) {
        setTimeout(() => handleStartListening(), 1000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleLoopMode = () => {
    const newLoopMode = !loopMode;
    setLoopMode(newLoopMode);

    if (newLoopMode && engineReady && !isListening && !isProcessing) {
      handleStartListening();
    } else if (!newLoopMode && isListening) {
      handleStopListening();
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
            <h1 className="text-2xl font-bold text-white">Voice AI (Offline)</h1>
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
          <div className="flex items-center gap-2 text-sm">
            {isInitializing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                <span className="text-blue-400">{initProgress || 'Initializing...'}</span>
              </>
            ) : engineReady ? (
              <>
                <div className="h-2 w-2 bg-green-400 rounded-full" />
                <span className="text-green-400">Ready (100% Offline)</span>
                {loopMode && <span className="text-purple-400 ml-2">• Continuous mode active</span>}
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-yellow-400 rounded-full" />
                <span className="text-yellow-400">Not initialized</span>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !error && (
            <div className="h-full flex items-center justify-center text-center">
              <div className="text-slate-400">
                <p className="text-lg mb-4">No messages yet</p>
                <p className="text-sm max-w-xs">
                  Initialize the engine and click the microphone to start speaking
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
            ✅ 100% Offline • No API Keys • Web Speech API + WebLLM
          </p>
        </div>
      </div>
    </FullScreenContainer>
  );
}
