# cf_ai_voice_assistant — Aria

A showcase AI-powered voice assistant built entirely on Cloudflare's platform. Aria lets users have real-time voice conversations with Llama 3.3, with full conversation memory and a polished modern UI.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                       │
│  React + Tailwind frontend with voice I/O & streaming UI │
└───────────────────────┬──────────────────────────────────┘
                        │  REST API + SSE streaming
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   Cloudflare Worker                       │
│  API router: /api/chat, /api/chat/stream, /api/voice     │
│  CORS, auth, request validation                          │
└────┬──────────┬──────────┬───────────────────────────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────────────────┐
│Workers AI│ │Workflow│ │   Durable Objects     │
│Llama 3.3│ │Pipeline│ │  SQLite conversation  │
│ Whisper  │ │  (STT  │ │  history & metadata   │
│(STT+LLM)│ │  →LLM  │ │                      │
│          │ │  →Save)│ │                      │
└─────────┘ └────────┘ └──────────────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **LLM** | Llama 3.3 70B (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) on Workers AI | Conversational intelligence |
| **Speech-to-Text** | Browser Web Speech API + Whisper (`@cf/openai/whisper`) fallback | Voice transcription |
| **Text-to-Speech** | Browser SpeechSynthesis API | Spoken responses |
| **Orchestration** | Cloudflare Workflows | Multi-step voice pipeline with retries |
| **Coordination** | Cloudflare Workers | API routing, streaming, CORS |
| **Memory/State** | SQLite-backed Durable Objects | Persistent conversation history |
| **Frontend** | React + Tailwind on Cloudflare Pages | Voice UI with real-time visualization |

### Data Flow

**Text Chat (streaming):**
1. User types message → `POST /api/chat/stream`
2. Worker retrieves conversation context from Durable Object
3. Worker calls Llama 3.3 with streaming enabled
4. SSE stream pipes to frontend while background task saves to DO
5. Browser speaks the response aloud (if voice mode is on)

**Voice Chat (Workflow pipeline):**
1. User speaks → browser SpeechRecognition provides real-time transcript
2. If browser STT available: transcript sent as text via streaming chat
3. If browser STT unavailable: audio blob sent to `POST /api/voice`
4. Worker transcribes audio with Whisper on Workers AI
5. Workflow orchestrates: context retrieval → Llama 3.3 → save to DO
6. Frontend polls workflow status, displays response, speaks it aloud

## Features

- **Real-time voice conversations** with push-to-talk microphone
- **Streaming text responses** with live typing animation
- **Audio visualization** showing microphone input as frequency bars
- **Conversation memory** persisted in SQLite-backed Durable Objects
- **Automatic summarization** of long conversations to maintain context
- **Dual input modes** — voice and text chat with seamless switching
- **Session persistence** — conversations survive page reloads
- **Server-side Whisper fallback** when browser speech recognition is unavailable
- **Modern dark UI** with glassmorphism, gradients, and smooth animations
- **Mobile responsive** design

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed as project dependency)

## Quick Start — Local Development

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/cf_ai_voice_assistant.git
cd cf_ai_voice_assistant

# 2. Install dependencies
npm install

# 3. Authenticate with Cloudflare (required for Workers AI)
npx wrangler login

# 4. Start the worker (port 8787)
npm run dev:worker

# 5. In a separate terminal, start the frontend (port 5173)
npm run dev:frontend

# 6. Open http://localhost:5173 in your browser
```

> **Note:** The Vite dev server proxies `/api/*` requests to `localhost:8787`, so both servers need to be running. Alternatively, run `npm run dev` to start both concurrently.

## Deployment

### Deploy the Worker

```bash
cd worker
npx wrangler deploy
```

This deploys the Worker to `cf-ai-voice-assistant.<your-subdomain>.workers.dev`.

### Deploy the Frontend to Cloudflare Pages

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy via Wrangler:
   ```bash
   npx wrangler pages deploy dist --project-name=aria-voice-assistant
   ```

   Or connect your GitHub repository to Cloudflare Pages in the dashboard:
   - Build command: `cd frontend && npm run build`
   - Build output directory: `frontend/dist`

3. Set the environment variable `VITE_API_URL` to your deployed Worker URL during the Pages build.

### Deployed Link

Once deployed, the frontend is available at your Cloudflare Pages URL and the Worker API at your Workers subdomain.

## Project Structure

```
├── worker/                          # Cloudflare Worker backend
│   ├── src/
│   │   ├── index.ts                 # API router & handlers
│   │   ├── durable-objects/
│   │   │   └── ConversationStore.ts # SQLite-backed conversation state
│   │   ├── workflows/
│   │   │   └── voicePipeline.ts     # Multi-step voice processing
│   │   └── utils/
│   │       └── llm.ts              # Llama 3.3 integration & prompts
│   └── wrangler.jsonc               # Wrangler configuration
├── frontend/                        # React frontend for Cloudflare Pages
│   ├── src/
│   │   ├── App.tsx                  # Root component & state management
│   │   ├── components/
│   │   │   ├── Header.tsx           # Navigation & controls
│   │   │   ├── ChatDisplay.tsx      # Message list with streaming
│   │   │   ├── MessageBubble.tsx    # Individual message rendering
│   │   │   ├── VoiceInput.tsx       # Text + voice input controls
│   │   │   └── AudioVisualizer.tsx  # Real-time frequency visualization
│   │   ├── hooks/
│   │   │   ├── useVoiceRecording.ts # Microphone + SpeechRecognition
│   │   │   └── useSpeechSynthesis.ts# Browser text-to-speech
│   │   └── lib/
│   │       ├── api.ts               # API client with SSE parsing
│   │       └── types.ts             # Shared TypeScript interfaces
│   └── index.html
├── README.md
├── PROMPTS.md                       # AI prompts used in development
├── LICENSE
└── package.json                     # npm workspaces root
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Send text message, receive full JSON response |
| `POST` | `/api/chat/stream` | Send text message, receive SSE streaming response |
| `POST` | `/api/voice` | Upload audio for Whisper transcription + Workflow processing |
| `GET` | `/api/sessions/:id` | Retrieve conversation history and metadata |
| `DELETE` | `/api/sessions/:id` | Clear a conversation |
| `GET` | `/api/workflow/:id` | Check Workflow instance status |
| `GET` | `/api/health` | Health check |

## Technology Stack

- **Runtime:** Cloudflare Workers (edge compute)
- **LLM:** Meta Llama 3.3 70B Instruct FP8 via Workers AI
- **Speech Recognition:** Browser Web Speech API + Cloudflare Workers AI Whisper
- **Speech Synthesis:** Browser SpeechSynthesis API
- **Orchestration:** Cloudflare Workflows (durable multi-step execution)
- **State:** SQLite-backed Durable Objects (strongly consistent)
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Hosting:** Cloudflare Pages (frontend) + Workers (backend)

## License

MIT
