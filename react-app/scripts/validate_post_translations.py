#!/usr/bin/env python3
"""Fail deploy if published posts are missing required locale translations."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CACHE_POSTS = ROOT / "cache" / "posts.json"
TRANSLATIONS = {
    "es": ROOT / "src" / "content" / "posts" / "translations.es.json",
    "ca": ROOT / "src" / "content" / "posts" / "translations.ca.json",
}
# Require full-body localization so non-English locales never fall back to English post content.
REQUIRED_FIELDS = ("title", "excerpt", "summary", "body")


def _read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise RuntimeError(f"Failed to parse JSON at {path}: {exc}") from exc


def main() -> int:
    posts = _read_json(CACHE_POSTS)
    if not isinstance(posts, list):
        raise RuntimeError(f"Expected list in {CACHE_POSTS}")

    published_slugs = sorted(
        {
            p.get("slug")
            for p in posts
            if isinstance(p, dict) and p.get("published") and p.get("slug")
        }
    )

    failures: list[str] = []
    for locale, path in TRANSLATIONS.items():
        data = _read_json(path)
        if not isinstance(data, dict):
            failures.append(f"{locale}: expected object in {path}")
            continue

        missing_entries: list[str] = []
        missing_fields: list[str] = []
        for slug in published_slugs:
            entry = data.get(slug)
            if not isinstance(entry, dict):
                missing_entries.append(slug)
                continue
            missing = [f for f in REQUIRED_FIELDS if not str(entry.get(f, "")).strip()]
            if missing:
                missing_fields.append(f"{slug} (missing: {', '.join(missing)})")

        if missing_entries:
            failures.append(
                f"{locale}: missing entries for {len(missing_entries)} published post(s): "
                + ", ".join(missing_entries[:20])
                + (" ..." if len(missing_entries) > 20 else "")
            )
        if missing_fields:
            failures.append(
                f"{locale}: missing required fields on {len(missing_fields)} post(s): "
                + ", ".join(missing_fields[:20])
                + (" ..." if len(missing_fields) > 20 else "")
            )

    if failures:
        print("Translation validation failed:")
        for line in failures:
            print(f"- {line}")
        return 1

    print(
        "Translation validation passed for published posts "
        f"({len(published_slugs)} slugs, locales: {', '.join(TRANSLATIONS.keys())})."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
