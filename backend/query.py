"""
CLI wrapper for a single RAG query against the FrenchFlow Pinecone index.

Shows the top-3 retrieved chunks (id, score, topic, preview) so retrieval
quality is visible, then prints the full structured answer from rag.py.

Usage:
    python query.py "your question here" [level]

level defaults to 'beginner'.
"""

import os
import sys

from openai import OpenAI
from pinecone import Pinecone

from pipeline_config import EMBED_MODEL, PINECONE_INDEX_NAME, PINECONE_NAMESPACE
from rag import answer_question


def _preview(text, n=160):
    flat = " ".join(text.split())
    return flat[:n] + ("..." if len(flat) > n else "")


def _namespace_label():
    return PINECONE_NAMESPACE or "(default)"


def _vector_count(stats):
    if PINECONE_NAMESPACE:
        namespace_stats = stats.namespaces.get(PINECONE_NAMESPACE)
        return namespace_stats.vector_count if namespace_stats else 0
    return stats.total_vector_count


def main():
    if len(sys.argv) < 2:
        print('Usage: python query.py "your question" [level]')
        sys.exit(1)

    question = sys.argv[1]
    level = sys.argv[2] if len(sys.argv) >= 3 else "beginner"

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not set in backend/.env.")
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    if not pinecone_api_key:
        raise SystemExit("PINECONE_API_KEY not set in backend/.env.")

    client = OpenAI(api_key=api_key)
    index = Pinecone(api_key=pinecone_api_key).Index(PINECONE_INDEX_NAME)

    print(f"Question        : {question}")
    print(f"Level           : {level}")
    print(f"Index           : {PINECONE_INDEX_NAME}")
    print(f"Namespace       : {_namespace_label()}")
    print(f"Vector count    : {_vector_count(index.describe_index_stats())}")

    embed = (
        client.embeddings.create(model=EMBED_MODEL, input=question).data[0].embedding
    )
    results = index.query(
        vector=embed,
        top_k=3,
        namespace=PINECONE_NAMESPACE,
        include_metadata=True,
    )

    print("\n--- Top-3 retrieved chunks ---")
    for i, match in enumerate(results.matches or []):
        meta = match.metadata or {}
        doc = meta.get("text", "")
        topic = (meta or {}).get("topic", "") or "(no metadata)"
        score_s = f"{match.score:.4f}" if match.score is not None else "n/a"
        print(f"[{i}] id={match.id}  score={score_s}  topic={topic!r}")
        print(f"    {_preview(doc)}")

    print("\n--- RAG answer ---")
    answer = answer_question(question, level)
    for key, val in answer.items():
        print(f"{key}: {val}\n")


if __name__ == "__main__":
    main()
