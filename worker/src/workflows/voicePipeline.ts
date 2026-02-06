import {
  WorkflowEntrypoint,
  WorkflowStep,
  WorkflowEvent,
} from 'cloudflare:workers';

import type { ConversationStore } from '../durable-objects/ConversationStore';

interface Env {
  AI: any;
  CONVERSATION_STORE: DurableObjectNamespace<ConversationStore>;
}

export interface VoicePipelineParams {
  sessionId: string;
  userMessage: string;
  isVoice: boolean;
}

export interface VoicePipelineResult {
  response: string;
  sessionId: string;
  userMessage: string;
}

export class VoicePipeline extends WorkflowEntrypoint<
  Env,
  VoicePipelineParams
> {
  async run(
    event: WorkflowEvent<VoicePipelineParams>,
    step: WorkflowStep
  ): Promise<VoicePipelineResult> {
    const { sessionId, userMessage } = event.payload;

    if (!userMessage.trim()) {
      return {
        response: "I didn't catch that. Could you try again?",
        sessionId,
        userMessage: '',
      };
    }

    // Step 1: Retrieve conversation context from Durable Object
    const context = await step.do(
      'retrieve-context',
      {
        retries: { limit: 2, delay: '1 second', backoff: 'exponential' },
      },
      async () => {
        const id = this.env.CONVERSATION_STORE.idFromName(sessionId);
        const stub = this.env.CONVERSATION_STORE.get(id);
        const messages = await stub.getRecentContext(20);
        const metadata = await stub.getMetadata();
        return { messages, summary: metadata.summary };
      }
    );

    // Step 2: Generate AI response using Llama 3.3
    const response = await step.do(
      'generate-response',
      {
        retries: { limit: 2, delay: '1 second', backoff: 'exponential' },
      },
      async () => {
        const systemPrompt = `You are a friendly and helpful voice assistant called Aria. You are powered by Llama 3.3 running on Cloudflare Workers AI at the edge.

Key traits:
- Keep responses concise and conversational (2-3 sentences) since they will be spoken aloud
- Be warm, natural, and engaging
- Avoid markdown formatting since responses are spoken aloud`;

        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];

        if (context.summary) {
          messages.push({
            role: 'system',
            content: `Previous conversation summary: ${context.summary}`,
          });
        }

        for (const msg of context.messages) {
          messages.push({ role: msg.role, content: msg.content });
        }

        messages.push({ role: 'user', content: userMessage });

        const result = await this.env.AI.run(
          '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
          {
            messages,
            max_tokens: 500,
            temperature: 0.7,
          }
        );

        return result.response || '';
      }
    );

    // Step 3: Save both messages to Durable Object
    await step.do(
      'save-conversation',
      {
        retries: { limit: 3, delay: '1 second', backoff: 'exponential' },
      },
      async () => {
        const id = this.env.CONVERSATION_STORE.idFromName(sessionId);
        const stub = this.env.CONVERSATION_STORE.get(id);
        await stub.addMessage('user', userMessage);
        await stub.addMessage('assistant', response);
      }
    );

    // Step 4: Summarize if conversation is getting long
    if (context.messages.length >= 18) {
      await step.do(
        'summarize-conversation',
        {
          retries: { limit: 1, delay: '1 second' },
        },
        async () => {
          const allMessages = [
            ...context.messages,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: response },
          ];

          const summaryResult = await this.env.AI.run(
            '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            {
              messages: [
                {
                  role: 'system',
                  content:
                    'Summarize this conversation in 2-3 sentences, capturing the key topics and important context.',
                },
                {
                  role: 'user',
                  content: allMessages
                    .map((m) => `${m.role}: ${m.content}`)
                    .join('\n'),
                },
              ],
              max_tokens: 200,
              temperature: 0.3,
            }
          );

          const id = this.env.CONVERSATION_STORE.idFromName(sessionId);
          const stub = this.env.CONVERSATION_STORE.get(id);
          await stub.setSummary(summaryResult.response || '');
        }
      );
    }

    return { response, sessionId, userMessage };
  }
}
