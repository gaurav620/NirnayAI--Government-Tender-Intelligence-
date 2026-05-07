# NirnayAI — Frontend + Backend (Theaification-NirnayAI)

## What this project is
NirnayAI is an AI-powered government tender evaluation platform for India. It lets procurement officers upload tender documents and bidder submissions, auto-extracts eligibility criteria using OCR + LLM, evaluates each bidder against those criteria, and produces a locked audit-ready report.

## Repo layout
```
app/
  dashboard/page.tsx        ← Main SPA. All workspace/tender/bidder UI lives here.
  api/
    workspaces/[id]/        ← CRUD for workspaces, documents, bidders, evaluations
    ml/
      process-document/     ← Proxies file uploads to Railway ML (OCR + text)
      extract-values/       ← Proxies bidder doc + criteria to Railway ML
      extract-values-json/  ← Same but text-only (no re-upload)
      chat/                 ← Proxies {system, message} to Railway ML /chat (LLM)
  criteria/page.tsx         ← Standalone criteria review page
  report/                   ← PDF-style locked audit report
lib/
  ml-pipeline.ts            ← Railway ML URL config + typed fetch helpers
  api-client.ts             ← All /api/* fetch wrappers used by the dashboard
  types.ts                  ← Shared TypeScript types (Criteria, Evidence, VendorResult…)
  prisma.ts                 ← Prisma client singleton
prisma/schema.prisma        ← PostgreSQL schema (Neon DB)
```

## Running locally
```bash
# Terminal 1 — frontend + Next.js API routes
npx next dev --turbopack        # http://localhost:3000

# Terminal 2 — FastAPI Python backend (if needed locally)
cd backend && python -m uvicorn main:app --reload --port 8000
```

## Key environment variables (`.env.local`)
```
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Database (Neon PostgreSQL)
DATABASE_URL=...

# Railway ML pipeline
ML_PIPELINE_URL=https://web-production-50a8f.up.railway.app
ML_API_KEY=                     # Optional — set same value as Railway ML_API_KEY env var

# LLM (used by frontend for direct Claude calls in some flows)
ANTHROPIC_API_KEY=...
```

## Tech stack
- **Next.js 16.2.4** with Turbopack, App Router, `"use client"` pages
- **Clerk** for auth (UserButton, `auth()` server-side, middleware)
- **Prisma + Neon PostgreSQL** for persistence
- **Railway ML pipeline** (`nirnay-ml` repo) for OCR and LLM extraction
- **Tailwind CSS** + Lucide icons + Framer Motion
- **Lucide icons used:** FileText, Plus, Folder, Trash2, X, UploadCloud, CheckCircle2, Clock, AlertCircle, File, ImageIcon, Send, ChevronRight, ChevronDown, ChevronLeft, User, Shield, Eye, Lock, Search, Copy, Check

## Database schema (key models)
```
User              — synced from Clerk (clerkId, email, role)
FileWorkspace     — one tender evaluation container per tender
  tenderStatus    — AWAITING_DOCS | SCANNING | CLARIFYING | READY
  tenderOverview  — JSON blob: { summary, extractedCriteria[], keyRequirements[] }
Document          — tender or bidder doc (name, size, type, status, extractedText)
  status          — QUEUED | SCANNING | COMPLETE | FAILED
Bidder            — one per company submitting a bid
Evaluation        — one per bidder, holds overall verdict + Criterion[]
ClarificationLog  — AI conversation history
```

## Dashboard state machine (tenderStatus)
```
awaiting_docs → ml_processing → scanning → clarifying → ready
```
- `awaiting_docs`: no docs uploaded yet
- `ml_processing`: upload triggered, docs being saved to DB
- `scanning`: OCR running on Railway ML
- `clarifying`: criteria extracted, user reviewing/confirming them
- `ready`: criteria confirmed, bidder evaluation can begin

## Criteria flow (no chat — auto-extract + review)
1. User uploads tender PDF
2. `processDocumentML` → Railway `/process-document` → OCR text
3. `callAnthropicAPI` with criteria extraction prompt → JSON array of criteria
4. Saved to `tenderOverview.extractedCriteria` in DB, status → `clarifying`
5. User sees editable criteria cards (label, description, threshold, mandatory toggle)
6. User clicks "Confirm All & Proceed" → status → `ready`

## Document preview (IndexedDB)
- On upload: file blob saved to browser IndexedDB keyed by `doc.id` via `saveFileIDB()`
- On preview click: `getFileIDB(doc.id)` → blob URL → rendered natively
  - PDF: `<iframe src={blobUrl}>` (browser native viewer)
  - Image: `<img src={blobUrl}>`
  - DOCX: extracted text (browsers can't render .docx natively)
- Docs uploaded before this feature shows "Re-upload to enable preview"

## Railway ML pipeline calls (from frontend)
All ML calls go through Next.js API proxy routes (not directly from browser):
```
POST /api/ml/process-document   → Railway /process-document   (OCR)
POST /api/ml/process-document   → Railway /extract-criteria   (action=extract-criteria)
POST /api/ml/extract-values     → Railway /extract-values     (bidder matching)
POST /api/ml/chat               → Railway /chat               (LLM general chat)
```
The ML proxy routes forward `X-API-Key: $ML_API_KEY` header when `ML_API_KEY` is set.

## ML call error handling
- `processDocumentML` failure is **non-fatal** — wrapped in inner try/catch in dashboard
- If Railway is sleeping (502), doc still gets marked `complete` and workspace moves to `scanning`
- `updateDocumentText` failure is **non-fatal** — text save error is logged but doc proceeds
- Extracted text truncated to 800 000 chars before saving (Next.js 20 MB body limit)

## Body size limit
`next.config.mjs` sets `experimental.serverBodySizeLimit: '20mb'` to handle large PDF extracted text in PATCH /api/workspaces/[id]/documents.

## API routes pattern
All workspace routes are under `app/api/workspaces/[id]/` (param name is `id`, not `workspaceId`).

## Critical constraint — no ELIGIBLE/NOT_ELIGIBLE in ML pipeline
The ML pipeline (`nirnay-ml`) must NEVER return `ELIGIBLE` or `NOT_ELIGIBLE` verdicts. It returns `PASS_TO_RULE_ENGINE` or `MANUAL_REVIEW` only. Final eligibility decisions belong to Gaurav's `rule_engine.py` (separate module).

## Git / deploy notes
- **Never `git push` without explicit user approval** (user stated this after an unauthorized push)
- Frontend deploys separately from ML pipeline
- ML pipeline (`nirnay-ml`) deploys to Railway on push to `main`
- Prisma migrations: `npx prisma migrate dev` locally, `npx prisma migrate deploy` in CI

## Common gotchas
- The `[id]` route param is named `id` in route files but called `workspaceId` in `api-client.ts` — Next.js routes by URL pattern so this works but is confusing
- `callAnthropicAPI` in dashboard returns `[]` (not a string) as mock fallback — always parse with `parseJSONResponse`
- `tenderStatus` is stored as uppercase enum in DB (`SCANNING`) but returned as lowercase to frontend (`scanning`) via `docStatusDbToFe` transform
- The `/criteria` page uses `useSearchParams` without a Suspense boundary — this causes a prerender warning in `next build` but works fine in dev
