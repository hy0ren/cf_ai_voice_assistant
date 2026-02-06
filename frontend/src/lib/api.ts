const API_BASE = import.meta.env.VITE_API_URL || '';

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to send message');
  }

  const data = await res.json();
  return data.response;
}

export async function streamMessage(
  sessionId: string,
  message: string,
  onChunk: (fullText: string) => void
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to stream message');
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.response) {
            fullText += parsed.response;
            onChunk(fullText);
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }

  return fullText;
}

export async function sendVoice(
  sessionId: string,
  audio: Blob
): Promise<{ instanceId: string; transcription: string }> {
  const formData = new FormData();
  formData.append('audio', audio, 'recording.webm');
  formData.append('sessionId', sessionId);

  const res = await fetch(`${API_BASE}/api/voice`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to process voice');
  }

  return res.json();
}

export async function getWorkflowStatus(instanceId: string): Promise<{
  status: string;
  output?: { transcription?: string; response: string; sessionId: string };
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/api/workflow/${instanceId}`);
  if (!res.ok) throw new Error('Failed to get workflow status');
  return res.json();
}

export async function getSession(sessionId: string): Promise<{
  messages: Array<{
    id: number;
    role: string;
    content: string;
    timestamp: number;
  }>;
  metadata: {
    created_at: number;
    updated_at: number;
    message_count: number;
    summary?: string;
  };
  sessionId: string;
}> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
  if (!res.ok) throw new Error('Failed to get session');
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE' });
}
