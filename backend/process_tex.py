"""
Phase 2 of the Tex's French Grammar ingestion pipeline.

Parses raw HTML pages, strips noise, extracts grammar content,
serializes tables cell-by-cell, and writes chunks to
backend/data/processed_chunks/.

Usage:
    python process_tex.py

Idempotent: re-running overwrites existing chunk files.
"""

import json
import os
import re
from datetime import datetime, timezone

from bs4 import BeautifulSoup, NavigableString

from pipeline_config import CHUNKS_DIR, MANIFEST_META_PATH, RAW_DIR, load_manifest

MIN_WORDS = 80
SPLIT_THRESHOLD = 600


def _now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_manifest_meta():
    with open(MANIFEST_META_PATH, encoding="utf-8") as f:
        return json.load(f)


def _read_raw(page_id):
    """Return (html_str, sidecar_meta_dict) or (None, {}) if file missing."""
    html_path = os.path.join(RAW_DIR, f"{page_id}.html")
    meta_path = os.path.join(RAW_DIR, f"{page_id}.meta.json")
    if not os.path.exists(html_path):
        return None, {}
    with open(html_path, encoding="utf-8") as f:
        html = f.read()
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
    return html, meta


def _serialize_table(table):
    """
    Convert a <table> to pipe-delimited row text.
    Called after inner tables have already been replaced with NavigableStrings,
    so find_all("tr") only sees rows belonging to this table.
    """
    rows = []
    for tr in table.find_all("tr"):
        cells = []
        for td in tr.find_all(["td", "th"], recursive=False):
            # separator="" + strip=False so adjacent <span> children don't get a
            # space injected between them — `je <span>parl</span><span>e</span>`
            # must serialize as "je parle", not "je parl e". Map &nbsp; to a real
            # space so token boundaries survive, then collapse runs of horizontal
            # whitespace. \n is preserved (an already-serialized inner table may
            # be embedded in this cell as a NavigableString).
            raw = td.get_text(separator="", strip=False).replace("\xa0", " ")
            text = re.sub(r"[ \t]+", " ", raw).strip()
            if text:
                cells.append(text)
        if cells:
            rows.append(" | ".join(cells))
    return "\n".join(rows)


def _extract_content_text(html_str):
    """
    Extract grammar content from a raw page HTML string.
    Returns (text: str, used_fallback: bool).
    """
    # Primary path: between <!-- content --> and <!-- END content -->.
    # Every Tex page closes the grammar block with <!-- END content -->;
    # <!-- texercises --> is absent on pages without quiz sections (e.g. tap8).
    match = re.search(
        r"<!--\s*content\s*-->(.*?)<!--\s*END\s+content\s*-->",
        html_str,
        re.DOTALL | re.IGNORECASE,
    )
    if match:
        content_html = match.group(1)
        used_fallback = False
    else:
        # Fallback: strip from <!-- texercises --> onward, then use div#mi
        tex_match = re.search(r"<!--\s*texercises\s*-->", html_str, re.IGNORECASE)
        trimmed = html_str[: tex_match.start()] if tex_match else html_str
        tmp = BeautifulSoup(trimmed, "html.parser")
        mi = tmp.find("div", id="mi")
        content_html = str(mi) if mi else trimmed
        used_fallback = True

    soup = BeautifulSoup(content_html, "html.parser")

    # Strip noise: scripts and images
    for tag in soup.find_all(["script", "img"]):
        tag.decompose()

    # Replace JS-only links with their inner text (audio icons become empty after img strip)
    for tag in soup.find_all("a"):
        href = tag.get("href", "")
        if href.lower().startswith("javascript:"):
            inner = tag.get_text(strip=True)
            tag.replace_with(NavigableString(inner) if inner else NavigableString(""))

    # Replace <br> with newlines before table serialization
    for br in soup.find_all("br"):
        br.replace_with(NavigableString("\n"))

    # Serialize tables bottom-up so outer tables see already-serialized inner content.
    # find_all returns document order (pre-order), so reversed gives innermost first.
    for table in reversed(soup.find_all("table")):
        serialized = _serialize_table(table)
        table.replace_with(NavigableString("\n" + serialized + "\n" if serialized else ""))

    text = soup.get_text(separator=" ")

    # Clean whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()

    return text, used_fallback


def _build_chunks(text, page_id, entry, meta, manifest_meta, processed_at):
    attribution = (
        f"{manifest_meta['source_title']} by {manifest_meta['primary_author']} et al., "
        f"{manifest_meta['institution']}, "
        f"licensed {manifest_meta['license']} ({manifest_meta['license_url']})"
    )

    def _chunk_dict(chunk_text, idx):
        return {
            "id": f"{page_id}_{idx}",
            "text": chunk_text,
            "source_title": entry["source_title"],
            "source_url": entry["url"],
            "license": entry["license"],
            "license_url": entry["license_url"],
            "attribution": attribution,
            "topic": entry["topic"],
            "level": entry["level"],
            "source_type": "open_educational_resource",
            "retrieved_at": meta.get("retrieved_at", ""),
            "processed_at": processed_at,
            "word_count": len(chunk_text.split()),
            "char_count": len(chunk_text),
        }

    total_words = len(text.split())
    if total_words <= SPLIT_THRESHOLD:
        return [_chunk_dict(text, 0)]

    # Split at paragraph boundaries
    paragraphs = [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]
    chunks = []
    current = []
    current_words = 0
    for para in paragraphs:
        pw = len(para.split())
        if current_words + pw > SPLIT_THRESHOLD and current:
            chunks.append("\n\n".join(current))
            current = [para]
            current_words = pw
        else:
            current.append(para)
            current_words += pw
    if current:
        chunks.append("\n\n".join(current))

    # Drop sub-threshold split pieces (e.g. nav fragments from div#mi fallback)
    valid = [ct for ct in chunks if len(ct.split()) >= MIN_WORDS]
    return [_chunk_dict(ct, i) for i, ct in enumerate(valid)]


def process_all():
    os.makedirs(CHUNKS_DIR, exist_ok=True)
    entries = load_manifest()
    manifest_meta = _load_manifest_meta()
    processed_at = _now_iso()

    pages_attempted = len(entries)
    pages_processed = 0
    pages_skipped = 0
    all_chunks = []
    warnings = []

    for entry in entries:
        page_id = entry["id"]
        print(f"  PROCESS {page_id} — {entry['topic']}")

        html, meta = _read_raw(page_id)
        if html is None:
            msg = f"{page_id}: raw HTML not found — skipped"
            warnings.append(msg)
            print(f"    WARNING: {msg}")
            pages_skipped += 1
            continue

        text, used_fallback = _extract_content_text(html)
        if used_fallback:
            msg = f"{page_id}: content comment not found; used div#mi fallback"
            warnings.append(msg)
            print(f"    WARNING: {msg}")

        word_count = len(text.split())
        if word_count < MIN_WORDS:
            msg = f"{page_id}: {word_count} words after stripping — skipped"
            warnings.append(msg)
            print(f"    WARNING: {msg}")
            pages_skipped += 1
            continue

        chunks = _build_chunks(text, page_id, entry, meta, manifest_meta, processed_at)

        out_path = os.path.join(CHUNKS_DIR, f"{page_id}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(chunks, f, indent=2, ensure_ascii=False)

        all_chunks.extend(chunks)
        pages_processed += 1
        print(f"    OK - {word_count} words -> {len(chunks)} chunk(s)")

    word_counts = [c["word_count"] for c in all_chunks]
    report = {
        "generated_at": processed_at,
        "pages_attempted": pages_attempted,
        "pages_processed": pages_processed,
        "pages_skipped": pages_skipped,
        "total_chunks": len(all_chunks),
        "warnings": warnings,
        "chunk_stats": {
            "min_words": min(word_counts) if word_counts else 0,
            "max_words": max(word_counts) if word_counts else 0,
            "avg_words": round(sum(word_counts) / len(word_counts)) if word_counts else 0,
        },
    }

    report_path = os.path.join(CHUNKS_DIR, "tex_processing_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\nSummary:")
    print(f"  pages_attempted : {report['pages_attempted']}")
    print(f"  pages_processed : {report['pages_processed']}")
    print(f"  pages_skipped   : {report['pages_skipped']}")
    print(f"  total_chunks    : {report['total_chunks']}")
    if word_counts:
        print(
            f"  word range      : {report['chunk_stats']['min_words']}-"
            f"{report['chunk_stats']['max_words']} "
            f"(avg {report['chunk_stats']['avg_words']})"
        )
    if warnings:
        print(f"  warnings ({len(warnings)}):")
        for w in warnings:
            print(f"    - {w}")
    print(f"\nReport: {report_path}")


if __name__ == "__main__":
    process_all()
