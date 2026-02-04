# Posts Directory

This directory contains cache files and markdown files for blog posts and essays.

## Source of Truth

**Posts are stored in Parquet MCP storage** (`$DATA_DIR/posts/posts.parquet`). The JSON files in this directory are **generated cache files** created during the build process.

## Structure

- `posts.json` - **Generated cache** of public posts only (published: true) - auto-generated on build
- `posts.private.json` - **Generated cache** of all posts including drafts - auto-generated on build
- `*.md` - Markdown files for post body (source of truth for content; synced to parquet on build)
- `*.summary.md` - Key takeaways for each post (source of truth when present; synced to parquet on build)
- `*.tweet.md` - Share tweet for each post (draft tweets in `drafts/{slug}.tweet.md`; synced to parquet as `share_tweet`; shown in dev below post)
- `drafts/` - Directory for draft posts (gitignored, not committed to version control)
- `drafts/outlines/` - Directory for post outlines (gitignored, private planning documents)

**Build Process:**
1. `npm run build` triggers prebuild script
2. Prebuild script (`generate_posts_cache.py`) syncs body from `{slug}.md`, key takeaways from `{slug}.summary.md`, and share tweet from `{slug}.tweet.md` into parquet; pulls missing summaries/tweets from parquet into `.summary.md`/`.tweet.md`
3. Cache JSON files are generated from parquet
4. Vite builds the React app using cache files

## Share tweet (drafts)

For draft posts, add `drafts/{slug}.tweet.md` with the share tweet text (e.g. for Twitter/X). Always include relevant URLs (e.g. link to the post, project links) and @ mentions (people or accounts relevant to the post). Stay under 280 characters. The cache script syncs the file to parquet (`share_tweet`). In dev, the tweet is displayed below the post on the post page. Run `python3 execution/scripts/generate_posts_cache.py` after adding or editing the file.

## Hero Images

Hero images are optional and can be added to any post:

1. **Store images**: Place hero images in `/public/images/posts/` directory
2. **Add to metadata**: Include `heroImage` field in post metadata with just the filename:
   ```json
   {
     "heroImage": "my-hero-image.jpg"
   }
   ```
3. **Display**: Hero images automatically appear:
   - At the top of the post page (full width, below header)
   - As a thumbnail in the posts listing (clickable, max height 300px)

**Formatting (optional):** Add a file `{slug}-hero-style.txt` in `public/images/posts/` with one line to control layout:
- `keep-proportions` — image keeps aspect ratio, no cropping (max height 70vh)
- `float-right` — image floats to the right of the body text, square crop
- (omit or leave empty) — default: full-width, square crop

Example: `truth-layer-agent-memory-hero-style.txt` containing `keep-proportions`. Synced to parquet on cache generation.

Supported image formats: JPG, PNG, WebP, etc. (any format supported by browsers)

### Hero Image Style Guide (MANDATORY)

**MANDATORY:** All hero images for blog posts MUST follow this style. Reference: `truth-layer-agent-memory-hero.png`, `agentic-search-and-the-truth-layer-hero.png`.

**Visual style:**
- **Background:** Solid black only. No gradients, no white sections, no mixed backgrounds.
- **Foreground:** White line-art exclusively. No fills, no shading, no gradients within shapes.
- **Line work:** Consistent thin white outlines. Clean, minimal line weight.
- **Color:** Monochromatic black and white only. No gray, no other colors.
- **Composition:** Elements in lower portion of frame. Generous negative (black) space above.
- **Aesthetic:** Stylized, iconic, minimalist. Not realistic or photorealistic.
- **No typography:** No text, labels, or captions within the image.

**Layout:** Use `keep-proportions` in `{slug}-hero-style.txt` so the image displays without cropping (max height 70vh).

**When generating new hero images:** Apply the above specifications. The theme or subject can vary per post, but the visual style (black background, white outline line-art, minimalist) must remain consistent.

### Post Image Assets Checklist (for drafting)

For each post with a hero image, create **three composed assets** (do not crop; regenerate for each format):

| Asset | Filename | Dimensions | Use |
|-------|----------|------------|-----|
| Hero | `{slug}-hero.png` | Flexible (keep-proportions) | Full-width on post page |
| Square thumbnail | `{slug}-hero-square.png` | 1:1 square | Posts list, home latest, prev/next (148×148) |
| OG source | `{slug}-hero-og.png` | 1200×630 landscape | Social previews (Twitter, LinkedIn, etc.) |

**Workflow:**
1. Create `{slug}-hero.png` with composition for full-width display (elements in lower portion, generous negative space).
2. Create `{slug}-hero-square.png` composed for 1:1 (e.g. vertical stack, centered layout).
3. Create `{slug}-hero-og.png` composed for 1200×630 (e.g. left-right split, horizontal layout).
4. Add `{slug}-hero-style.txt` with `keep-proportions`.
5. Run `npm run generate:og:post -- <slug>` to produce `og/{slug}-1200x630.jpg` (< 600 KB).
6. Regenerate cache: `python3 execution/scripts/generate_posts_cache.py`.

The cache auto-detects `-hero-square.png` and `og/{slug}-1200x630.jpg` when present. All three assets share the same visual style (black background, white line-art, no typography).

## Share (OG) Images

Social previews use a default 1200×630 image under 600 KB (WhatsApp limit). Generate it once:

```bash
npm run generate:og
```

Output: `public/images/og-default-1200x630.jpg` (from `public/profile.jpg`).

**Per-post share image:** Generate a 1200×630 image (black background, under 600 KB):

```bash
npm run generate:og:post -- <slug>
```

The script prefers a dedicated OG source when present: `public/images/posts/<slug>-hero-og.png` (composed for 1200×630, cover fit). Otherwise it uses the hero image (contain fit). Output: `public/images/og/<slug>-1200x630.jpg`. The cache script automatically sets `ogImage` to `og/<slug>-1200x630.jpg` when that file exists. You can also set `og_image` in parquet or add a custom image (e.g. from Figma/Canva) under `public/images/` and reference it via parquet `og_image` or the same file convention.

**OG title:** For social previews, 50–60 characters is optimal. Shorter titles (e.g. 47 chars) can be lengthened in post metadata if desired.

**Note:** The system uses `posts.private.json` if available, otherwise falls back to `posts.json`. Private file should include all posts (published + drafts), while public file only includes published posts.

## Adding a New Post

**Important:** Posts are now stored in Parquet MCP. Use the parquet MCP `add_record` tool to add new posts.

### Method 1: Using Parquet MCP (Recommended)

Use the parquet MCP `add_record` tool to add a new post directly:

```python
# Example using ParquetMCPClient
from parquet_client import ParquetMCPClient

client = ParquetMCPClient()
client.call_tool_sync("add_record", {
    "data_type": "posts",
    "record": {
        "slug": "my-new-post",
        "title": "My New Post Title",
        "excerpt": "Brief description of the post...",
        "published": False,
        "published_date": None,
        "category": "essay",
        "read_time": 5,
        "tags": '["tag1", "tag2"]',  # JSON string
        "hero_image": "my-hero-image.jpg",
        "body": "Full markdown content here...",
        "created_date": "2025-01-19",
        "updated_date": "2025-01-19"
    }
})
```

### Method 2: Manual Workflow (Legacy)

If you need to add posts manually:

1. Create markdown file in `drafts/` subdirectory
2. Add post metadata to a temporary JSON file
3. Run migration script: `python3 execution/scripts/migrate_posts_to_parquet.py`
4. Regenerate cache: `python3 execution/scripts/generate_posts_cache.py`

### Fields

- `slug`: Unique identifier, kebab-case (e.g., "my-new-post"); also the canonical URL path
- `alternative_slugs`: (Optional) JSON array of alternate URL slugs (e.g. `["short-slug"]`). Requests to alternative slugs return 301 to the canonical `/posts/{slug}` URL for SEO.
- `title`: Post title
- `excerpt`: Short description (shown in post list)
- `published`: `true` for published, `false` for drafts
- `published_date`: ISO date string (YYYY-MM-DD) or null for drafts
- `category`: Post category (e.g., "essay", "technical", "article")
- `read_time`: Estimated reading time in minutes
- `tags`: JSON string array (e.g., `'["tag1", "tag2"]'`)
- `hero_image`: (Optional) Filename of hero image stored in `/public/images/posts/`
- `hero_image_style`: (Optional) CSS style for hero image
- `exclude_from_listing`: (Optional) Exclude from posts listing
- `show_metadata`: (Optional) Show metadata on post page
- `body`: Full markdown content (synced from `{slug}.md`)
- `summary`: Key takeaways, markdown (synced from `{slug}.summary.md` when file exists)
- `created_date`: Creation date (YYYY-MM-DD)
- `updated_date`: Last update date (YYYY-MM-DD)

## Key Takeaways (summary)

Key takeaways for each post are editable in markdown, like the post body.

- **File**: `{slug}.summary.md` next to `{slug}.md` (or in `drafts/` for drafts)
- **Content**: Markdown (typically a bullet list) shown in the "Key takeaways" box on the post page
- **Sync**: On build or when running `generate_posts_cache.py`, body and summary are synced from `.md` / `.summary.md` into parquet, then cache JSON is generated. If a post has a summary in parquet but no `.summary.md` file yet, the script creates one from parquet so you can edit it in md.
- **Single post**: `python3 execution/scripts/apply_post_md_to_parquet.py <slug>` applies both `{slug}.md` and `{slug}.summary.md` to parquet and regenerates cache.

## Post Outlines

- **Location**: Store post outlines in `drafts/outlines/` subdirectory
- **Purpose**: Planning documents for future posts (essay outlines, content planning)
- **Git**: The `drafts/outlines/` directory is gitignored (private, not committed)
- **Naming**: Use descriptive names like `foundational-mission-essay-outline.md`

## Draft Posts

- **Storage**: Drafts are stored in parquet with `published: false`
- **Visibility**: Drafts are only visible when running `npm run dev` (development mode)
- **Production**: In production builds, drafts are automatically hidden (filtered by React app)
- **Cache**: `posts.private.json` includes drafts, `posts.json` excludes them

### Publishing a Draft

To publish a draft, use the parquet MCP `update_records` tool:

```python
from parquet_client import ParquetMCPClient

client = ParquetMCPClient()
client.call_tool_sync("update_records", {
    "data_type": "posts",
    "filters": {"slug": "my-draft-post"},
    "updates": {
        "published": True,
        "published_date": "2025-01-19",
        "updated_date": "2025-01-19"
    }
})
```

Then regenerate cache files: `python3 execution/scripts/generate_posts_cache.py`

## Updating Posts

To update an existing post, use the parquet MCP `update_records` tool:

```python
from parquet_client import ParquetMCPClient

client = ParquetMCPClient()
client.call_tool_sync("update_records", {
    "data_type": "posts",
    "filters": {"slug": "my-post"},
    "updates": {
        "body": "Updated markdown content...",
        "title": "Updated Title",
        "updated_date": "2025-01-19"
    }
})
```

Then regenerate cache files: `python3 execution/scripts/generate_posts_cache.py`

## Querying Posts

To query posts from parquet:

```python
from parquet_client import ParquetMCPClient

client = ParquetMCPClient()

# Get all published posts
result = client.call_tool_sync("read_parquet", {
    "data_type": "posts",
    "filters": {"published": True}
})

# Get a specific post
result = client.call_tool_sync("read_parquet", {
    "data_type": "posts",
    "filters": {"slug": "my-post"}
})
```

## Migration History

- **January 2025**: Migrated posts from markdown/JSON to Parquet MCP storage
- **Source of truth**: Changed from `posts.json` to `$DATA_DIR/posts/posts.parquet`
- **Build process**: Automated cache generation from parquet on build
- **Scripts**:
  - Migration: `execution/scripts/migrate_posts_to_parquet.py`
  - Cache generation: `execution/scripts/generate_posts_cache.py`

## Content Strategy

Posts align with the self-publishing strategy:
- **Canonical Essays**: Long-form (600-1,250 words, 3-5 min read)
- **Technical Articles**: Deep-dives (1,000-2,500 words)
- **Categories**: essay, technical, article, etc.

See `/strategy/strategy/self-publishing-strategy.md` for complete content strategy.
