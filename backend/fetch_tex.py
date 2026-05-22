"""
Stage 1 of the Tex's French Grammar ingestion pipeline.

Fetches raw HTML pages listed in tex_manifest.json and saves them to
backend/data/raw_sources/tex_french_grammar/. Writes a .meta.json sidecar
alongside each HTML file recording the URL, HTTP status, and retrieval
timestamp.

On the first run (or when tex_manifest_meta.json is absent), also extracts
the CC license URL and footer attribution text from the first successfully
fetched page and saves them to backend/data/sources/tex_manifest_meta.json.
This file becomes the source of truth for attribution metadata used by
later pipeline stages.

Usage:
    python fetch_tex.py           # skip pages already on disk
    python fetch_tex.py --force   # re-fetch all pages
"""

import argparse
import json
import os
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

from pipeline_config import MANIFEST_META_PATH, RAW_DIR, load_manifest

HEADERS = {"User-Agent": "FrenchFlow-AI/1.0 Educational Research Bot"}
TIMEOUT = 10
DELAY = 1.0


def _now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _fetch_page(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        return r.status_code, r.text
    except requests.RequestException as e:
        print(f"  WARNING: request failed for {url}: {e}")
        return None, None


def _extract_manifest_meta(html, source_url):
    soup = BeautifulSoup(html, "html.parser")

    license_url = None
    for a in soup.find_all("a", href=True):
        if "creativecommons.org" in a["href"]:
            href = a["href"]
            if href.startswith("//"):
                href = "https:" + href
            license_url = href.rstrip("/")
            break

    footer_text = None
    for tag in soup.find_all(string=True):
        text = tag.strip()
        if "tex's french grammar" in text.lower() and "français interactif" in text.lower():
            footer_text = text
            break

    return {
        "source_title": "Tex's French Grammar",
        "source_url": "https://www.laits.utexas.edu/tex/",
        "primary_author": "Carl Blyth",
        "contributors": "Karen Kelton, Lindsy Myers, Catherine Delyfer, Yvonne Munn, Jane Lippmann",
        "institution": "University of Texas at Austin, Dept. of French and Italian, COERLL",
        "license": "CC BY 3.0",
        "license_url": license_url or "https://creativecommons.org/licenses/by/3.0/",
        "footer_text_extracted": footer_text,
        "extracted_from": source_url,
        "extracted_at": _now_iso(),
        "credits_note": (
            "Author and institution details verified via credits.html during planning "
            "(Carl Blyth et al., UT Austin / COERLL). The credits.html page returned "
            "HTTP 404 at fetch time; details above were captured via WebFetch before "
            "implementation began. The license URL was extracted programmatically from "
            "the CC badge on a live grammar page."
        ),
    }


def _save_manifest_meta(html, source_url):
    meta = _extract_manifest_meta(html, source_url)
    os.makedirs(os.path.dirname(MANIFEST_META_PATH), exist_ok=True)
    with open(MANIFEST_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"  Attribution metadata saved to {MANIFEST_META_PATH}")
    print(f"    license_url : {meta['license_url']}")
    print(f"    footer_text : {meta.get('footer_text_extracted') or '(not found in page)'}")


def fetch_all(force=False):
    os.makedirs(RAW_DIR, exist_ok=True)
    entries = load_manifest()
    manifest_meta_exists = os.path.exists(MANIFEST_META_PATH)

    fetched = skipped = failed = 0

    for entry in entries:
        id_ = entry["id"]
        url = entry["url"]
        html_path = os.path.join(RAW_DIR, f"{id_}.html")
        meta_path = os.path.join(RAW_DIR, f"{id_}.meta.json")

        if os.path.exists(html_path) and not force:
            print(f"  SKIP  {id_} (already on disk)")
            skipped += 1
            continue

        print(f"  FETCH {id_} — {url}")
        time.sleep(DELAY)
        status, html = _fetch_page(url)

        if status != 200 or html is None:
            print(f"  FAIL  {id_} — HTTP {status}")
            failed += 1
            continue

        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)

        sidecar = {
            "id": id_,
            "url": url,
            "retrieved_at": _now_iso(),
            "http_status": status,
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(sidecar, f, indent=2)

        if not manifest_meta_exists:
            _save_manifest_meta(html, url)
            manifest_meta_exists = True

        fetched += 1

    print(f"\nDone — fetched: {fetched}, skipped: {skipped}, failed: {failed}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch Tex's French Grammar pages.")
    parser.add_argument("--force", action="store_true", help="Re-fetch pages already on disk")
    args = parser.parse_args()
    fetch_all(force=args.force)
