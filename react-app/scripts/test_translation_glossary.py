#!/usr/bin/env python3
"""Regression tests for context-aware translation glossary and disambiguation.

Validates that:
1. The glossary file loads and has the expected structure.
2. Heading overrides replace ambiguous terms correctly before MT.
3. Forbidden-sense validation catches known mistranslations.
4. Locale cache files (when present) don't contain forbidden-sense headings.

Self-contained: does not import generate_locale_translations (avoids deep_translator dependency).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "cache"
GLOSSARY_PATH = ROOT / "src" / "content" / "posts" / "translation_glossary.json"


def _load_glossary() -> dict:
    if not GLOSSARY_PATH.exists():
        return {}
    return json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))


def _apply_heading_overrides(text: str, locale: str) -> str:
    """Mirror of the function in generate_locale_translations.py."""
    glossary = _load_glossary()
    overrides = glossary.get("heading_overrides", {})
    if not overrides:
        return text
    lines = text.split("\n")
    result: list[str] = []
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith("#"):
            heading_text = stripped.lstrip("#").strip()
            heading_lower = heading_text.lower()
            for en_phrase, locale_map in overrides.items():
                if en_phrase.lower() in heading_lower and locale in locale_map:
                    pattern = re.compile(re.escape(en_phrase), re.IGNORECASE)
                    line = pattern.sub(locale_map[locale], line)
        result.append(line)
    return "\n".join(result)


def _validate_forbidden_senses(translated: str, locale: str, context: str = "") -> list[str]:
    """Mirror of the function in generate_locale_translations.py."""
    glossary = _load_glossary()
    forbidden = glossary.get("forbidden_senses", {})
    warnings: list[str] = []
    for en_term, locale_map in forbidden.items():
        if not isinstance(locale_map, dict) or locale not in locale_map:
            continue
        for bad_translation in locale_map[locale]:
            pattern = re.compile(r"\b" + re.escape(bad_translation) + r"\b", re.IGNORECASE)
            if pattern.search(translated):
                ctx = f" (in: {context})" if context else ""
                warnings.append(
                    f"[{locale}] Possible wrong-sense translation for '{en_term}': "
                    f"found '{bad_translation}' in heading{ctx}"
                )
    return warnings


def test_glossary_loads() -> list[str]:
    failures: list[str] = []
    if not GLOSSARY_PATH.exists():
        failures.append(f"Glossary file missing: {GLOSSARY_PATH}")
        return failures
    try:
        data = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        failures.append(f"Glossary JSON parse error: {exc}")
        return failures
    if "heading_overrides" not in data:
        failures.append("Glossary missing 'heading_overrides' key")
    if "forbidden_senses" not in data:
        failures.append("Glossary missing 'forbidden_senses' key")
    overrides = data.get("heading_overrides", {})
    if "the fall" not in overrides:
        failures.append("Glossary heading_overrides missing 'the fall' entry")
    else:
        fall = overrides["the fall"]
        if "ca" not in fall:
            failures.append("'the fall' override missing Catalan ('ca') translation")
        if "es" not in fall:
            failures.append("'the fall' override missing Spanish ('es') translation")
    return failures


def test_heading_override_rousseau() -> list[str]:
    """The canonical regression case: 'Rousseau: the fall' must not become 'Rousseau: la tardor'."""
    failures: list[str] = []
    test_cases = [
        ("## Rousseau: the fall", "ca", "caiguda", "tardor"),
        ("## Rousseau: the fall", "es", "caída", "otoño"),
        ("### The Fall of Civilization", "ca", "caiguda", "tardor"),
        ("## The Fall", "fr", "chute", "automne"),
    ]
    for source, locale, expected_fragment, forbidden_fragment in test_cases:
        result = _apply_heading_overrides(source, locale)
        if expected_fragment.lower() not in result.lower():
            failures.append(
                f"Heading override failed for [{locale}] '{source}': "
                f"expected '{expected_fragment}' in result, got '{result}'"
            )
        if forbidden_fragment.lower() in result.lower():
            failures.append(
                f"Heading override left forbidden sense for [{locale}] '{source}': "
                f"found '{forbidden_fragment}' in result '{result}'"
            )
    return failures


def test_heading_override_preserves_non_glossary() -> list[str]:
    """Lines that don't match glossary terms should pass through unchanged."""
    failures: list[str] = []
    unchanged_cases = [
        "## Introduction",
        "### A Brief History",
        "Some regular paragraph text with the fall mentioned.",
        "## The Rise of Technology",
    ]
    for source in unchanged_cases:
        result = _apply_heading_overrides(source, "ca")
        if result != source:
            failures.append(
                f"Non-glossary text was modified: '{source}' -> '{result}'"
            )
    return failures


def test_forbidden_sense_detection() -> list[str]:
    failures: list[str] = []
    should_warn = [
        ("## Rousseau: la tardor", "ca", "the fall"),
        ("## La Tardor de la civilització", "ca", "the fall"),
        ("## El otoño de la humanidad", "es", "the fall"),
    ]
    for text, locale, en_term in should_warn:
        warnings = _validate_forbidden_senses(text, locale)
        if not warnings:
            failures.append(
                f"Expected forbidden-sense warning for [{locale}] '{text}' "
                f"(term: '{en_term}'), got none"
            )

    should_not_warn = [
        ("## Rousseau: la caiguda", "ca"),
        ("## La caída de la civilización", "es"),
        ("## Regular heading without issues", "ca"),
    ]
    for text, locale in should_not_warn:
        warnings = _validate_forbidden_senses(text, locale)
        if warnings:
            failures.append(
                f"Unexpected forbidden-sense warning for [{locale}] '{text}': "
                f"{warnings}"
            )
    return failures


def test_locale_caches_no_forbidden_headings() -> list[str]:
    """If locale cache files exist, scan headings for forbidden-sense translations."""
    failures: list[str] = []
    glossary = _load_glossary()
    forbidden = glossary.get("forbidden_senses", {})
    if not forbidden:
        return failures

    for locale_file in sorted(CACHE_DIR.glob("posts.*.json")):
        locale = locale_file.stem.split(".")[-1]
        if locale == "en" or locale == "json":
            continue
        try:
            posts = json.loads(locale_file.read_text(encoding="utf-8"))
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
                                    f"[{locale}] Cache {locale_file.name}: "
                                    f"'{en_term}' wrong-sense '{bad}' in "
                                    f"{slug}/{field}: {hl.strip()[:80]}"
                                )
    return failures


def main() -> int:
    all_failures: list[str] = []

    tests = [
        ("glossary_loads", test_glossary_loads),
        ("heading_override_rousseau", test_heading_override_rousseau),
        ("heading_override_preserves_non_glossary", test_heading_override_preserves_non_glossary),
        ("forbidden_sense_detection", test_forbidden_sense_detection),
        ("locale_caches_no_forbidden_headings", test_locale_caches_no_forbidden_headings),
    ]

    for name, test_fn in tests:
        failures = test_fn()
        if failures:
            print(f"FAIL: {name}")
            for f in failures:
                print(f"  - {f}")
            all_failures.extend(failures)
        else:
            print(f"PASS: {name}")

    if all_failures:
        print(f"\n{len(all_failures)} failure(s) total.")
        return 1

    print(f"\nAll {len(tests)} tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
