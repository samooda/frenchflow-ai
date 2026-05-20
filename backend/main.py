from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal

app = FastAPI(title="FrenchFlow AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"


class AskResponse(BaseModel):
    answer: str
    examples: list[str]
    practice_question: str
    source_snippet: str


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
def ask(body: AskRequest):
    return AskResponse(
        answer="RAG pipeline not implemented yet.",
        examples=[],
        practice_question="",
        source_snippet="",
    )
