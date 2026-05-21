# To refresh MVP seed content: delete chroma_data/ and rerun this script.
# Content hashing to detect changes is a future improvement.

import os
import sys
from dotenv import load_dotenv

_dir = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(_dir, ".env"))

_raw_db_path = os.getenv("CHROMA_DB_PATH", "./chroma_data")
DB_PATH = _raw_db_path if os.path.isabs(_raw_db_path) else os.path.join(_dir, _raw_db_path)
DATA_PATH = os.path.join(_dir, "data", "french_basics.txt")


def main():
    import chromadb
    from openai import OpenAI

    chroma = chromadb.PersistentClient(path=DB_PATH)
    collection = chroma.get_or_create_collection("french_grammar")

    if collection.count() > 0:
        print(f"Collection already has {collection.count()} documents. Skipping ingestion.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    parts = content.split("\n\n## ")
    chunks = [parts[0].strip()] + ["## " + p.strip() for p in parts[1:]]
    chunks = [c for c in chunks if c]

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.embeddings.create(model="text-embedding-3-small", input=chunks)
    embeddings = [item.embedding for item in response.data]

    collection.add(
        ids=[f"chunk_{i}" for i in range(len(chunks))],
        documents=chunks,
        embeddings=embeddings,
    )

    print(f"Embedded {len(chunks)} chunks into 'french_grammar' collection at {DB_PATH}")


if __name__ == "__main__":
    main()
