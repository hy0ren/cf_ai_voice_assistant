import { Message } from '../lib/types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  delay?: number;
}

export function MessageBubble({
  message,
  isStreaming,
  delay = 0,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className="animate-reveal"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Role label */}
      <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'justify-end' : ''}`}>
        <span
          className={`font-mono text-[10px] tracking-widest uppercase ${
            isUser ? 'text-user-accent' : 'text-accent-deep'
          }`}
        >
          {isUser ? 'you' : 'aria'}
        </span>
        {message.isVoice && (
          <span className="font-mono text-[9px] text-text-muted tracking-wider">
            / voice
          </span>
        )}
      </div>

      {/* Message content */}
      <div
        className={`relative pl-4 ${
          isUser ? 'ml-12 sm:ml-24' : 'mr-12 sm:mr-24'
        }`}
      >
        {/* Left accent bar */}
        <div
          className={`absolute left-0 top-0.5 bottom-0.5 w-px ${
            isUser ? 'bg-user-accent/40' : 'bg-accent/30'
          }`}
        />

        <p className="font-mono text-[13px] leading-[1.7] text-text-primary whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[14px] ml-1 bg-accent animate-amber-blink align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
