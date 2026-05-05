# NirnayAI — Explainable Tender Evaluation Platform

Production-grade, full-stack platform for AI-powered government tender evaluation with human-in-the-loop verification.

Next.js 14 App Router frontend + FastAPI backend + deterministic rule engine + optional ML pickle-model integration.

## Highlights

- **Explainable by design** — every verdict ships with extracted value, threshold, reasoning, confidence, and source document.
- **Deterministic rule engine** — no LLM hallucinations in final verdicts; transparent pass/fail/review logic.
- **Officer-in-the-loop** — toggle which criteria apply, confirm, and review evidence before decisions.
- **Pluggable ML** — deterministic mocks ship by default; drop in pickle files from Colab to enable real extraction.
- **Premium UI** — glassmorphism, aurora hero, live backend status, toast notifications, responsive sidebar nav.
- **Production security posture** — CORS-scoped APIs, encrypted intake, temp-only storage, global exception handler.

## Architecture

```
┌────────────────────┐      HTTP (CORS)      ┌─────────────────────┐
│  Next.js 14 (3000) │  ──────────────────>  │  FastAPI (8000)     │
│  TypeScript        │                       │  Pydantic v2        │
│  Tailwind + shadcn │                       │  Rule Engine        │
│  Toast + sessions  │  <──────────────────  │  ML loader (pkl)    │
└────────────────────┘      JSON (camelCase) └─────────────────────┘
```

## Quick start

### 1. Frontend

```bash
npm install
cp .env.example .env           # adjust NEXT_PUBLIC_API_BASE_URL if needed
npm run dev                    # http://localhost:3000
```

### 2. Backend

```bash
cd backend
pip3 install -r requirements.txt
cp .env.example .env           # optional — sensible defaults work
python3 -m uvicorn main:app --reload
# http://localhost:8000  →  redirects to /docs
```

The frontend will automatically detect whether the backend is online via `/health` and show the status in the sidebar + footer.

## Environment variables

See [`ENV.md`](./ENV.md) for the full reference. In short:

| File | Purpose |
|------|---------|
| `.env` (project root) | Frontend — `NEXT_PUBLIC_API_BASE_URL` |
| `backend/.env` | Backend — CORS, ports, ML paths, logging |

## Adding your ML models (from Colab)

When your pickle files are ready:

1. Drop `*.pkl` into `backend/models/`
2. Edit `backend/.env`:
   ```env
   USE_ML=true
   ML_MODEL_PATH=./models/criteria_extractor.pkl
   ML_VENDOR_MODEL_PATH=./models/vendor_extractor.pkl
   ```
3. Restart uvicorn. Confirm at `GET /health`:
   ```json
   { "ml_enabled": true, "ml_criteria_model_loaded": true }
   ```

The rule engine keeps running either way — no frontend or API changes required.

## API reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/upload` | Multipart intake of tender + vendor PDFs. Returns file IDs. |
| `POST` | `/extract-criteria` | Body: `{ tenderFileId }`. Returns list of criteria. |
| `POST` | `/evaluate` | Body: `{ vendorFileIds, criteria }`. Returns vendor results. |
| `GET` | `/results` | Latest results (or seeded demo data). |
| `GET` | `/health` | System + ML loader status. |
| `GET` | `/docs` | Swagger UI. |

All responses are camelCase for direct frontend consumption.

## Build

```bash
npm run build           # frontend
```

Backend has no build step — uvicorn runs directly against `main.py`.

## Project layout

```
Tendor-Pr/
├── app/                       # Next.js routes
│   ├── page.tsx              # Landing
│   ├── upload/, criteria/, dashboard/, login/, signup/
│   └── layout.tsx            # Root layout with ToastProvider
├── components/
│   ├── app-shell.tsx         # Nav + sidebar + footer
│   ├── backend-status.tsx    # Live /health indicator
│   ├── ui/toast.tsx          # Toast system
│   └── …                     # evidence-panel, vendor-table, etc.
├── lib/
│   ├── api.ts                # Typed API client + ApiError
│   ├── types.ts              # Shared frontend types
│   └── mock-data.ts          # Offline fallback
├── backend/
│   ├── main.py               # FastAPI entrypoint
│   ├── config.py             # Env-driven settings
│   ├── routes/               # /upload /extract-criteria /evaluate /results
│   ├── services/
│   │   ├── ml_service.py     # Extraction + evaluation
│   │   ├── ml_loader.py      # Pickle model loader
│   │   └── rule_engine.py    # Deterministic verdict logic
│   ├── models/schemas.py     # Pydantic w/ camelCase aliases
│   └── utils/helpers.py      # Temp file I/O
├── ENV.md                    # Environment variable reference
└── README.md
```

## License

MIT.

