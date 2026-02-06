import { useEffect, useRef } from 'react';
import { Message } from '../lib/types';
import { MessageBubble } from './MessageBubble';

interface ChatDisplayProps {
  messages: Message[];
  streamingText: string;
  isProcessing: boolean;
}

export function ChatDisplay({
  messages,
  streamingText,
  isProcessing,
}: ChatDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      <div className="max-w-3xl mx-auto w-full space-y-4">
        {/* Empty state */}
        {messages.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center text-center space-y-6 pt-16 sm:pt-24 animate-fade-in">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl -z-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Hi, I'm Aria
              </h2>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                Your AI voice assistant powered by Llama 3.3 on Cloudflare
                Workers AI. Tap the microphone to speak or type a message to get
                started.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                'What can you help me with?',
                'Tell me a fun fact',
                'How does this app work?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-4 py-2 text-xs bg-slate-800/50 border border-slate-700/30 rounded-full text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
                  onClick={() => {
                    // Dispatch a custom event that the parent can listen to
                    window.dispatchEvent(
                      new CustomEvent('suggestion-click', {
                        detail: suggestion,
                      })
                    );
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming response */}
        {streamingText && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingText,
              timestamp: Date.now(),
            }}
            isStreaming
          />
        )}

        {/* Typing indicator */}
        {isProcessing && !streamingText && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/20 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
