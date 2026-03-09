#!/usr/bin/env python3
"""Normalize markdown link syntax in post translation JSON files.

Fixes common issues from machine translation:
- ] ( -> ](  (space between bracket and paren breaks link)
- ] text (url) -> text](url)  (translated text inserted between ] and ()
- Known mangled URLs (e.g. merged Asana/HomeKit, Google Calendar typo)

Run after regenerating or bulk-updating translations.es.json / translations.ca.json.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSLATIONS = (
    ROOT / "src" / "content" / "posts" / "translations.es.json",
    ROOT / "src" / "content" / "posts" / "translations.ca.json",
)

# Space between ] and ( breaks markdown link
LINK_SPACE_FIX = re.compile(r"\]\s+\(")

# Text between ] and (url) — move that text inside the link
LINK_TEXT_BEFORE_URL = re.compile(r"\]\s+([^(\[]+?)\s+\((https?://[^)]+)\)")

# Known mangled strings from translation (old_string, new_string)
REPLACEMENTS = [
    (
        "[Google Calendar](https://github.com/markm-calepndar-server),/ ",
        "[Google Calendar](https://github.com/markmhendrickson/mcp-server-google-calendar), ",
    ),
    (
        "[Asana](https://github.com-markmhendrickson/markmhendrickson/mcp-server/markmhendrickson/ [HomeKit](https://www.apple.com/home-app-accessories/)",
        "[Asana](https://github.com/markmhendrickson/mcp-server-asana), [HomeKit](https://www.apple.com/home-app-accessories/)",
    ),
]


def fix_text(s: str) -> str:
    if not isinstance(s, str):
        return s
    for old, new in REPLACEMENTS:
        s = s.replace(old, new)
    s = LINK_SPACE_FIX.sub("](", s)
    s = LINK_TEXT_BEFORE_URL.sub(r" \1](\2)", s)
    return s


def main() -> int:
    for path in TRANSLATIONS:
        if not path.exists():
            print(f"Skip (missing): {path}", file=sys.stderr)
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for slug, entry in (data or {}).items():
            if not isinstance(entry, dict):
                continue
            for key in ("body", "summary"):
                if key in entry and isinstance(entry[key], str):
                    entry[key] = fix_text(entry[key])
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Fixed {path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
