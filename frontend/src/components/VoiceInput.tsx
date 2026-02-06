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
        // No browser transcription available, send audio for server-side Whisper
        onVoiceResult('', result.audioBlob);
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className="border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-xl px-4 py-4 z-10">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Audio Visualizer */}
        {isRecording && (
          <div className="flex justify-center">
            <AudioVisualizer stream={audioStream} isActive={isRecording} />
          </div>
        )}

        {/* Real-time transcript preview */}
        {isRecording && transcript && (
          <p className="text-center text-sm text-slate-400 italic truncate px-4">
            &ldquo;{transcript}&rdquo;
          </p>
        )}

        {/* Input row */}
        <div className="flex items-center gap-3">
          {/* Text input form */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isRecording ? 'Listening...' : 'Type a message...'}
              disabled={isProcessing || isRecording}
              className="flex-1 bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 disabled:opacity-40 transition-all"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing || isRecording}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/10 disabled:shadow-none"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>

          {/* Microphone button */}
          {voiceEnabled && (
            <button
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/40'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/30'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {/* Pulse rings when recording */}
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                  <span className="absolute -inset-1 rounded-full border-2 border-red-400/50 animate-pulse-ring" />
                </>
              )}

              <svg
                className="w-5 h-5 text-white relative z-10"
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
                    rx="2"
                    fill="currentColor"
                    stroke="none"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600">
          Powered by Llama 3.3 on Cloudflare Workers AI &middot; Workflows
          &middot; Durable Objects
        </p>
      </div>
    </div>
  );
}
