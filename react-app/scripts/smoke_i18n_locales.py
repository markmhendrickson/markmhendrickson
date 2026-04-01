#!/usr/bin/env python3
"""Basic smoke checks for multi-locale website artifacts."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "cache"
GLOSSARY_PATH = ROOT / "src" / "content" / "posts" / "translation_glossary.json"
SUPPORTED_LOCALES = (
    "en",
    "es",
    "ca",
    "zh",
    "hi",
    "ar",
    "fr",
    "pt",
    "ru",
    "bn",
    "ur",
    "id",
    "de",
)
STATIC_ROUTE_SUFFIXES = (
    "/",
    "/timeline",
    "/newsletter",
    "/newsletter/confirm",
    "/posts",
    "/links",
    "/songs",
    "/meet",
)


def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    failures: list[str] = []

    for locale in SUPPORTED_LOCALES:
        path = CACHE_DIR / f"posts.{locale}.json"
        if not path.exists():
            failures.append(f"Missing locale cache: {path}")
            continue
        data = _read_json(path)
        if not isinstance(data, list):
            failures.append(f"Invalid locale cache (expected list): {path}")
            continue
        published = [p for p in data if isinstance(p, dict) and p.get("published") is not False]
        if not published:
            failures.append(f"No published posts in locale cache: {path}")

    for locale in SUPPORTED_LOCALES:
        for suffix in STATIC_ROUTE_SUFFIXES:
            route = suffix if locale == "en" else (f"/{locale}" if suffix == "/" else f"/{locale}{suffix}")
            if not route.startswith("/"):
                failures.append(f"Invalid route format: {route}")

    # Glossary forbidden-sense check on locale caches
    glossary = {}
    if GLOSSARY_PATH.exists():
        try:
            glossary = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    forbidden = glossary.get("forbidden_senses", {})
    for locale in SUPPORTED_LOCALES:
        if locale == "en" or locale not in {
            loc for terms in forbidden.values() for loc in terms if loc != "_comment"
        }:
            continue
        path = CACHE_DIR / f"posts.{locale}.json"
        if not path.exists():
            continue
        try:
            posts = _read_json(path)
        except Exception:
            continue
        if not isinstance(posts, list):
            continue
        for post in posts:
            slug = post.get("canonicalSlug") or post.get("slug") or "?"
            for field in ("title", "body"):
                text = post.get(field) or ""
                if not text:
                    continue
                heading_lines = [
                    ln for ln in text.split("\n") if ln.lstrip().startswith("#")
                ]
                for hl in heading_lines:
                    for en_term, locale_map in forbidden.items():
                        if not isinstance(locale_map, dict) or locale not in locale_map:
                            continue
                        for bad in locale_map[locale]:
                            pattern = re.compile(
                                r"\b" + re.escape(bad) + r"\b", re.IGNORECASE
                            )
                            if pattern.search(hl):
                                failures.append(
                                    f"[{locale}] Forbidden sense '{bad}' for "
                                    f"'{en_term}' in {slug}/{field}: "
                                    f"{hl.strip()[:80]}"
                                )

    if failures:
        print("i18n smoke checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        "i18n smoke checks passed "
        f"(locales: {', '.join(SUPPORTED_LOCALES)}, static routes: {len(SUPPORTED_LOCALES) * len(STATIC_ROUTE_SUFFIXES)})."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

