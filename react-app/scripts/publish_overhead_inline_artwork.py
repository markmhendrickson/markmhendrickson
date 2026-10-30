"""Keep published inline scenes small while retaining their reviewed source art.

The standalone public SVGs remain self-contained for Markdown readers. Inline
article SVGs refer to content-addressed, same-origin WebP materials instead of
embedding the same material dozens of times in prerendered HTML.
"""

import argparse
import base64
import hashlib
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/neotoma-paper/published"
MATERIALS = ROOT / "public/images/posts/neotoma-paper/materials"
SCENES = ("archive-hero-desktop", "archive-hero-mobile", "connected-records", "synthetic-sources", "current-record", "shared-instance", "competing-claims", "explanations-impact")
DATA_URL = re.compile(r'href="data:image/webp;base64,([A-Za-z0-9+/=]+)"')


def externalize(text: str, blobs: dict[str, bytes]) -> str:
    def replace(match: re.Match[str]) -> str:
        material = base64.b64decode(match.group(1), validate=True)
        digest = hashlib.sha256(material).hexdigest()
        blobs[digest] = material
        return f'href="/images/posts/neotoma-paper/materials/{digest}.webp"'

    return DATA_URL.sub(replace, text)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify committed inline scenes and material assets")
    args = parser.parse_args()
    blobs: dict[str, bytes] = {}
    scenes: dict[Path, str] = {}
    public = ROOT / "public/images/posts/neotoma-paper"
    for scene in SCENES:
        standalone = (public / f"{scene}.svg") if (public / f"{scene}.svg").exists() else None
        # The public names are the long-lived article URLs, separate from the
        # semantic names used by the imported inline scenes.
        public_name = {
            "archive-hero-desktop": "archive-hero-desktop", "archive-hero-mobile": "archive-hero-mobile",
            "connected-records": "hero", "synthetic-sources": "observation",
            "current-record": "invoice-example", "shared-instance": "vision-domain",
            "competing-claims": "vision-positions", "explanations-impact": "vision-explanation",
        }[scene]
        standalone = public / f"{public_name}.svg"
        source = standalone.read_text()
        if not DATA_URL.search(source):
            raise ValueError(f"Standalone artwork lost its embedded material: {standalone}")
        scenes[SOURCE / f"{scene}.svg"] = externalize(source, blobs)
    for target, content in scenes.items():
        if args.check:
            if target.read_text() != content:
                raise ValueError(f"Inline scene differs from standalone source: {target}")
        else:
            target.write_text(content)
    if not args.check:
        MATERIALS.mkdir(parents=True, exist_ok=True)
    for digest, material in blobs.items():
        target = MATERIALS / f"{digest}.webp"
        if args.check:
            if not target.exists() or target.read_bytes() != material:
                raise ValueError(f"Missing or changed trusted material: {target}")
        else:
            target.write_bytes(material)
    print(f"Verified {len(scenes)} scenes and {len(blobs)} unique materials" if args.check else f"Published {len(scenes)} scenes and {len(blobs)} unique materials")


if __name__ == "__main__":
    main()
