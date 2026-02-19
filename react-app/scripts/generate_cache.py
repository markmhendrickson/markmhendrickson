#!/usr/bin/env python3
"""
Generate react-app/cache/*.json from a Neotoma website export JSON.

This script is intentionally self-contained (stdlib-only) so it can run in CI
inside the website repo without depending on the parent ateles repo.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


SCRIPT_DIR = Path(__file__).resolve().parent
REACT_APP_ROOT = SCRIPT_DIR.parent

DEFAULT_NEOTOMA_EXPORT = REACT_APP_ROOT / "data" / "tmp" / "neotoma_website_export.json"

CACHE_DIR = REACT_APP_ROOT / "cache"
CACHE_API_DIR = CACHE_DIR / "api"

WEBSITE_POSTS_DIR = REACT_APP_ROOT / "src" / "content" / "posts"
PUBLIC_POSTS_IMAGES = REACT_APP_ROOT / "public" / "images" / "posts"
PUBLIC_OG_IMAGES_DIR = REACT_APP_ROOT / "public" / "images" / "og"

POSTS_JSON = CACHE_DIR / "posts.json"
POSTS_PRIVATE_JSON = CACHE_DIR / "posts.private.json"
LINKS_JSON = CACHE_DIR / "links.json"
TIMELINE_JSON = CACHE_DIR / "timeline.json"
API_POSTS_JSON = CACHE_API_DIR / "posts.json"
API_LINKS_JSON = CACHE_API_DIR / "links.json"
API_TIMELINE_JSON = CACHE_API_DIR / "timeline.json"

SITE_BASE = "https://markmhendrickson.com"

LISTING_OVERRIDES_JSON = WEBSITE_POSTS_DIR / "listing_overrides.json"
ALTERNATIVE_SLUGS_JSON = WEBSITE_POSTS_DIR / "alternative_slugs.json"


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _parse_frontmatter(content: str) -> Tuple[Dict[str, str], str]:
    if not content.startswith("---\n"):
        return {}, content
    idx = content.find("\n---\n", 4)
    if idx == -1:
        return {}, content
    parsed: Dict[str, str] = {}
    for line in content[4:idx].splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        v = v.strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        parsed[k.strip().lower()] = v
    return parsed, content[idx + 5 :].lstrip("\n")


def _safe_read(path: Path) -> Optional[str]:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return None


def load_from_neotoma_json(path: Path) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    posts = data.get("posts") or []
    links = data.get("links") or []
    timeline = data.get("timeline") or []
    return posts, links, timeline


def load_listing_overrides() -> List[str]:
    if not LISTING_OVERRIDES_JSON.exists():
        return []
    try:
        data = json.loads(LISTING_OVERRIDES_JSON.read_text(encoding="utf-8"))
        return list(data.get("exclude_from_listing") or [])
    except Exception:
        return []


def overlay_listing_excludes(metadata_list: List[Dict[str, Any]]) -> None:
    exclude_slugs = set(load_listing_overrides())
    if not exclude_slugs:
        return
    for meta in metadata_list:
        if meta.get("slug") in exclude_slugs:
            meta["excludeFromListing"] = True


def load_alternative_slugs() -> Dict[str, List[str]]:
    if not ALTERNATIVE_SLUGS_JSON.exists():
        return {}
    try:
        data = json.loads(ALTERNATIVE_SLUGS_JSON.read_text(encoding="utf-8"))
        out: Dict[str, List[str]] = {}
        for k, v in (data or {}).items():
            out[k] = list(v) if isinstance(v, list) else []
        return out
    except Exception:
        return {}


def overlay_alternative_slugs(metadata_list: List[Dict[str, Any]]) -> None:
    overrides = load_alternative_slugs()
    if not overrides:
        return
    for meta in metadata_list:
        slug = meta.get("slug")
        if not slug or slug not in overrides:
            continue
        existing = list(meta.get("alternativeSlugs") or [])
        meta["alternativeSlugs"] = existing + [a for a in overrides[slug] if a not in existing]


def summary_md_path(slug: str, published: bool) -> Path:
    if published:
        return WEBSITE_POSTS_DIR / f"{slug}.summary.md"
    return WEBSITE_POSTS_DIR / "drafts" / f"{slug}.summary.md"


def body_md_path(slug: str, published: bool) -> Path:
    if published:
        return WEBSITE_POSTS_DIR / f"{slug}.md"
    return WEBSITE_POSTS_DIR / "drafts" / f"{slug}.md"


def overlay_summaries_from_markdown(metadata_list: List[Dict[str, Any]]) -> None:
    for meta in metadata_list:
        slug = meta.get("slug")
        if not slug:
            continue
        published = bool(meta.get("published", False))
        path = summary_md_path(slug, published)
        if not path.exists() and published:
            path = summary_md_path(slug, False)
        if not path.exists():
            continue
        raw = _safe_read(path)
        if raw is None:
            continue
        meta["summary"] = raw.strip()


def overlay_body_from_markdown(metadata_list: List[Dict[str, Any]]) -> None:
    for meta in metadata_list:
        slug = meta.get("slug")
        if not slug:
            continue
        published = bool(meta.get("published", True))
        path = body_md_path(slug, published)
        if not path.exists() and published:
            path = body_md_path(slug, False)
        if not path.exists():
            continue
        raw = _safe_read(path)
        if raw is None:
            continue
        frontmatter, body = _parse_frontmatter(raw)
        meta["body"] = body
        if frontmatter.get("title"):
            meta["title"] = frontmatter["title"].strip()
        if frontmatter.get("excerpt"):
            meta["excerpt"] = frontmatter["excerpt"].strip()


def draft_slugs_from_markdown() -> List[Path]:
    drafts_dir = WEBSITE_POSTS_DIR / "drafts"
    if not drafts_dir.exists():
        return []
    out: List[Path] = []
    for p in drafts_dir.glob("*.md"):
        if p.name.endswith(".summary.md") or p.name.endswith(".tweet.md") or p.name.endswith(".postscript.md"):
            continue
        out.append(p)
    return out


def metadata_for_draft_only_slugs(export_slugs: set) -> List[Dict[str, Any]]:
    drafts_paths = draft_slugs_from_markdown()
    draft_slugs = sorted({p.stem for p in drafts_paths} - set(export_slugs))
    if not draft_slugs:
        return []

    out: List[Dict[str, Any]] = []
    drafts_dir = WEBSITE_POSTS_DIR / "drafts"
    for slug in draft_slugs:
        body_path = drafts_dir / f"{slug}.md"
        raw = _safe_read(body_path)
        if raw is None:
            continue
        frontmatter, body = _parse_frontmatter(raw)
        title = (frontmatter.get("title") or "").strip()
        excerpt = (frontmatter.get("excerpt") or "").strip()
        if not title:
            for line in body.splitlines():
                s = line.strip()
                if not s:
                    continue
                if s.startswith("## "):
                    title = s[3:].strip()
                else:
                    title = s[:80] if len(s) > 80 else s
                break
        if not title:
            title = slug.replace("-", " ").title()

        summary_raw = _safe_read(drafts_dir / f"{slug}.summary.md")
        tweet_raw = _safe_read(drafts_dir / f"{slug}.tweet.md")

        try:
            mtime = body_path.stat().st_mtime
            updated = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")
        except Exception:
            updated = ""

        pub = frontmatter.get("published")
        published = str(pub).lower() in ("true", "1", "yes") if pub is not None else False
        pub_date = (frontmatter.get("published_date") or frontmatter.get("publisheddate") or "").strip()

        meta: Dict[str, Any] = {
            "slug": slug,
            "title": title,
            "excerpt": excerpt,
            "body": body,
            "published": published,
            "publishedDate": pub_date or None,
            "category": "essay",
            "readTime": None,
            "tags": [],
            "createdDate": updated or None,
            "updatedDate": updated or None,
            "summary": (summary_raw or "").strip(),
            "shareTweet": (tweet_raw or "").strip(),
        }

        hero_path = PUBLIC_POSTS_IMAGES / f"{slug}-hero.png"
        if hero_path.exists():
            meta["heroImage"] = f"{slug}-hero.png"
            style_raw = _safe_read(PUBLIC_POSTS_IMAGES / f"{slug}-hero-style.txt")
            meta["heroImageStyle"] = (style_raw or "").strip() or "keep-proportions"
            square_path = PUBLIC_POSTS_IMAGES / f"{slug}-hero-square.png"
            if square_path.exists():
                meta["heroImageSquare"] = f"{slug}-hero-square.png"

        out.append(meta)
    return out


def convert_post_to_metadata(post: Dict[str, Any], include_body: bool, include_share_tweet: bool) -> Dict[str, Any]:
    tags: List[Any] = []
    raw_tags = post.get("tags")
    if raw_tags:
        try:
            tags = json.loads(raw_tags) if isinstance(raw_tags, str) else (raw_tags if isinstance(raw_tags, list) else [])
        except Exception:
            tags = []

    is_tweet = (post.get("category") or "").lower() == "tweet"
    metadata: Dict[str, Any] = {
        "slug": post.get("slug") or "",
        "title": post.get("title") or "",
        "excerpt": post.get("excerpt") or "",
        "published": False if is_tweet else bool(post.get("published", False)),
        "publishedDate": (post.get("published_date") if not is_tweet else None),
        "category": post.get("category") or "",
        "readTime": post.get("read_time"),
        "tags": tags,
    }

    if include_body and post.get("body"):
        metadata["body"] = post["body"]

    if post.get("hero_image"):
        metadata["heroImage"] = post.get("hero_image")
    if post.get("hero_image_style"):
        metadata["heroImageStyle"] = post.get("hero_image_style")
    if post.get("hero_image_square"):
        metadata["heroImageSquare"] = post.get("hero_image_square")
    elif post.get("hero_image"):
        h = str(post.get("hero_image"))
        base, ext = h.rsplit(".", 1) if "." in h else (h, "")
        square_name = f"{base}-square.{ext}" if ext else f"{base}-square"
        if (PUBLIC_POSTS_IMAGES / square_name).exists():
            metadata["heroImageSquare"] = square_name

    if post.get("exclude_from_listing"):
        metadata["excludeFromListing"] = post.get("exclude_from_listing")
    if "show_metadata" in post:
        metadata["showMetadata"] = post.get("show_metadata")
    if post.get("created_date"):
        metadata["createdDate"] = post.get("created_date")
    if post.get("updated_date"):
        metadata["updatedDate"] = post.get("updated_date")
    if post.get("summary"):
        metadata["summary"] = post.get("summary")
    if include_share_tweet and post.get("share_tweet"):
        metadata["shareTweet"] = post.get("share_tweet")

    if post.get("og_image"):
        metadata["ogImage"] = post.get("og_image")
    else:
        slug = post.get("slug")
        if slug and (PUBLIC_OG_IMAGES_DIR / f"{slug}-1200x630.jpg").exists():
            metadata["ogImage"] = f"og/{slug}-1200x630.jpg"

    if post.get("linked_tweet_url"):
        metadata["linkedTweetUrl"] = post.get("linked_tweet_url")
    if post.get("x_timeline_url"):
        metadata["xTimelineUrl"] = post.get("x_timeline_url")

    raw_alt = post.get("alternative_slugs")
    alt: List[str] = []
    if isinstance(raw_alt, list):
        alt = raw_alt
    elif isinstance(raw_alt, str) and raw_alt.strip():
        try:
            parsed = json.loads(raw_alt)
            alt = parsed if isinstance(parsed, list) else []
        except Exception:
            alt = []
    if alt:
        metadata["alternativeSlugs"] = alt

    return metadata


def generate_posts_cache(posts: List[Dict[str, Any]]) -> None:
    if not posts:
        export_slugs: set = set()
        draft_only_metadata = metadata_for_draft_only_slugs(export_slugs)

        published_metadata = [m for m in draft_only_metadata if m.get("published")]
        published_metadata.sort(key=lambda m: (m.get("slug") or ""))
        published_metadata.sort(key=lambda m: (m.get("publishedDate") or "0000-01-01"), reverse=True)
        overlay_summaries_from_markdown(published_metadata)
        overlay_body_from_markdown(published_metadata)
        overlay_listing_excludes(published_metadata)
        overlay_alternative_slugs(published_metadata)
        write_json(POSTS_JSON, published_metadata)
        write_json(API_POSTS_JSON, {"url": f"{SITE_BASE}/api/posts.json", "posts": published_metadata})

        all_metadata = list(draft_only_metadata)
        all_metadata.sort(
            key=lambda m: (
                0 if m.get("published") else 1,
                m.get("publishedDate") or m.get("updatedDate") or m.get("createdDate") or "0000-01-01",
                m.get("title", ""),
            ),
            reverse=True,
        )
        overlay_summaries_from_markdown(all_metadata)
        overlay_body_from_markdown(all_metadata)
        overlay_listing_excludes(all_metadata)
        overlay_alternative_slugs(all_metadata)
        write_json(POSTS_PRIVATE_JSON, all_metadata)
        return

    seen: Dict[str, Dict[str, Any]] = {}
    for post in posts:
        slug = post.get("slug")
        if not slug:
            continue
        existing = seen.get(slug)
        this_date = post.get("updated_date") or post.get("published_date") or ""
        existing_date = (existing.get("updated_date") or existing.get("published_date") or "") if existing else ""
        if existing is None or this_date >= existing_date:
            seen[slug] = post
    posts = list(seen.values())

    def should_include_in_listing(p: Dict[str, Any]) -> bool:
        if not p.get("published"):
            return False
        if (p.get("category") or "").lower() == "tweet":
            return False
        return True

    published_metadata = [
        convert_post_to_metadata(post, include_body=True, include_share_tweet=False)
        for post in posts
        if should_include_in_listing(post)
    ]

    export_slugs = {p.get("slug") for p in posts if p.get("slug")}
    draft_only_metadata = metadata_for_draft_only_slugs(export_slugs)
    published_metadata.extend(m for m in draft_only_metadata if m.get("published"))

    published_metadata.sort(key=lambda m: (m.get("slug") or ""))
    published_metadata.sort(key=lambda m: (m.get("publishedDate") or "0000-01-01"), reverse=True)
    overlay_summaries_from_markdown(published_metadata)
    overlay_body_from_markdown(published_metadata)
    overlay_listing_excludes(published_metadata)
    overlay_alternative_slugs(published_metadata)

    write_json(POSTS_JSON, published_metadata)
    write_json(API_POSTS_JSON, {"url": f"{SITE_BASE}/api/posts.json", "posts": published_metadata})

    all_metadata = [convert_post_to_metadata(post, include_body=True, include_share_tweet=True) for post in posts]
    if draft_only_metadata:
        all_metadata.extend(draft_only_metadata)

    def private_sort_key(meta: Dict[str, Any]) -> Tuple[Any, Any, Any]:
        if meta.get("published"):
            return (0, meta.get("publishedDate") or "0000-01-01", meta.get("title", ""))
        return (1, meta.get("updatedDate") or meta.get("createdDate") or "0000-01-01", meta.get("title", ""))

    all_metadata.sort(key=private_sort_key, reverse=True)
    overlay_summaries_from_markdown(all_metadata)
    overlay_body_from_markdown(all_metadata)
    overlay_listing_excludes(all_metadata)
    overlay_alternative_slugs(all_metadata)
    write_json(POSTS_PRIVATE_JSON, all_metadata)


def generate_links_cache(links: List[Dict[str, Any]]) -> None:
    if not links:
        write_json(LINKS_JSON, [])
        write_json(API_LINKS_JSON, {"url": f"{SITE_BASE}/api/links.json", "links": []})
        return
    links.sort(key=lambda item: item.get("display_order") or 0)
    output = [
        {
            "name": link.get("name"),
            "url": link.get("url"),
            "icon": link.get("icon"),
            "description": link.get("description"),
        }
        for link in links
    ]
    write_json(LINKS_JSON, output)
    write_json(API_LINKS_JSON, {"url": f"{SITE_BASE}/api/links.json", "links": output})


def _parse_description(desc: Any) -> List[str]:
    if desc is None or (isinstance(desc, str) and not desc.strip()):
        return []
    if isinstance(desc, list):
        return [str(x) for x in desc]
    if isinstance(desc, str):
        try:
            parsed = json.loads(desc)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
            return [str(parsed)]
        except Exception:
            return [desc]
    return [str(desc)]


def generate_timeline_cache(timeline: List[Dict[str, Any]]) -> None:
    if not timeline:
        write_json(TIMELINE_JSON, [])
        write_json(API_TIMELINE_JSON, {"url": f"{SITE_BASE}/api/timeline.json", "timeline": []})
        return

    timeline.sort(key=lambda item: item.get("display_order") or 0)
    output: List[Dict[str, Any]] = []
    for entry in timeline:
        output.append(
            {
                "role": entry.get("role"),
                "company": entry.get("company"),
                "date": entry.get("date"),
                "description": _parse_description(entry.get("description")),
            }
        )
    write_json(TIMELINE_JSON, output)
    write_json(API_TIMELINE_JSON, {"url": f"{SITE_BASE}/api/timeline.json", "timeline": output})


def main() -> None:
    p = argparse.ArgumentParser(description="Generate website cache from Neotoma export JSON.")
    p.add_argument(
        "--from-neotoma-json",
        type=Path,
        default=DEFAULT_NEOTOMA_EXPORT,
        help=f"Neotoma export JSON path (default: {DEFAULT_NEOTOMA_EXPORT})",
    )
    args = p.parse_args()

    export_path = args.from_neotoma_json.resolve()
    if not export_path.exists():
        export_path.parent.mkdir(parents=True, exist_ok=True)
        write_json(export_path, {"posts": [], "links": [], "timeline": []})

    posts, links, timeline = load_from_neotoma_json(export_path)
    generate_posts_cache(posts)
    generate_links_cache(links)
    generate_timeline_cache(timeline)


if __name__ == "__main__":
    main()

