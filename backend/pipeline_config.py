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

_raw_db_path = os.getenv("CHROMA_DB_PATH", "./chroma_data")
DB_PATH = _raw_db_path if os.path.isabs(_raw_db_path) else os.path.join(_dir, _raw_db_path)


def load_manifest():
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        return json.load(f)
