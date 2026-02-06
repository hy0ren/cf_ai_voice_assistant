interface HeaderProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onNewConversation: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export function Header({
  voiceEnabled,
  onToggleVoice,
  onNewConversation,
  isSpeaking,
  onStopSpeaking,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg
            className="w-5 h-5 text-white"
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
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            Aria
          </h1>
          <span className="text-[10px] text-slate-500 leading-tight hidden sm:block">
            Voice AI Assistant
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop
          </button>
        )}

        <button
          onClick={onToggleVoice}
          className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
            voiceEnabled
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50'
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {voiceEnabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            )}
          </svg>
          {voiceEnabled ? 'Voice On' : 'Voice Off'}
        </button>

        <button
          onClick={onNewConversation}
          className="px-3 py-1.5 text-xs bg-slate-800/50 text-slate-400 rounded-lg hover:bg-slate-700/50 transition-all flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
      </div>
    </header>
  );
}
