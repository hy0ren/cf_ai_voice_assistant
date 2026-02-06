import { ConversationStore } from './durable-objects/ConversationStore';
import { VoicePipeline } from './workflows/voicePipeline';
import { buildMessages, generateResponse } from './utils/llm';

// Re-export for Wrangler to discover
export { ConversationStore, VoicePipeline };

export interface Env {
  AI: any;
  CONVERSATION_STORE: DurableObjectNamespace<ConversationStore>;
  VOICE_PIPELINE: any;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- Chat endpoints ---
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        return handleChat(request, env);
      }

      if (url.pathname === '/api/chat/stream' && request.method === 'POST') {
        return handleChatStream(request, env, ctx);
      }

      // --- Voice endpoint (uses Workflow) ---
      if (url.pathname === '/api/voice' && request.method === 'POST') {
        return handleVoice(request, env);
      }

      // --- Session endpoints ---
      const sessionMatch = url.pathname.match(
        /^\/api\/sessions\/([\w-]+)$/
      );
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        if (request.method === 'GET') {
          return handleGetSession(sessionId, env);
        }
        if (request.method === 'DELETE') {
          return handleDeleteSession(sessionId, env);
        }
      }

      // --- Workflow status endpoint ---
      const workflowMatch = url.pathname.match(
        /^\/api\/workflow\/([\w-]+)$/
      );
      if (workflowMatch && request.method === 'GET') {
        return handleWorkflowStatus(workflowMatch[1], env);
      }

      // --- Health check ---
      if (url.pathname === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: Date.now() });
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (error) {
      console.error('Unhandled error:', error);
      return jsonResponse(
        { error: 'Internal Server Error', details: String(error) },
        500
      );
    }
  },
};

// ---- Handler functions ----

async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    message: string;
    sessionId: string;
  };
  const { message, sessionId } = body;

  if (!message || !sessionId) {
    return jsonResponse({ error: 'message and sessionId are required' }, 400);
  }

  // Retrieve conversation context
  const doId = env.CONVERSATION_STORE.idFromName(sessionId);
  const stub = env.CONVERSATION_STORE.get(doId);
  const context = await stub.getRecentContext(20);
  const metadata = await stub.getMetadata();

  // Build prompt and generate response
  const messages = buildMessages(context, message, metadata.summary);
  const response = (await generateResponse(env.AI, messages, false)) as string;

  // Persist both messages
  await stub.addMessage('user', message);
  await stub.addMessage('assistant', response);

  return jsonResponse({ response, sessionId });
}

async function handleChatStream(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const body = (await request.json()) as {
    message: string;
    sessionId: string;
  };
  const { message, sessionId } = body;

  if (!message || !sessionId) {
    return jsonResponse({ error: 'message and sessionId are required' }, 400);
  }

  // Retrieve conversation context
  const doId = env.CONVERSATION_STORE.idFromName(sessionId);
  const stub = env.CONVERSATION_STORE.get(doId);
  const context = await stub.getRecentContext(20);
  const metadata = await stub.getMetadata();

  // Save user message immediately
  await stub.addMessage('user', message);

  // Build prompt and get streaming response
  const chatMessages = buildMessages(context, message, metadata.summary);
  const aiStream = (await generateResponse(
    env.AI,
    chatMessages,
    true
  )) as ReadableStream;

  // Tee the stream: one for the client, one to capture the full response
  const [clientStream, captureStream] = aiStream.tee();

  // Background task: collect the full response text and save it
  ctx.waitUntil(
    (async () => {
      const reader = captureStream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          for (const line of text.split('\n')) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.response) fullResponse += parsed.response;
              } catch {
                // Skip malformed SSE data
              }
            }
          }
        }
      } catch (err) {
        console.error('Error capturing stream:', err);
      }

      if (fullResponse.trim()) {
        await stub.addMessage('assistant', fullResponse);
      }
    })()
  );

  return new Response(clientStream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}

async function handleVoice(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File | null;
  const sessionId = formData.get('sessionId') as string;

  if (!audioFile || !sessionId) {
    return jsonResponse({ error: 'audio file and sessionId are required' }, 400);
  }

  // Transcribe audio using Whisper on Workers AI
  const audioBuffer = await audioFile.arrayBuffer();
  const audioBytes = new Uint8Array(audioBuffer);

  let transcription: string;
  try {
    const whisperResult = await env.AI.run('@cf/openai/whisper', {
      audio: [...audioBytes],
    });
    transcription = whisperResult.text || '';
  } catch (err) {
    console.error('Whisper transcription failed:', err);
    return jsonResponse({ error: 'Failed to transcribe audio' }, 500);
  }

  if (!transcription.trim()) {
    return jsonResponse(
      { error: 'Could not transcribe audio. Please try again.' },
      400
    );
  }

  // Create a Workflow instance for the rest of the pipeline
  const instance = await env.VOICE_PIPELINE.create({
    params: {
      sessionId,
      userMessage: transcription,
      isVoice: true,
    },
  });

  return jsonResponse({
    instanceId: instance.id,
    transcription,
    status: 'processing',
  });
}

async function handleGetSession(
  sessionId: string,
  env: Env
): Promise<Response> {
  const doId = env.CONVERSATION_STORE.idFromName(sessionId);
  const stub = env.CONVERSATION_STORE.get(doId);

  const [messages, metadata] = await Promise.all([
    stub.getMessages(100),
    stub.getMetadata(),
  ]);

  return jsonResponse({ messages, metadata, sessionId });
}

async function handleDeleteSession(
  sessionId: string,
  env: Env
): Promise<Response> {
  const doId = env.CONVERSATION_STORE.idFromName(sessionId);
  const stub = env.CONVERSATION_STORE.get(doId);
  await stub.clearMessages();

  return jsonResponse({ success: true });
}

async function handleWorkflowStatus(
  instanceId: string,
  env: Env
): Promise<Response> {
  try {
    const instance = await env.VOICE_PIPELINE.get(instanceId);
    const status = await instance.status();
    return jsonResponse(status);
  } catch (error) {
    return jsonResponse({ error: 'Workflow instance not found' }, 404);
  }
}
