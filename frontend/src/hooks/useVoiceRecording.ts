import { useState, useRef, useCallback, useEffect } from 'react';

interface StopResult {
  transcript: string;
  audioBlob: Blob | null;
}

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const transcriptRef = useRef('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const resolveStopRef = useRef<((result: StopResult) => void) | null>(null);

  // Sync ref with state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const startRecording = useCallback(async () => {
    // Reset state
    setTranscript('');
    transcriptRef.current = '';
    chunksRef.current = [];

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;
      setAudioStream(stream);

      // Set up MediaRecorder for audio capture (for server-side Whisper fallback)
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (resolveStopRef.current) {
          resolveStopRef.current({
            transcript: transcriptRef.current,
            audioBlob: blob,
          });
          resolveStopRef.current = null;
        }
      };

      mediaRecorder.start(250); // Collect in 250ms chunks

      // Set up Web Speech API for real-time browser-side transcription
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let result = '';
          for (let i = 0; i < event.results.length; i++) {
            result += event.results[i][0].transcript;
          }
          setTranscript(result);
          transcriptRef.current = result;
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
        };

        recognition.start();
      }

      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, []);

  const stopRecording = useCallback((): Promise<StopResult> => {
    return new Promise((resolve) => {
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Already stopped
        }
        recognitionRef.current = null;
      }

      // Stop media recorder (this triggers onstop which resolves the promise)
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        resolveStopRef.current = (result) => {
          // Clean up audio stream after capturing data
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setAudioStream(null);
          }
          resolve(result);
        };
        mediaRecorderRef.current.stop();
      } else {
        // No media recorder active, resolve immediately
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setAudioStream(null);
        }
        resolve({ transcript: transcriptRef.current, audioBlob: null });
      }

      setIsRecording(false);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    transcript,
    audioStream,
    startRecording,
    stopRecording,
  };
}
