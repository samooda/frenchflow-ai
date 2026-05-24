"""
CLI wrapper for a single RAG query against the FrenchFlow collection.

Shows the top-3 retrieved chunks (id, distance, topic, preview) so retrieval
quality is visible, then prints the full structured answer from rag.py.

Usage:
    python query.py "your question here" [level]

level defaults to 'beginner'.
"""

import os
import sys

import chromadb
from openai import OpenAI

from pipeline_config import DB_PATH, COLLECTION_NAME, EMBED_MODEL
from rag import answer_question


def _preview(text, n=160):
    flat = " ".join(text.split())
    return flat[:n] + ("..." if len(flat) > n else "")


def main():
    if len(sys.argv) < 2:
        print('Usage: python query.py "your question" [level]')
        sys.exit(1)

    question = sys.argv[1]
    level = sys.argv[2] if len(sys.argv) >= 3 else "beginner"

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not set in backend/.env.")

    client = OpenAI(api_key=api_key)
    collection = chromadb.PersistentClient(path=DB_PATH).get_or_create_collection(
        COLLECTION_NAME
    )

    print(f"Question        : {question}")
    print(f"Level           : {level}")
    print(f"Collection size : {collection.count()}")

    embed = (
        client.embeddings.create(model=EMBED_MODEL, input=question).data[0].embedding
    )
    results = collection.query(
        query_embeddings=[embed],
        n_results=3,
        include=["documents", "metadatas", "distances"],
    )
    ids = (results.get("ids") or [[]])[0]
    docs = (results.get("documents") or [[]])[0]
    metas = (results.get("metadatas") or [[]])[0] or [None] * len(ids)
    dists = (results.get("distances") or [[]])[0] or [None] * len(ids)

    print("\n--- Top-3 retrieved chunks ---")
    for i, (id_, doc, meta, dist) in enumerate(zip(ids, docs, metas, dists)):
        topic = (meta or {}).get("topic", "") or "(no metadata)"
        dist_s = f"{dist:.4f}" if dist is not None else "n/a"
        print(f"[{i}] id={id_}  dist={dist_s}  topic={topic!r}")
        print(f"    {_preview(doc)}")

    print("\n--- RAG answer ---")
    answer = answer_question(question, level)
    for key, val in answer.items():
        print(f"{key}: {val}\n")


if __name__ == "__main__":
    main()
