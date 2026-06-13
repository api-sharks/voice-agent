'use client';

import { useEffect, useRef, useState } from 'react';
import { audioService } from '@/lib/services/audio.service';
import { pipecatService } from '@/lib/services/pipecat.service';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function PipecatChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to Pipecat backend on mount
  useEffect(() => {
    const connect = async () => {
      try {
        await pipecatService.connect();
      } catch (error) {
        console.error('Failed to connect to Pipecat:', error);
      }
    };

    connect();

    // Subscribe to status updates
    const unsubscribeStatus = pipecatService.onStatus(status => {
      setConnectionStatus(status);
    });

    // Subscribe to messages
    const unsubscribeMessage = pipecatService.onMessage(message => {
      if (message.type === 'transcription') {
        // Add user transcription to chat
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          text: message.text || '',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsProcessing(true);
      } else if (message.type === 'text') {
        // Add AI response to chat
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          text: message.text || '',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsProcessing(false);

        // Speak the response
        audioService.speakText(message.text || '');
      } else if (message.type === 'error') {
        console.error('Pipecat error:', message.error);
        setIsProcessing(false);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      pipecatService.disconnect();
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await audioService.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      const audioBlob = await audioService.stopRecording();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = new Float32Array(arrayBuffer);

      // Send audio to Pipecat backend
      pipecatService.sendAudio(audioData);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsRecording(false);
    audioService.cancelRecording();
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleInterrupt = () => {
    pipecatService.interrupt();
    audioService.stopSpeaking();
  };

  const getStatusColor = (): string => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'connection_failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (): string => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'connection_failed':
        return 'Connection Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Pipecat Voice AI</h1>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm text-slate-400">{getStatusText()}</span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Backend-powered conversation with OpenAI + ElevenLabs
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-lg text-slate-400 mb-2">No messages yet</p>
              <p className="text-sm text-slate-500">
                Click the microphone to start speaking
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-600 rounded-br-none'
                      : 'bg-slate-700 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-slate-300 mt-1 opacity-70">
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-lg rounded-bl-none px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-800 border-t border-slate-700 p-6 space-y-3">
        {isRecording && (
          <div className="flex gap-3">
            <button
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
              Stop Recording
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        )}

        {!isRecording && (
          <button
            onClick={handleStartRecording}
            disabled={connectionStatus !== 'connected'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>🎙️</span>
            Start Recording
          </button>
        )}

        {audioService.isSpeaking() && (
          <button
            onClick={handleInterrupt}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
          >
            Interrupt (Stop Speaking)
          </button>
        )}

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
          >
            Clear Chat
          </button>
        )}

        {connectionStatus !== 'connected' && (
          <p className="text-xs text-red-400 text-center">
            ⚠️ Not connected to Pipecat server. Make sure it's running on
            ws://localhost:8765
          </p>
        )}
      </div>
    </div>
  );
}
