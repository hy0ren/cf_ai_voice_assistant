import { useState, useRef, FormEvent } from 'react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { AudioVisualizer } from './AudioVisualizer';

interface VoiceInputProps {
  onSendMessage: (text: string) => void;
  onVoiceResult: (transcript: string, audioBlob?: Blob) => void;
  isProcessing: boolean;
  voiceEnabled: boolean;
}

export function VoiceInput({
  onSendMessage,
  onVoiceResult,
  isProcessing,
  voiceEnabled,
}: VoiceInputProps) {
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    isRecording,
    transcript,
    audioStream,
    startRecording,
    stopRecording,
  } = useVoiceRecording();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      onSendMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleMicClick = async () => {
    if (isProcessing) return;

    if (isRecording) {
      const result = await stopRecording();
      if (result.transcript.trim()) {
        onVoiceResult(result.transcript, result.audioBlob ?? undefined);
      } else if (result.audioBlob) {
        onVoiceResult('', result.audioBlob);
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className="border-t border-border-subtle bg-void/90 backdrop-blur-md px-5 py-5 z-20 relative">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Audio Visualizer */}
        {isRecording && (
          <div className="flex justify-center">
            <AudioVisualizer stream={audioStream} isActive={isRecording} />
          </div>
        )}

        {/* Real-time transcript preview */}
        {isRecording && transcript && (
          <p className="text-center font-mono text-xs text-text-secondary italic truncate px-4">
            &ldquo;{transcript}&rdquo;
          </p>
        )}

        {/* Input row */}
        <div className="flex items-center gap-4">
          {/* Text input form */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
            <div className="flex-1 relative group">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isRecording ? 'listening...' : 'type a message...'}
                disabled={isProcessing || isRecording}
                className="w-full bg-transparent border-b border-border font-mono text-[13px] text-text-primary placeholder-text-muted pb-2 pt-1 focus:outline-none focus:border-accent transition-colors duration-300 disabled:opacity-30"
              />
              {/* Animated underline on focus */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing || isRecording}
              className="font-mono text-[11px] text-text-muted hover:text-accent disabled:text-text-muted/30 transition-colors duration-200 pb-1 tracking-wider uppercase"
            >
              send
            </button>
          </form>

          {/* Microphone button — the dramatic centerpiece */}
          {voiceEnabled && (
            <button
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 ${
                isRecording
                  ? 'bg-danger'
                  : 'bg-elevated border border-border hover:border-accent/40'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {/* Concentric ring animations when recording */}
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full border border-danger/30 animate-ring-pulse" />
                  <span
                    className="absolute inset-0 rounded-full border border-danger/20 animate-ring-pulse"
                    style={{ animationDelay: '600ms' }}
                  />
                </>
              )}

              {/* Amber glow when idle */}
              {!isRecording && !isProcessing && (
                <span className="absolute inset-0 rounded-full animate-glow-breathe" />
              )}

              {/* Icon */}
              <svg
                className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                  isRecording ? 'text-white' : 'text-accent'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isRecording ? (
                  <rect
                    x="7"
                    y="7"
                    width="10"
                    height="10"
                    rx="1"
                    fill="currentColor"
                    stroke="none"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center font-mono text-[9px] text-text-muted tracking-[0.15em] uppercase">
          llama 3.3 &middot; workers ai &middot; workflows &middot; durable
          objects
        </p>
      </div>
    </div>
  );
}
