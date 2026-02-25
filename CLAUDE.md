# Ops Map - Claude Code Instructions

## Project Overview
Ops Map is an operational management platform providing two views of business operations:
- **Function Chart** (organizational view): Who owns what?
- **Workflow Map** (sequential view): How does work flow?

## Tech Stack
- **Frontend:** Next.js 14+ (App Router) with TypeScript (strict mode)
- **Database:** PostgreSQL via Supabase (JSONB for custom properties, typed columns for standard)
- **Auth:** Supabase Auth
- **API:** Next.js Server Actions (internal), REST for future agent API
- **Real-time:** Supabase Realtime
- **Search:** PostgreSQL full-text search (pg_trgm + tsvector)
- **Markdown Editor:** TipTap or Milkdown
- **Drag-and-drop:** dnd-kit
- **Styling:** Tailwind CSS + shadcn/ui
- **File Storage:** Supabase Storage (profile photos)
- **Hosting:** Vercel (auto-deploys from main branch)

## Key References
- `IMPLEMENTATION_PLAN.md` — Phased implementation plan (7 MVP phases + post-MVP)
- `Ops Map — MVP Specification v1.0.md` — Full MVP spec with objects, views, navigation
- `Ops Map — Product Schema v1.0.md` — Complete object schemas and associations
- `Ops Map — Product Roadmap v1.0.md` — Full product roadmap
- `Ops Map — User Flows v1.0.md` — User flow details

## Development Rules
- Follow the implementation plan phases strictly — complete each phase before starting the next
- All database migrations go through Supabase CLI (`supabase/migrations/`)
- Never commit `.env`, `.env.local`, or any secrets
- Use TypeScript strict mode throughout
- All tables must have RLS policies
- All mutations must log to `activity_log` table
- Multi-tenancy via `organization_id` on all tables from day 1
- Computed fields must be consistent and accurate
- Prefer Server Actions over API routes for internal operations

## Infrastructure
- **GitHub:** github.com/khalilgitsit/operationsmap (main branch)
- **Vercel:** linked, auto-deploys from main
- **Supabase project:** luculxglaodhvxhmlpyc (us-east-1)
- Environment variables are in `.env` (not committed)

## MVP Objects (7)
Function, Subfunction, Process, Core Activity, Person, Role, Software

## Folder Structure
```
src/
  app/           # Next.js routes
  components/    # Shared UI components
  lib/           # Utilities, DB client, API helpers
  types/         # TypeScript type definitions
  hooks/         # Custom React hooks
  server/        # Server-side logic (API routes, actions)
```
