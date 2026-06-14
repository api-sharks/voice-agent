'use client';

import { useState, useEffect, useRef } from 'react';
import { webSpeechService } from '@/lib/services/web-speech.service';
import { webllmService, audioService, type LLMMessage } from '@/lib/services';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VoiceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState('');
  const [engineReady, setEngineReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [loopMode, setLoopMode] = useState(false);
  const loopModeRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeEngine = async () => {
    if (engineReady) return;

    setIsInitializing(true);
    setError('');

    try {
      await webllmService.initialize('TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC', (progress) => {
        setInitProgress(progress);
      });
      setEngineReady(true);
    } catch (err) {
      setError(`Failed to initialize engine: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    } finally {
      setIsInitializing(false);
      setInitProgress('');
    }
  };

  const handleStartRecording = async () => {
    setError('');

    if (!webSpeechService.isSupported()) {
      setError('Speech Recognition not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      setIsRecording(true);

      // Use Web Speech API for offline speech recognition
      const userText = await webSpeechService.transcribe();

      if (!userText.trim()) {
        setError('No speech detected. Please try again.');
        setIsProcessing(false);
        // Auto-restart in loop mode
        if (loopModeRef.current) {
          setTimeout(() => handleStartRecording(), 500);
        }
        return;
      }

      // Add user message
      const userId = Date.now().toString();
      const userMessage: Message = {
        id: userId,
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Ensure engine is initialized
      if (!engineReady) {
        await initializeEngine();
      }

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

      const assistantId = Date.now().toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak response
      await audioService.speakText(assistantText);

      // Auto-restart in loop mode after speaking completes
      if (loopModeRef.current) {
        // Wait a bit for TTS to complete, then restart
        setTimeout(() => {
          handleStartRecording();
        }, 500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${errorMsg}`);
      console.error(err);
      // Auto-restart in loop mode even on error
      if (loopModeRef.current) {
        setTimeout(() => handleStartRecording(), 1000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopRecording = () => {
    webSpeechService.stopListening();
    setIsRecording(false);
    setIsProcessing(true);
  };

  const handleCancelRecording = () => {
    webSpeechService.abort();
    audioService.cancelRecording();
    setIsRecording(false);
  };

  const toggleLoopMode = () => {
    const newLoopMode = !loopMode;
    setLoopMode(newLoopMode);
    loopModeRef.current = newLoopMode;

    if (newLoopMode && engineReady && !isRecording && !isProcessing) {
      // Start recording if loop mode is enabled and we're idle
      handleStartRecording();
    } else if (!newLoopMode && isRecording) {
      // Stop recording if loop mode is disabled
      handleCancelRecording();
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError('');
  };

  // Sync loopModeRef with state
  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);

  // Set up error listener for WebSpeechService
  useEffect(() => {
    const unsubscribe = webSpeechService.onError((error) => {
      if (error === 'no-speech') {
        setError('No speech detected. Please speak clearly and try again.');
      } else if (error === 'audio-capture') {
        setError('Microphone error: Please check your microphone permissions and try again.');
      } else if (error === 'network') {
        setError('Network error: Please check your internet connection.');
      } else {
        setError(`Speech recognition error: ${error}`);
      }
      setIsRecording(false);
      // Auto-restart in loop mode
      if (loopModeRef.current) {
        setTimeout(() => handleStartRecording(), 1000);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Voice AI Assistant</h1>
          {engineReady && (
            <button
              onClick={toggleLoopMode}
              className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                loopMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title={loopMode ? 'Continuous listening enabled' : 'Click to enable continuous listening'}
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
              <span className="text-green-400">Ready</span>
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
            Initialize Engine
          </button>
        )}

        <div className="flex gap-3">
          {isRecording ? (
            <>
              <button
                onClick={handleStopRecording}
                disabled={isProcessing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
                Stop Recording
              </button>
              <button
                onClick={handleCancelRecording}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleStartRecording}
              disabled={isProcessing || !engineReady}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">🎤</span>
              {isProcessing ? 'Processing...' : 'Start Recording'}
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              disabled={isProcessing}
              className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
