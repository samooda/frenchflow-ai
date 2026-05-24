"""
Embeds processed Tex chunks into ChromaDB.

Reads backend/data/processed_chunks/tex_*.json, embeds chunk["text"] via
text-embedding-3-small, and upserts into the 'french_grammar' ChromaDB
collection used by rag.py. Stable IDs (tex_{slug}_{n}) come from
process_tex.py.

Usage:
    python ingest_tex.py --dry-run   # plan only; no OpenAI / Chroma writes
    python ingest_tex.py             # embed + upsert
"""

import argparse
import glob
import json
import os

from pipeline_config import CHUNKS_DIR, DB_PATH, COLLECTION_NAME, EMBED_MODEL

_METADATA_FIELDS = (
    "topic",
    "level",
    "source_title",
    "source_url",
    "license",
    "license_url",
    "attribution",
    "source_type",
    "retrieved_at",
)


def _load_chunks():
    """Return chunks aggregated from every tex_*.json file (skipping the report)."""
    paths = sorted(
        p
        for p in glob.glob(os.path.join(CHUNKS_DIR, "tex_*.json"))
        if os.path.basename(p) != "tex_processing_report.json"
    )
    chunks = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            chunks.extend(json.load(f))
    return chunks


def _metadata(chunk):
    return {k: chunk.get(k, "") for k in _METADATA_FIELDS}


def main():
    parser = argparse.ArgumentParser(description="Embed Tex chunks into ChromaDB.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print plan only; no OpenAI calls or Chroma writes.",
    )
    args = parser.parse_args()

    chunks = _load_chunks()
    if not chunks:
        raise SystemExit(f"No chunk files found under {CHUNKS_DIR}.")

    ids = [c["id"] for c in chunks]
    seen = {}
    for i in ids:
        seen[i] = seen.get(i, 0) + 1
    dupes = {k: v for k, v in seen.items() if v > 1}
    if dupes:
        raise SystemExit(f"Duplicate chunk IDs found: {dupes}")

    total_chars = sum(len(c["text"]) for c in chunks)
    total_words = sum(c.get("word_count", 0) for c in chunks)

    print(f"Source dir  : {CHUNKS_DIR}")
    print(f"DB path     : {DB_PATH}")
    print(f"Collection  : {COLLECTION_NAME}")
    print(f"Embed model : {EMBED_MODEL}")
    print(f"Chunks      : {len(chunks)}")
    print(f"Total words : {total_words}")
    print(f"Total chars : {total_chars}")
    print(f"ID samples  : {ids[0]} ... {ids[-1]}  ({len(ids)} unique)")

    if args.dry_run:
        print("\n--dry-run: skipping OpenAI embedding and Chroma upsert.")
        return

    import chromadb
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not set in backend/.env.")

    client = OpenAI(api_key=api_key)
    chroma = chromadb.PersistentClient(path=DB_PATH)
    collection = chroma.get_or_create_collection(COLLECTION_NAME)
    before = collection.count()
    print(f"\nCollection size before : {before}")

    texts = [c["text"] for c in chunks]
    print(f"Embedding {len(texts)} chunks via {EMBED_MODEL} ...")
    response = client.embeddings.create(model=EMBED_MODEL, input=texts)
    embeddings = [item.embedding for item in response.data]

    print(f"Upserting into '{COLLECTION_NAME}' ...")
    collection.upsert(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=[_metadata(c) for c in chunks],
    )

    after = collection.count()
    print(f"Collection size after  : {after}")
    print(f"Done. Upserted {len(ids)} Tex chunks ({after - before} new).")


if __name__ == "__main__":
    main()
