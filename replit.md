# EduPilot AI – Study Abroad Guidance Chatbot

## Overview

Full-stack web application — EduPilot AI is an AI-powered study abroad guidance chatbot for Indian students. It guides students through a structured counselor flow to collect their profile (CGPA, English test, budget, country) and then recommends personalized universities with Safe/Moderate/Ambitious categories.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/edupilot)
- **Backend**: Express 5 (artifacts/api-server)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2) — no API key needed
- **Database**: PostgreSQL + Drizzle ORM (conversations + messages tables)
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

1. **AI Chatbot Flow**: Step-by-step counselor flow (CGPA → English test → Budget → Country → Recommendations)
2. **University Recommendation Engine**: 29 universities across Canada, USA, UK, Germany, Australia
3. **Safe/Moderate/Ambitious Categories**: Based on CGPA gap from university minimum
4. **Student Profile Panel**: Right-side panel tracks provided info in real-time
5. **Match Score & Admission Probability**: Calculated per university
6. **CGPA Validation**: 0-10 range, converted to percentage (×9.5)
7. **Streaming AI Responses**: SSE streaming for real-time AI responses

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── data/universities.ts   # 29 university dataset
│   │       ├── routes/universities.ts # Recommendation engine
│   │       └── routes/openai/         # Chat endpoints
│   └── edupilot/           # React + Vite frontend
│       └── src/
│           ├── components/
│           │   ├── chat/           # ChatBubble, QuickSelect
│           │   ├── profile/        # ProfilePanel
│           │   └── recommendations/ # UniversityCard
│           ├── hooks/use-chat.ts   # Chat state & API integration
│           └── pages/Home.tsx      # Main page
├── lib/
│   ├── api-spec/openapi.yaml           # API spec
│   ├── api-client-react/               # Generated React Query hooks
│   ├── api-zod/                        # Generated Zod schemas
│   ├── db/src/schema/                  # conversations + messages tables
│   └── integrations-openai-ai-server/  # OpenAI integration
```

## Key API Endpoints

- `POST /api/openai/conversations` — create chat session
- `POST /api/openai/conversations/:id/messages` — send message (SSE stream)
- `POST /api/universities/recommend` — get university recommendations
- `GET /api/universities` — list universities with filters

## Development

- Frontend: `pnpm --filter @workspace/edupilot run dev`
- Backend: `pnpm --filter @workspace/api-server run dev`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
- DB push: `pnpm --filter @workspace/db run push`
