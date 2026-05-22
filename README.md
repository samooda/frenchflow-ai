# FrenchFlow AI

An AI-powered French tutor that answers grammar and vocabulary questions using a curated knowledge base.

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white) ![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6F00?style=flat) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

![FrenchFlow AI — structured answer with examples, practice question, and source snippet](docs/screenshot.jpg)

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Python, FastAPI, Uvicorn
- **AI/RAG:** OpenAI API (`text-embedding-3-small`, `gpt-4o-mini`), ChromaDB

## Features

- Ask any French grammar or vocabulary question in natural language
- Choose your learner level: Beginner, Intermediate, or Advanced
- Receive a structured answer with explanation, usage examples, a practice question, and a source reference
- Explanations and practice questions are always in English; French example sentences are preserved in French
- Fully keyboard-accessible — level selector supports arrow-key navigation
- Loading, error, and success states with smooth transitions

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your OPENAI_API_KEY
```

Embed the seed knowledge base (run once):

```bash
python ingest.py
```

Start the server:

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.
- `GET /` — health check
- `POST /ask` — accepts `{ question, level }`, returns `{ answer, examples, practice_question, source_snippet }`. Rate-limited to 10 requests/minute per IP.

To refresh the knowledge base, delete `chroma_data/` and rerun both ingest scripts:

```bash
python ingest.py
python ingest_tex.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Project Status

Fully working local MVP with a complete data ingestion pipeline. Source content from [Tex's French Grammar](https://www.laits.utexas.edu/tex/) was fetched, cleaned, and chunked into 17 retrievable entries, expanding the local ChromaDB knowledge base from 10 seed chunks to 27 total chunks. At query time, questions are embedded with `text-embedding-3-small`, the top 3 chunks are retrieved, and `gpt-4o-mini` returns a structured JSON response (answer, examples, practice question, source snippet). Responses are enforced in English; the API is rate-limited at 10 req/min per IP. Verified end-to-end through the browser UI.

## Future Improvements

- Supabase Auth — user accounts and session management
- User profiles — saved level preference and personalisation
- Saved vocabulary — bookmark words and phrases for review
- Question and answer history — revisit past sessions
- Deployment — input limits, CORS restrictions, and usage controls (Vercel + Render/Railway)
- Security hardening — rate limit tuning, input validation, API key rotation policy
- Docker / Kubernetes — optional later DevOps improvements

## Attribution

The knowledge base includes content from [Tex's French Grammar](https://www.laits.utexas.edu/tex/), authored by Carl Blyth with contributions from Karen Kelton, Lindsy Myers, Catherine Delyfer, Yvonne Munn, and Jane Lippmann (University of Texas at Austin, Dept. of French and Italian, COERLL). Licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0). Content was fetched, cleaned, processed, and chunked for RAG retrieval context.
