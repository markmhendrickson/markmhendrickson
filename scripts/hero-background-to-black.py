#!/usr/bin/env python3
"""Convert post hero image background to solid black. Preserves foreground.
   Light pixels (background) become black; darker pixels unchanged.
   Usage: python3 scripts/hero-background-to-black.py public/images/posts/<slug>-hero.png
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("pip install Pillow", file=sys.stderr)
    sys.exit(1)

# Pixels with R,G,B all >= this become black (background). 240 = light gray/white.
BACKGROUND_THRESHOLD = 240


def main():
    if len(sys.argv) < 2:
        print("Usage: hero-background-to-black.py <image path>", file=sys.stderr)
        sys.exit(1)
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}", file=sys.stderr)
        sys.exit(1)

    im = Image.open(path)
    if im.mode != "RGB":
        im = im.convert("RGB")

    w, h = im.size
    out = im.copy()
    pixels = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if r >= BACKGROUND_THRESHOLD and g >= BACKGROUND_THRESHOLD and b >= BACKGROUND_THRESHOLD:
                pixels[x, y] = (0, 0, 0)

    out.save(path, "PNG")
    print(f"Updated {path}")


if __name__ == "__main__":
    main()
