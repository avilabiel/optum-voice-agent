# Optum Voice Agent

An AI voice agent that automates routine Optum member-outreach calls. Built as a take-home for Vi Labs.

The agent (running on Vapi) walks members through a five-section wellness questionnaire (S1–S5), captures responses without giving medical advice, and offers a nurse callback whenever the member would benefit from one. After the call ends, two background pipelines fan out: one audits every assistant turn for policy compliance; the other scores the member 0–1 so a nurse can prioritize follow-ups.

## Five layers, one job each

| Layer | Where | Job |
|-------|-------|-----|
| **dialer** | `src/app/dialer` | Web UI to place an outbound call via Vapi. |
| **worklist** | `src/app/worklist` | Web UI showing members ranked by post-call priority. |
| **recorder** | `src/app/api/webhooks/vapi` + `src/server/recorder.ts` | Persists every turn. Returns 200 OK fast. |
| **turns-audit** | `src/inngest/functions/turns-audit.ts` | Audits each assistant turn against the four policy pillars. |
| **patient-triage** | `src/inngest/functions/patient-triage.ts` | Reads the full transcript, produces a priority score and flags. |

Both end-of-call pipelines run from a single `call.completed` Inngest event, fan out in parallel, and are idempotent on `sessionId`.

## Stack

Next.js 15 (App Router) · TypeScript strict · Drizzle ORM + Neon serverless Postgres · Inngest (background jobs) · Vapi (voice) · OpenAI (assistant + judges) · Langfuse (LLM tracing) · Zod (validation) · Tailwind (UI) · Vitest (tests).

## One-time setup

1. Copy env: `cp .env.example .env`
2. Fill `.env`:
   - `DATABASE_URL` — Neon project URL.
   - `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID` — from your Vapi dashboard.
   - `VAPI_WEBHOOK_SECRET` — any random string you choose (e.g. `openssl rand -hex 32`). `setup-vapi` pushes it to Vapi for you.
   - `OPENAI_API_KEY` — OpenAI dashboard.
   - `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` — Langfuse cloud (free tier).
   - `DEMO_PHONE_NUMBER` — your phone in E.164 (e.g. `+15555550123`).
3. Start ngrok so Vapi can reach the webhook: `ngrok http 3000` and copy the URL into `NGROK_URL` in `.env`.
4. Install dependencies: `npm install`

## Run the full demo

```bash
npm run demo
```

That runs: `db:push` (apply schema) → `db:seed` (100 members, Gabriel at ~#71) → `setup-vapi` (creates the assistant and writes its ID back to `.env`) → `dev` (Next.js + Inngest dev server).

Then open:
- http://localhost:3000/dialer — place the call
- http://localhost:3000/worklist — nurse view
- http://localhost:8288 — Inngest dev dashboard (see runs of `patient-triage` and `turns-audit`)
- https://cloud.langfuse.com — LLM traces for the judges

## Useful scripts

```bash
npm run dev          # Next.js + Inngest dev server
npm run db:push      # Apply drizzle schema to the DB
npm run db:seed      # Seed 100 members
npm run setup-vapi   # Create/update the Vapi assistant
npm run test         # Run vitest
npm run typecheck    # tsc --noEmit
```

## Project layout

```
src/
  app/                   Next.js App Router (pages + API routes)
  domain/questionnaire.ts S1–S5 typed
  db/                    Drizzle schema, client, queries
  vapi/                  Vapi client, types, tools, webhook parsing
  inngest/               Inngest client + end-of-call functions
  evaluation/            LLM-as-judge runners + result schemas
  observability/         Logger + Langfuse wrapper
  prompts/               System prompt + judge prompts (markdown)
  server/recorder.ts     Vapi webhook handler
  lib/                   Client-side helpers
scripts/
  seed-demo.ts           Seed 100 members
  setup-vapi.ts          Configure the Vapi assistant
tests/                   Vitest unit tests
```

See `DEMO.md` for the live-demo walkthrough.
