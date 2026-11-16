# Brasaland Talent Pipeline Tracker

Internal tool for **Brasaland People & Culture** to run the **Executive Assistant** selection process
(Corporate headquarters, Medellín). Replaces the shared Google Sheet: one place to see every candidate,
move them through the pipeline, and keep interview notes.

Built by Brasaland Digital with **Next.js (App Router) + React + TypeScript + Tailwind CSS**, on top of the
shared Talent Tracker API ([docs](https://playground.4geeks.com/tracker/api/v1/docs)).

## Features

| Need (from Ashley Turner, People Manager) | Where |
| --- | --- |
| See all candidates: name, position, status, stage | `/` |
| Filter by status and stage (URL query params) and search by name/email without reloading | `/` → `?status=&stage=&q=` |
| Open a candidate and change status or stage in one interaction (`PATCH`) | `/candidates/[id]` |
| Add and delete internal notes (only visible in the detail view) | `/candidates/[id]` |
| Register candidates from other channels (`POST`) | `/candidates/new` |
| Correct candidate data (`PUT`) | `/candidates/[id]/edit` |

Every request is async/await and shows loading, success and error states. Raw API values
(`in_progress`, `personal_interview`, …) are never shown — see `src/lib/labels.ts`.

## Getting started

```bash
cd uis/talent-pipeline-tracker
cp .env.example .env.local   # sets NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:3000
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Talent Tracker API, no trailing slash. Default: `https://playground.4geeks.com/tracker/api/v1` |

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Project structure

```
src/
├── app/                      # Routes (App Router)
│   ├── page.tsx              # Candidate list
│   └── candidates/
│       ├── new/page.tsx      # Register candidate
│       └── [id]/page.tsx     # Candidate detail (+ /edit)
├── components/
│   ├── candidates/           # List view + filters
│   ├── candidate-detail/     # Profile, pipeline controls, notes
│   ├── candidate-form/       # Shared create/edit form
│   └── …                     # Header, badges, toasts, loading/error views
├── hooks/                    # useAsyncResource, useCandidateList, useNotes, CandidateContext
├── services/                 # API client + candidate endpoints (all data access)
├── lib/                      # Labels, validation, formatting, company context
└── types/                    # TypeScript types for API data
```

State is kept local with hooks. The detail page shares the loaded candidate through a scoped React
context (`CandidateProvider`) instead of prop drilling; toasts use an app-level context. No external
state libraries.
