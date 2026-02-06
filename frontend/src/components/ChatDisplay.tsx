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
    <div className="flex-1 overflow-y-auto px-5 py-8 relative z-10">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Empty state — dramatic hero */}
        {messages.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center text-center pt-20 sm:pt-28 space-y-10">
            {/* Serif title with staggered reveal */}
            <div className="space-y-4">
              <h2
                className="font-display text-6xl sm:text-7xl text-accent tracking-tight leading-none animate-reveal"
                style={{ animationDelay: '100ms' }}
              >
                Aria
              </h2>
              <p
                className="font-mono text-[11px] text-text-muted tracking-[0.3em] uppercase animate-reveal"
                style={{ animationDelay: '300ms' }}
              >
                voice &middot; intelligence &middot; memory
              </p>
            </div>

            {/* Divider line */}
            <div
              className="w-12 h-px bg-accent/20 animate-reveal"
              style={{ animationDelay: '450ms' }}
            />

            {/* Description */}
            <p
              className="font-mono text-xs text-text-secondary max-w-sm leading-relaxed animate-reveal"
              style={{ animationDelay: '550ms' }}
            >
              Powered by Llama 3.3 on Cloudflare Workers AI. Speak or type to
              begin a conversation.
            </p>

            {/* Suggestions */}
            <div
              className="flex flex-wrap justify-center gap-3 mt-4 animate-reveal"
              style={{ animationDelay: '700ms' }}
            >
              {[
                'What can you help me with?',
                'Tell me a fun fact',
                'How does this app work?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-4 py-2 font-mono text-[11px] text-text-muted border border-border rounded-sm hover:text-accent hover:border-accent/30 transition-all duration-300"
                  onClick={() => {
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
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} delay={i === messages.length - 1 ? 50 : 0} />
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
          <div className="animate-reveal">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] tracking-widest uppercase text-accent-deep">
                aria
              </span>
            </div>
            <div className="pl-4 relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-accent/30" />
              <div className="flex items-center gap-2 py-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-bounce"
                  style={{ animationDelay: '200ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-bounce"
                  style={{ animationDelay: '400ms' }}
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
