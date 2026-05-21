# FrenchFlow AI

An AI-powered French tutor that answers grammar and vocabulary questions using a curated knowledge base.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Python, FastAPI, Uvicorn
- **AI/RAG:** OpenAI API (`text-embedding-3-small`, `gpt-4o-mini`), ChromaDB

## Features

- Ask any French grammar or vocabulary question in natural language
- Choose your learner level: Beginner, Intermediate, or Advanced
- Receive a structured answer with explanation, usage examples, a practice question, and a source reference
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
- `POST /ask` — accepts `{ question, level }`, returns `{ answer, examples, practice_question, source_snippet }`

To refresh the knowledge base, delete `chroma_data/` and rerun `ingest.py`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Project Status

MVP complete. The full RAG pipeline is wired end-to-end: the frontend sends questions to the FastAPI backend, which retrieves relevant chunks from ChromaDB, calls GPT-4o-mini, and returns structured answers to the UI.
