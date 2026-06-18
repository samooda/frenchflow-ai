import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from rag import answer_question

limiter = Limiter(key_func=get_remote_address)


def get_allowed_origins():
    raw_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    return [
        origin.strip().rstrip("/")
        for origin in raw_origins.split(",")
        if origin.strip()
    ]


app = FastAPI(title="FrenchFlow AI")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
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
@limiter.limit("10/minute")
def ask(request: Request, body: AskRequest):
    return AskResponse(**answer_question(body.question, body.level))
