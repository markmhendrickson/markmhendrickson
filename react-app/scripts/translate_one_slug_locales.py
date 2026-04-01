#!/usr/bin/env python3
"""Translate a single post slug into selected locales; merge into translations.<locale>.json."""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator, MyMemoryTranslator

ROOT = Path(__file__).resolve().parents[1]
EN_CACHE_PATH = ROOT / "cache" / "posts.en.json"
TRANSLATIONS_DIR = ROOT / "src" / "content" / "posts"

LOCALE_TO_TRANSLATOR_LANG = {
    "es": "es",
    "ca": "ca",
    "zh": "zh-CN",
    "hi": "hi",
    "ar": "ar",
    "fr": "fr",
    "pt": "pt",
    "ru": "ru",
    "bn": "bn",
    "ur": "ur",
    "id": "id",
    "de": "de",
}
LOCALE_TO_MYMEMORY_LANG = {
    "es": "es-ES",
    "ca": "ca-ES",
    "zh": "zh-CN",
    "hi": "hi-IN",
    "ar": "ar-SA",
    "fr": "fr-FR",
    "pt": "pt-PT",
    "ru": "ru-RU",
    "bn": "bn-IN",
    "ur": "ur-PK",
    "id": "id-ID",
    "de": "de-DE",
}
FIELDS = ("title", "excerpt", "summary", "body", "postscript")


def fix_links(text: str) -> str:
    if not text:
        return text
    return re.sub(r"]\s+\(", "](", text)


def chunk_text(text: str, max_chars: int = 4200) -> list[str]:
    if len(text) <= max_chars:
        return [text]
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for paragraph in text.split("\n\n"):
        extra = len(paragraph) + (2 if current else 0)
        if current and current_len + extra > max_chars:
            chunks.append("\n\n".join(current))
            current = [paragraph]
            current_len = len(paragraph)
        else:
            current.append(paragraph)
            current_len += extra
    if current:
        chunks.append("\n\n".join(current))
    return chunks


def norm(value: str) -> str:
    return " ".join(str(value or "").split()).strip().lower()


def translate_text(
    text: str, translators: list, cache: dict[str, str], delay_s: float
) -> str:
    source = (text or "").strip()
    if not source:
        return ""
    if source in cache:
        return cache[source]
    translated_parts: list[str] = []
    for chunk in chunk_text(source):
        translated_chunk = chunk
        for translator in translators:
            if delay_s > 0:
                time.sleep(delay_s)
            try:
                candidate = (translator.translate(chunk) or "").strip()
            except Exception as exc:
                print(f"  chunk translate err: {exc}", file=sys.stderr)
                continue
            if candidate and norm(candidate) != norm(chunk):
                translated_chunk = candidate
                break
        translated_parts.append(translated_chunk)
    translated = "\n\n".join(translated_parts)
    cache[source] = translated
    return translated


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("slug", help="Post slug")
    parser.add_argument(
        "--locales",
        default="",
        help="Comma-separated locales (default: all supported)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.15,
        help="Sleep between API calls (seconds)",
    )
    args = parser.parse_args()
    slug = args.slug
    if args.locales.strip():
        locales = [x.strip() for x in args.locales.split(",") if x.strip()]
    else:
        locales = list(LOCALE_TO_TRANSLATOR_LANG.keys())

    posts = json.loads(EN_CACHE_PATH.read_text(encoding="utf-8"))
    post = next((p for p in posts if p.get("slug") == slug), None)
    if not post:
        raise SystemExit(f"Slug not found in EN cache: {slug}")

    for locale in locales:
        lang = LOCALE_TO_TRANSLATOR_LANG.get(locale)
        if not lang:
            print(f"Skip unknown locale: {locale}", file=sys.stderr)
            continue
        out_path = TRANSLATIONS_DIR / f"translations.{locale}.json"
        existing: dict[str, dict] = {}
        if out_path.exists():
            loaded = json.loads(out_path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                existing = loaded

        translators = [GoogleTranslator(source="en", target=lang)]
        mymemory_target = LOCALE_TO_MYMEMORY_LANG.get(locale)
        if mymemory_target:
            translators.append(
                MyMemoryTranslator(source="en-GB", target=mymemory_target)
            )
        text_cache: dict[str, str] = {}
        prior = existing.get(slug, {}) if isinstance(existing.get(slug), dict) else {}
        entry: dict[str, str] = {}
        for field in FIELDS:
            if field == "postscript":
                source_value = ""
            else:
                source_value = str(post.get(field) or "").strip()
            prior_value = str(prior.get(field) or "").strip()
            if prior_value and norm(prior_value) != norm(source_value):
                entry[field] = fix_links(prior_value)
                continue
            print(f"{locale} {field} …", flush=True)
            entry[field] = fix_links(
                translate_text(source_value, translators, text_cache, args.delay)
            )
        if prior.get("slug"):
            entry["slug"] = prior.get("slug")
        if isinstance(prior.get("alternativeSlugs"), list):
            entry["alternativeSlugs"] = prior["alternativeSlugs"]
        existing[slug] = entry
        out_path.write_text(
            json.dumps(existing, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {out_path}", flush=True)


if __name__ == "__main__":
    main()
