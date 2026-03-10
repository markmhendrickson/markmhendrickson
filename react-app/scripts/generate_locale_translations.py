#!/usr/bin/env python3
"""Generate/refresh post translations for all supported locales."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from deep_translator import GoogleTranslator


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
TRANSLATABLE_FIELDS = ("title", "excerpt", "summary", "body")


def _chunk_text(text: str, max_chars: int = 4200) -> list[str]:
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


def _translate_text(text: str, translator: GoogleTranslator, cache: dict[str, str]) -> str:
    source = (text or "").strip()
    if not source:
        return ""
    if source in cache:
        return cache[source]
    translated_parts: list[str] = []
    for chunk in _chunk_text(source):
        try:
            translated_parts.append(translator.translate(chunk) or chunk)
        except Exception:
            translated_parts.append(chunk)
    translated = "\n\n".join(translated_parts)
    cache[source] = translated
    return translated


def _norm_text(value: str) -> str:
    return " ".join(str(value or "").split()).strip().lower()


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate locale post translation overrides.")
    parser.parse_args()

    posts = json.loads(EN_CACHE_PATH.read_text(encoding="utf-8"))
    if not isinstance(posts, list):
        raise RuntimeError(f"Expected list in {EN_CACHE_PATH}")

    for locale, lang in LOCALE_TO_TRANSLATOR_LANG.items():
        out_path = TRANSLATIONS_DIR / f"translations.{locale}.json"
        existing: dict[str, dict] = {}
        if out_path.exists():
            loaded = json.loads(out_path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                existing = loaded

        translator = GoogleTranslator(source="en", target=lang)
        text_cache: dict[str, str] = {}
        output: dict[str, dict] = {}

        for post in posts:
            if not isinstance(post, dict):
                continue
            slug = post.get("canonicalSlug") or post.get("postId") or post.get("slug")
            if not slug:
                continue

            prior = existing.get(slug, {}) if isinstance(existing.get(slug), dict) else {}
            entry: dict[str, str] = {}
            for field in TRANSLATABLE_FIELDS:
                source_value = str(post.get(field) or "").strip()
                prior_value = str(prior.get(field) or "").strip()
                if prior_value and _norm_text(prior_value) != _norm_text(source_value):
                    entry[field] = prior_value
                    continue
                entry[field] = _translate_text(source_value, translator, text_cache)

            if prior.get("slug"):
                entry["slug"] = prior.get("slug")
            if isinstance(prior.get("alternativeSlugs"), list):
                entry["alternativeSlugs"] = prior.get("alternativeSlugs")

            output[slug] = entry

        out_path.write_text(
            json.dumps(output, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {out_path} ({len(output)} posts)")


if __name__ == "__main__":
    main()
