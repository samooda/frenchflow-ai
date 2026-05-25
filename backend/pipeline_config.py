import os
import json
from dotenv import load_dotenv

_dir = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(_dir, ".env"))

DATA_DIR = os.path.join(_dir, "data")
MANIFEST_PATH = os.path.join(DATA_DIR, "sources", "tex_manifest.json")
MANIFEST_META_PATH = os.path.join(DATA_DIR, "sources", "tex_manifest_meta.json")
RAW_DIR = os.path.join(DATA_DIR, "raw_sources", "tex_french_grammar")
CHUNKS_DIR = os.path.join(DATA_DIR, "processed_chunks")

PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "frenchflow")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "")
EMBED_MODEL = "text-embedding-3-small"


def load_manifest():
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        return json.load(f)
