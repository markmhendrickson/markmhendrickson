#!/usr/bin/env python3
"""Basic smoke checks for multi-locale website artifacts."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "cache"
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

