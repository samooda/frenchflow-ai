"""
Embeds processed Tex chunks into Pinecone.

Reads backend/data/processed_chunks/tex_*.json, embeds chunk["text"] via
text-embedding-3-small, and upserts into the Pinecone index used by rag.py.
Stable IDs (tex_{slug}_{n}) come from process_tex.py.

Usage:
    python ingest_tex.py --dry-run   # plan only; no OpenAI / Pinecone writes
    python ingest_tex.py             # embed + upsert
    python ingest_tex.py --reset     # clear namespace, then embed + upsert
"""

import argparse
import glob
import json
import os

from pipeline_config import (
    CHUNKS_DIR,
    EMBED_MODEL,
    PINECONE_INDEX_NAME,
    PINECONE_NAMESPACE,
)

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
    metadata = {k: chunk.get(k, "") for k in _METADATA_FIELDS}
    metadata["text"] = chunk["text"]
    return metadata


def _namespace_label():
    return PINECONE_NAMESPACE or "(default)"


def _vector_count(stats):
    if PINECONE_NAMESPACE:
        namespace_stats = stats.namespaces.get(PINECONE_NAMESPACE)
        return namespace_stats.vector_count if namespace_stats else 0
    return stats.total_vector_count


def main():
    parser = argparse.ArgumentParser(description="Embed Tex chunks into Pinecone.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print plan only; no OpenAI calls or Pinecone writes.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all vectors in the target namespace before upserting.",
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
    print(f"Index       : {PINECONE_INDEX_NAME}")
    print(f"Namespace   : {_namespace_label()}")
    print(f"Embed model : {EMBED_MODEL}")
    print(f"Chunks      : {len(chunks)}")
    print(f"Total words : {total_words}")
    print(f"Total chars : {total_chars}")
    print(f"ID samples  : {ids[0]} ... {ids[-1]}  ({len(ids)} unique)")

    if args.dry_run:
        print("\n--dry-run: skipping OpenAI embedding and Pinecone upsert.")
        return

    from openai import OpenAI
    from pinecone import Pinecone

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise SystemExit("OPENAI_API_KEY not set in backend/.env.")
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    if not pinecone_api_key:
        raise SystemExit("PINECONE_API_KEY not set in backend/.env.")

    client = OpenAI(api_key=openai_api_key)
    pc = Pinecone(api_key=pinecone_api_key)
    index = pc.Index(PINECONE_INDEX_NAME)

    before = _vector_count(index.describe_index_stats())
    print(f"\nNamespace size before : {before}")

    if args.reset:
        if before:
            print(f"Resetting namespace '{_namespace_label()}' ...")
            index.delete(delete_all=True, namespace=PINECONE_NAMESPACE)
            before = _vector_count(index.describe_index_stats())
            print(f"Namespace size after reset : {before}")
        else:
            print(f"Namespace '{_namespace_label()}' is already empty; skipping reset.")

    texts = [c["text"] for c in chunks]
    print(f"Embedding {len(texts)} chunks via {EMBED_MODEL} ...")
    response = client.embeddings.create(model=EMBED_MODEL, input=texts)
    embeddings = [item.embedding for item in response.data]

    print(f"Upserting into Pinecone index '{PINECONE_INDEX_NAME}' ...")
    upsert_response = index.upsert(
        vectors=[
            (chunk_id, embedding, _metadata(chunk))
            for chunk_id, embedding, chunk in zip(ids, embeddings, chunks)
        ],
        namespace=PINECONE_NAMESPACE,
    )

    after = _vector_count(index.describe_index_stats())
    print(f"Namespace size after  : {after}")
    print(f"Done. Upserted {upsert_response.upserted_count} Tex chunks.")


if __name__ == "__main__":
    main()
