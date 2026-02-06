import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatDisplay } from './components/ChatDisplay';
import { VoiceInput } from './components/VoiceInput';
import {
  streamMessage,
  sendVoice,
  getWorkflowStatus,
  getSession,
  deleteSession,
} from './lib/api';
import { Message } from './lib/types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('aria-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('aria-session-id', sessionId);
  }
  return sessionId;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(getOrCreateSessionId);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  // Load existing session on mount
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Listen for suggestion clicks from the empty state
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) handleSendMessage(detail);
    };
    window.addEventListener('suggestion-click', handler);
    return () => window.removeEventListener('suggestion-click', handler);
  }, [sessionId]);

  async function loadSession() {
    try {
      const data = await getSession(sessionId);
      if (data.messages?.length > 0) {
        setMessages(
          data.messages.map((m) => ({
            id: String(m.id),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp,
          }))
        );
      }
    } catch {
      // Session doesn't exist yet
    }
  }

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return;

      // Add user message to UI immediately
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);
      setStreamingText('');

      try {
        // Stream the AI response
        const fullResponse = await streamMessage(
          sessionId,
          text,
          (partial) => {
            setStreamingText(partial);
          }
        );

        // Add completed assistant message
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullResponse,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingText('');

        // Speak the response if voice mode is on
        if (voiceEnabled && fullResponse) {
          speak(fullResponse);
        }
      } catch (err) {
        console.error('Failed to get response:', err);
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Sorry, I had trouble processing that. Please check your connection and try again.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setStreamingText('');
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId, isProcessing, voiceEnabled, speak]
  );

  const handleVoiceResult = useCallback(
    async (transcript: string, audioBlob?: Blob) => {
      // If we got a transcript from browser SpeechRecognition, use it directly
      if (transcript.trim()) {
        handleSendMessage(transcript);
        return;
      }

      // Otherwise, send audio to server for Whisper transcription via Workflow
      if (!audioBlob) return;

      setIsProcessing(true);
      try {
        const { instanceId, transcription } = await sendVoice(
          sessionId,
          audioBlob
        );

        // Add the transcribed user message
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: transcription,
          timestamp: Date.now(),
          isVoice: true,
        };
        setMessages((prev) => [...prev, userMsg]);

        // Poll for workflow completion
        let attempts = 0;
        const maxAttempts = 60;
        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));
          const status = await getWorkflowStatus(instanceId);

          if (status.status === 'complete' && status.output) {
            const assistantMsg: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: status.output.response,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMsg]);

            if (voiceEnabled && status.output.response) {
              speak(status.output.response);
            }
            break;
          } else if (status.status === 'errored') {
            throw new Error(status.error || 'Workflow processing failed');
          }

          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Voice processing timed out');
        }
      } catch (err) {
        console.error('Voice processing failed:', err);
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Sorry, I had trouble processing your voice. Please try again or type your message instead.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId, handleSendMessage, voiceEnabled, speak]
  );

  const handleNewConversation = useCallback(async () => {
    stopSpeaking();
    try {
      await deleteSession(sessionId);
    } catch {
      // Ignore errors when clearing
    }
    const newSessionId = crypto.randomUUID();
    localStorage.setItem('aria-session-id', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setStreamingText('');
  }, [sessionId, stopSpeaking]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <Header
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onNewConversation={handleNewConversation}
        isSpeaking={isSpeaking}
        onStopSpeaking={stopSpeaking}
      />
      <ChatDisplay
        messages={messages}
        streamingText={streamingText}
        isProcessing={isProcessing}
      />
      <VoiceInput
        onSendMessage={handleSendMessage}
        onVoiceResult={handleVoiceResult}
        isProcessing={isProcessing}
        voiceEnabled={voiceEnabled}
      />
    </div>
  );
}
