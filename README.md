# LegalEase

AI-powered Indian legal assistant with a searchable legal library (semantic vector search) and chat grounded in your documents.

## Repo layout

- `frontend/`: Next.js 14 (App Router) web app (this is the main product)
- Root `package.json`: legacy/auxiliary; most development happens in `frontend/`

## Features

- **AI Ask** (`/ask`)
  - Streaming responses (token-by-token)
  - Sources shown for each answer
  - Related question suggestions
  - Export an answer to PDF (browser print-to-PDF)
  - Chat history persisted to Supabase and shown on `/ask` + `/dashboard`
- **Legal Library** (`/library`)
  - Semantic search using pgvector (Supabase RPC `match_documents`)
  - Filters by act/source, pagination
  - Click a card to open `/ask` pre-filled with that section
- **Case Studies** (`/case-studies`)
  - Browse sample IPC sections; click a card to open `/ask`
- **Admin documents panel** (`/admin/documents`)
  - Admin-only CRUD for `legal_documents`
  - Auto-generates embeddings on create/update

## Tech stack

- **Web**: Next.js 14, React 18, Tailwind CSS, Framer Motion, Lucide, Radix UI
- **Auth & DB**: Supabase (Postgres + pgvector)
- **Embeddings**: HuggingFace Inference API (384-dim)
- **LLM**: Groq (Llama 3.3)

## Prerequisites

- Node.js 18+
- A Supabase project with pgvector enabled
- API keys:
  - Groq API key
  - HuggingFace Inference API key

## Environment variables

Create `frontend/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI
GROQ_API_KEY=...
HF_API_KEY=...

# Admin allowlist (comma-separated emails)
ADMIN_EMAILS="admin@your.com,other@your.com"
NEXT_PUBLIC_ADMIN_EMAILS="admin@your.com,other@your.com"
```

## Database setup (Supabase)

1. Open Supabase SQL editor
2. Run the migration in:
   - `frontend/supabase/migrations/001_init.sql`

This creates:
- `legal_documents` (with `embedding vector(384)` + HNSW index)
- `query_history`
- `saved_laws`
- `match_documents` RPC for semantic search

## Run locally

```bash
cd frontend
npm install
npm run dev
```

If port 3000 is busy, Next will run on 3001 (check the terminal output).

## Notes

- `/ask?q=...` auto-submits the query and starts streaming a response.
- Library and blog cards link into `/ask` using that `q` parameter.

## Project maintainer & contact

- **Name**: Amay Malviya  
- **Email**: `amaymalviya2@gmail.com`  
- **LinkedIn**: [linkedin.com/in/Amay Malviya](https://linkedin.com/in/Amay%20Malviya)  
- **GitHub**: [github.com/AmayMalviya](https://github.com/AmayMalviya)  
- **Phone**: `+91 7440998199`  
- **PayPal**: [paypal.me/Amay Malviya](https://paypal.me/Amay%20Malviya)


