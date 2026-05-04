#!/usr/bin/env python3
"""Rebuild cache/posts.<locale>.json from posts.en.json + translations.<locale>.json.

Used in CI when Neotoma cache regen is skipped: auto-translate updates
src/content/posts/translations.*.json; this script materializes them into
cache files so validate_post_translations.py passes.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "cache"
CACHE_API_DIR = CACHE_DIR / "api"
WEBSITE_POSTS_DIR = ROOT / "src" / "content" / "posts"
EN_CACHE = CACHE_DIR / "posts.en.json"
SITE_BASE = "https://markmhendrickson.com"

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

GLOSSARY_PATH = WEBSITE_POSTS_DIR / "translation_glossary.json"


def write_json(path: Path, payload: list | dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _load_glossary() -> dict:
    if not GLOSSARY_PATH.exists():
        return {}
    try:
        return json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"WARNING: Failed to load glossary {GLOSSARY_PATH}: {exc}")
        return {}


def fix_translation_markdown(text: str) -> str:
    if not text or not isinstance(text, str):
        return text
    return re.sub(r"]\s+\(", "](", text)


def apply_glossary_heading_corrections(text: str, locale: str) -> str:
    if locale == "en" or not text or not isinstance(text, str):
        return text
    glossary = _load_glossary()
    forbidden = glossary.get("forbidden_senses", {})
    overrides = glossary.get("heading_overrides", {})
    if not forbidden or not overrides:
        return text

    lines = text.split("\n")
    out: list[str] = []
    for line in lines:
        stripped = line.lstrip()
        if not stripped.startswith("#"):
            out.append(line)
            continue
        fixed = line
        for en_term, locale_map in forbidden.items():
            if not isinstance(locale_map, dict) or locale not in locale_map:
                continue
            repl_map = overrides.get(en_term)
            if not isinstance(repl_map, dict) or locale not in repl_map:
                continue
            replacement = repl_map[locale]
            for bad in sorted(locale_map[locale], key=len, reverse=True):
                pattern = re.compile(r"\b" + re.escape(bad) + r"\b", re.IGNORECASE)
                fixed = pattern.sub(replacement, fixed)
        out.append(fixed)
    return "\n".join(out)


def load_locale_overrides(locale: str) -> dict[str, dict]:
    path = WEBSITE_POSTS_DIR / f"translations.{locale}.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception as e:
        print(f"WARNING: Failed to parse {path}: {e}")
        return {}


def build_locale_posts(base_posts: list[dict], locale: str) -> list[dict]:
    overrides = load_locale_overrides(locale)
    localized: list[dict] = []
    for post in base_posts:
        slug = post.get("slug", "")
        override = overrides.get(slug, {})
        entry = dict(post)
        entry["postId"] = slug
        entry["locale"] = locale
        entry["canonicalSlug"] = slug
        if isinstance(override, dict):
            if override.get("slug"):
                entry["slug"] = override.get("slug")
            if isinstance(override.get("alternativeSlugs"), list):
                entry["alternativeSlugs"] = override.get("alternativeSlugs")
            for field in (
                "title",
                "excerpt",
                "summary",
                "body",
                "postscript",
                "shareDescription",
                # Must match generate_posts_cache.build_locale_posts so CI deploys
                # do not strip localized series chrome (series index H1, breadcrumbs).
                "series",
                "seriesDescription",
            ):
                if override.get(field):
                    entry[field] = fix_translation_markdown(str(override.get(field)))
        if not (entry.get("title") or "").strip():
            entry["title"] = slug.replace("-", " ").title()
        if not (entry.get("excerpt") or "").strip():
            entry["excerpt"] = str(entry.get("summary") or "").strip()
        if not (entry.get("summary") or "").strip():
            fallback_summary = str(entry.get("excerpt") or "").strip()
            if not fallback_summary:
                fallback_summary = str(entry.get("body") or "").strip()[:280]
            entry["summary"] = fallback_summary
        if not (entry.get("body") or "").strip():
            entry["body"] = str(entry.get("summary") or "").strip()
        if locale != "en":
            for field in ("title", "body"):
                raw = entry.get(field)
                if isinstance(raw, str) and raw.strip():
                    entry[field] = fix_translation_markdown(
                        apply_glossary_heading_corrections(raw, locale)
                    )
        localized.append(entry)
    return localized


def main() -> None:
    if not EN_CACHE.exists():
        raise SystemExit(f"Missing {EN_CACHE}; cannot rebuild locale caches.")
    en_posts = json.loads(EN_CACHE.read_text(encoding="utf-8"))
    if not isinstance(en_posts, list):
        raise SystemExit(f"Expected list in {EN_CACHE}")

    for locale in SUPPORTED_LOCALES:
        out_path = CACHE_DIR / f"posts.{locale}.json"
        api_path = CACHE_API_DIR / f"posts.{locale}.json"
        localized = build_locale_posts(en_posts, locale)
        write_json(out_path, localized)
        write_json(
            api_path,
            {"url": f"{SITE_BASE}/api/posts.{locale}.json", "posts": localized},
        )
        print(f"Wrote {out_path.name} and api/{out_path.name} ({len(localized)} posts)")


if __name__ == "__main__":
    main()
