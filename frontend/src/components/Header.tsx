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
    <header className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-void/90 backdrop-blur-md z-20 relative">
      {/* Brand */}
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-2xl text-accent tracking-tight leading-none">
          Aria
        </h1>
        <span className="font-mono text-[10px] text-text-muted tracking-widest uppercase hidden sm:inline">
          voice / ai
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            className="group px-3 py-1.5 font-mono text-[11px] text-danger border border-danger/20 rounded-sm hover:bg-danger/10 transition-all duration-200 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-sm bg-danger" />
            stop
          </button>
        )}

        <button
          onClick={onToggleVoice}
          className={`px-3 py-1.5 font-mono text-[11px] rounded-sm border transition-all duration-200 flex items-center gap-2 ${
            voiceEnabled
              ? 'text-accent border-accent/20 hover:bg-accent/5'
              : 'text-text-muted border-border hover:text-text-secondary hover:border-border'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              voiceEnabled ? 'bg-accent' : 'bg-text-muted'
            }`}
          />
          {voiceEnabled ? 'voice on' : 'voice off'}
        </button>

        <button
          onClick={onNewConversation}
          className="px-3 py-1.5 font-mono text-[11px] text-text-muted border border-border rounded-sm hover:text-text-secondary hover:border-text-muted transition-all duration-200"
        >
          + new
        </button>
      </div>
    </header>
  );
}
