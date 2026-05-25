import os
import json
from openai import OpenAI
from pinecone import Pinecone

from pipeline_config import EMBED_MODEL, PINECONE_INDEX_NAME, PINECONE_NAMESPACE

_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
_index = _pinecone_client.Index(PINECONE_INDEX_NAME)

_FALLBACK = {
    "answer": "Sorry, I could not generate an answer. Please try again.",
    "examples": [],
    "practice_question": "",
    "source_snippet": "",
}

_SYSTEM_PROMPT = (
    "You are a French language tutor. "
    "Answer the user's question using only the provided content. "
    "Respond with a JSON object containing exactly these keys: "
    '"answer" (string), '
    '"examples" (array of exactly 2 example sentences), '
    '"practice_question" (string), '
    '"source_snippet" (the single most relevant sentence copied verbatim from the provided content). '
    "Adjust the explanation for a {level} learner. Be concise. "
    "Write the answer and practice_question in English. "
    "Keep French example sentences in French when useful. "
    "The source_snippet must remain copied verbatim from the retrieved source."
)


def answer_question(question: str, level: str) -> dict:
    embed_response = _openai_client.embeddings.create(
        model=EMBED_MODEL,
        input=question,
    )
    question_embedding = embed_response.data[0].embedding

    results = _index.query(
        vector=question_embedding,
        top_k=3,
        namespace=PINECONE_NAMESPACE,
        include_metadata=True,
    )
    matches = results.matches or []
    if not matches:
        return _FALLBACK
    chunks = [
        match.metadata.get("text", "")
        for match in matches
        if match.metadata and match.metadata.get("text")
    ]
    if not chunks:
        return _FALLBACK

    context = "\n---\n".join(chunks)
    user_msg = f"Question: {question}\n\nRelevant content:\n{context}"

    completion = _openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT.format(level=level)},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        max_tokens=350,
        timeout=30,
    )

    raw = completion.choices[0].message.content
    if not raw:
        return _FALLBACK
    try:
        result = json.loads(raw)
        if not isinstance(result.get("examples"), list):
            result["examples"] = []
        return {
            "answer": str(result.get("answer", "")),
            "examples": [str(e) for e in result["examples"]],
            "practice_question": str(result.get("practice_question", "")),
            "source_snippet": str(result.get("source_snippet", "")),
        }
    except (json.JSONDecodeError, KeyError):
        return _FALLBACK


if __name__ == "__main__":
    result = answer_question(
        "How do I use être vs avoir in passé composé?", "beginner"
    )
    for key, val in result.items():
        print(f"{key}: {val}\n")
