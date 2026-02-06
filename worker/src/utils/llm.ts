export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a friendly and helpful voice assistant called Aria. You are powered by Llama 3.3 running on Cloudflare Workers AI at the edge, giving you incredibly fast response times.

Key traits:
- Keep responses concise and conversational (2-3 sentences) since they will be spoken aloud
- Be warm, natural, and engaging
- If asked about yourself, explain you're an AI voice assistant running on Cloudflare's global network
- You can help with questions, creative tasks, brainstorming, and general conversation
- When giving longer explanations, break them into clear, digestible parts

Remember: your responses will be read aloud, so avoid markdown formatting, bullet points, or code blocks unless specifically asked for technical help.`;

export function buildMessages(
  context: { role: string; content: string }[],
  userMessage: string,
  summary?: string
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (summary) {
    messages.push({
      role: 'system',
      content: `Previous conversation summary: ${summary}`,
    });
  }

  for (const msg of context) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  return messages;
}

export async function generateResponse(
  ai: any,
  messages: ChatMessage[],
  stream: boolean = false
): Promise<any> {
  const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages,
    max_tokens: 500,
    temperature: 0.7,
    stream,
  });

  if (stream) {
    return result; // Returns a ReadableStream
  }

  return result.response || '';
}

export async function generateSummary(
  ai: any,
  context: { role: string; content: string }[]
): Promise<string> {
  const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      {
        role: 'system',
        content:
          'Summarize this conversation in 2-3 sentences, capturing the key topics and any important context for continuing the conversation.',
      },
      {
        role: 'user',
        content: context.map((m) => `${m.role}: ${m.content}`).join('\n'),
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  return result.response || '';
}
