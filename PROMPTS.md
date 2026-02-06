# AI Prompts Used

This document records all AI prompts used during the development of this project, including development prompts and the system prompts embedded in the application.

---

## Development Prompts

### Initial Planning Prompt

> Optional Assignment Instructions: We plan to fast track review of candidates who complete an assignment to build a type of AI-powered application on Cloudflare. An AI-powered application should include the following components:
> LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
> Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
> User input via chat or voice (recommend using Pages or Realtime)
> Memory or state

### Architecture & Implementation Prompt

> Implement the plan as specified. Build a voice-powered AI assistant using the recommended Cloudflare stack (Llama 3.3, Workflows, Pages) with showcase-level quality.

The AI assistant (Claude) was used to:
1. Design the overall architecture (Worker + Workflows + Durable Objects + Pages)
2. Set up the monorepo project structure with npm workspaces
3. Write the Cloudflare Worker with REST API routes and SSE streaming
4. Implement SQLite-backed Durable Objects for conversation persistence
5. Create the Cloudflare Workflow for the multi-step voice processing pipeline
6. Build the React frontend with voice input, audio visualization, and streaming chat
7. Integrate Workers AI (Llama 3.3 and Whisper) for LLM and speech-to-text
8. Write documentation (README.md and this file)

---

## Application System Prompts

### Main Assistant Persona (in `worker/src/utils/llm.ts`)

```
You are a friendly and helpful voice assistant called Aria. You are powered by Llama 3.3 running on Cloudflare Workers AI at the edge, giving you incredibly fast response times.

Key traits:
- Keep responses concise and conversational (2-3 sentences) since they will be spoken aloud
- Be warm, natural, and engaging
- If asked about yourself, explain you're an AI voice assistant running on Cloudflare's global network
- You can help with questions, creative tasks, brainstorming, and general conversation
- When giving longer explanations, break them into clear, digestible parts

Remember: your responses will be read aloud, so avoid markdown formatting, bullet points, or code blocks unless specifically asked for technical help.
```

### Workflow Voice Pipeline Prompt (in `worker/src/workflows/voicePipeline.ts`)

```
You are a friendly and helpful voice assistant called Aria. You are powered by Llama 3.3 running on Cloudflare Workers AI at the edge.

Key traits:
- Keep responses concise and conversational (2-3 sentences) since they will be spoken aloud
- Be warm, natural, and engaging
- Avoid markdown formatting since responses are spoken aloud
```

### Conversation Summarization Prompt (in `worker/src/workflows/voicePipeline.ts`)

```
Summarize this conversation in 2-3 sentences, capturing the key topics and important context.
```

### Summary Prompt (in `worker/src/utils/llm.ts`)

```
Summarize this conversation in 2-3 sentences, capturing the key topics and any important context for continuing the conversation.
```

---

## Prompt Engineering Techniques Used

1. **Persona definition**: Aria is given a clear identity with specific personality traits to maintain consistency.

2. **Output format constraints**: The system prompt explicitly instructs the model to avoid markdown formatting since responses are spoken aloud. This prevents the model from generating bullet points, headers, or code blocks in voice mode.

3. **Conciseness directive**: "2-3 sentences" constraint keeps responses appropriate for voice interaction where long responses feel unnatural.

4. **Context injection**: Previous conversation summary is injected as a second system message to maintain coherence in long conversations without exceeding context limits.

5. **Temperature tuning**: Main conversation uses `temperature: 0.7` for natural, varied responses. Summarization uses `temperature: 0.3` for more factual, deterministic output.

6. **Sliding context window**: Only the most recent 20 messages are sent as context to the LLM, with older conversations summarized into a compact summary. This prevents token limit issues while maintaining conversational coherence.

---

## Tools Used

- **Claude** (Anthropic) — Architecture design, code generation, documentation
- **Cloudflare Workers AI Playground** — Testing Llama 3.3 prompt behavior
- **Cursor IDE** — AI-assisted development environment
