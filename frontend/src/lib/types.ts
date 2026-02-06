export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isVoice?: boolean;
}

export interface SessionData {
  messages: Message[];
  metadata: {
    created_at: number;
    updated_at: number;
    message_count: number;
    summary?: string;
  };
  sessionId: string;
}

export interface WorkflowStatus {
  status: 'queued' | 'running' | 'complete' | 'errored' | 'paused' | 'terminated';
  output?: {
    transcription?: string;
    response: string;
    sessionId: string;
  };
  error?: string;
}
