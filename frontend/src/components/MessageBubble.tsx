import { Message } from '../lib/types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-start gap-3 animate-fade-in ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/20'
        }`}
      >
        {isUser ? 'U' : 'A'}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
          isUser
            ? 'bg-blue-600/20 backdrop-blur-sm border border-blue-500/10 rounded-tr-md'
            : 'bg-slate-800/40 backdrop-blur-sm border border-slate-700/20 rounded-tl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-100">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-blue-400 animate-blink align-middle" />
          )}
        </p>

        {/* Voice indicator */}
        {message.isVoice && (
          <div className="flex items-center gap-1 mt-1.5">
            <svg
              className="w-3 h-3 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span className="text-[10px] text-slate-500">Voice</span>
          </div>
        )}
      </div>
    </div>
  );
}
