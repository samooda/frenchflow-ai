# FrenchFlow AI

An AI-powered French tutor that answers grammar and vocabulary questions using a curated knowledge base.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Python, FastAPI, Uvicorn
- **AI/RAG:** OpenAI API, ChromaDB

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your OPENAI_API_KEY
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Health check: `GET /`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # set VITE_API_URL if backend port differs
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Project Status

MVP in progress.
