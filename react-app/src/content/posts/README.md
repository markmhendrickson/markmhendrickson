# Posts Directory

This directory contains cache files and markdown files for blog posts and essays.

## Source of Truth

**Website data (posts, links, timeline) is hosted in Neotoma.** Neotoma is the source of truth. The JSON files in this directory are **generated cache files** created during the build process.

The website build uses only Neotoma. Export posts, links, and timeline from Neotoma MCP to a JSON file with shape `{"posts": [...], "links": [...], "timeline": [...]}`, then run the cache script. Default path: `data/tmp/neotoma_website_export.json`. If the export has only posts, merge links and timeline with `execution/scripts/build_neotoma_website_export.py --links <path> --timeline <path>` (or add them manually), then run:

```bash
python3 execution/scripts/generate_posts_cache.py --from-neotoma-json /path/to/neotoma_export.json
```

If the export file is missing, the script exits with an error (no Parquet fallback).

### Deploy without Neotoma secret (commit cache, GitHub uses it)

GitHub Actions does not need to call Neotoma or use `NEOTOMA_WEBSITE_EXPORT_JSON`. Rebuild the cache from Neotoma locally, commit it, and push; the deploy workflow uses the committed cache.

1. **Export from Neotoma** to `data/tmp/neotoma_website_export.json` (from ateles repo root). Use Neotoma MCP (e.g. `retrieve_entities` for posts, then build `{"posts": [...], "links": [...], "timeline": [...]}`) or your existing export script.
2. **Rebuild cache** from ateles repo root:
   ```bash
   ./execution/scripts/rebuild_website_cache_for_deploy.sh
   ```
   Or with a custom export path: `./execution/scripts/rebuild_website_cache_for_deploy.sh /path/to/export.json`. This writes `execution/website/markmhendrickson/react-app/cache/*.json` and `cache/api/*.json`.
3. **Commit and push** the website repo (e.g. `execution/website/markmhendrickson`):
   ```bash
   cd execution/website/markmhendrickson
   git add react-app/cache/*.json react-app/cache/api/*.json
   git commit -m "Rebuild cache from Neotoma"
   git push origin main
   ```
   The deploy workflow will use these committed cache files; no secret required.

## Structure

- `posts.json` - **Generated cache** of public posts only (published: true) - auto-generated on build
- `*.md` - Markdown files for post body (source of truth for content; synced to parquet on build)
- `*.summary.md` - Key takeaways for each post (source of truth when present; synced to parquet on build)
- `*.tweet.md` - Share tweet for each post (draft tweets in `drafts/{slug}.tweet.md`; synced to parquet as `share_tweet`; shown in dev below post)
- `*.postscript.md` - Optional postscript (e.g. notes on how the post came to be). Rendered after the body when present; editable like body/summary. Drafts: `drafts/{slug}.postscript.md`.
- `drafts/` - Directory for draft posts (gitignored, not committed to version control)
- `drafts/outlines/` - Directory for post outlines (gitignored, private planning documents)

**Build Process:**
1. `npm run build` triggers prebuild script
2. Prebuild script (`generate_posts_cache.py`) loads from the Neotoma export JSON (default `data/tmp/neotoma_website_export.json`); pulls missing summaries/tweets from export into `.summary.md`/`.tweet.md`
3. Cache JSON files are generated (posts, links, timeline)
4. Vite builds the React app using cache files

**When updating posts:** Always (1) update Neotoma so the post entity reflects your changes (source of truth), and (2) regenerate the website cache so the site shows them. From repo root: `python3 execution/scripts/generate_posts_cache.py --from-neotoma-json data/tmp/neotoma_website_export.json` (or `python3 execution/scripts/generate_website_cache.py` for default path). The site reads from the cache files only. **Dev server:** When cache JSON changes, the Vite dev server triggers a full reload so updates appear; if they don’t, do a hard refresh (Cmd+Shift+R) or restart `npm run dev`.

## Share tweet (drafts)

For draft posts, add `drafts/{slug}.tweet.md` with the share tweet text (e.g. for Twitter/X). Always include relevant URLs (e.g. link to the post, project links) and @ mentions (people or accounts relevant to the post). Stay under 280 characters. The cache script syncs the file to Parquet when using Parquet (share_tweet). In dev, the tweet is displayed below the post on the post page. Run `python3 execution/scripts/generate_posts_cache.py` after adding or editing the file.

## X timeline embed

To show an embedded X (Twitter) feed below a post, set the post’s `x_timeline_url` in Neotoma (or Parquet) to a **profile URL** (e.g. `https://x.com/username`) or a **list URL**. The site renders it using X’s timeline widget (same script as single-tweet embeds). See [How to embed a timeline](https://help.x.com/en/using-x/embed-x-feed). Regenerate the cache after changing the value.

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

Example: `truth-layer-agent-memory-hero-style.txt` containing `keep-proportions`. Hero metadata is read from the Neotoma export (ensure export includes hero_image / hero_image_style).

Supported image formats: JPG, PNG, WebP, etc. (any format supported by browsers)

### Storing images in Neotoma (MCP)

Per Neotoma MCP instructions, to store image files in Neotoma and link them to a post:

1. **Store the file** via `store` (unstructured):
   - Provide **either** `file_content` (base64-encoded) + `mime_type` (e.g. `image/png`, `image/jpeg`) **or** `file_path` (local path when the MCP server has filesystem access).
   - Do not interpret or extract data from the file; pass it as-is. The server stores the source (content-addressed, SHA-256 dedup) and can run interpretation if `interpret: true`.
   - Use a unique `idempotency_key` (e.g. `hero-{slug}`). Response includes the created source (e.g. `source_id`).

2. **Create an image/media entity** that references that source (e.g. entity with `source_id` or equivalent linking to the stored file). Use `store` with `entities: [{ "entity_type": "image" or "media", ... }]` per Neotoma schema.

3. **Link to the post** via `create_relationship`:
   - `relationship_type`: `EMBEDS`
   - `source_entity_id`: post (container) entity id
   - `target_entity_id`: image/media entity id
   - Optional metadata: `caption`, `order`

Access later: `retrieve_file_url` returns a URL for a stored source (by default a `file://` URL when using local Neotoma storage).

**Migration to Neotoma storage:** Run `python execution/scripts/migrate_website_images_to_neotoma.py` to generate a manifest (`data/tmp/website_hero_manifest.json`). Post slug→entity_id map (99 posts) is in `data/tmp/post_entity_ids.json`. **Done:** Six hero images are stored in Neotoma (openclaw-and-the-truth-layer, neotoma-developer-release, dhh-clankers-truth-layer, truth-layer-agent-memory, agentic-search-and-the-truth-layer) with image entities. **Limitation:** `create_relationship(EMBEDS, post_entity_id, image_entity_id)` currently fails at the Neotoma API; once supported, link posts to images using the post map. Remaining manifest entries (hero_square, hero_og, og) can be migrated the same way: `store_unstructured` (idempotency `website-{role}-{slug}`), then `store_structured` (image entity with `source_id`, `role`, `slug`, `filename`). Skip slug `404` for post linking. The website continues to serve images from static paths; Neotoma holds the canonical copy for provenance and future URL resolution.

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

### Format: memory & truth-layer series

Posts in the "memory and truth layer" series (e.g. Claude Memory Tool, OpenAI API, ChatGPT Memory, Claude app Memory) share a **flexible pattern** so readers know what to expect without every post reading the same.

**Recurring beats (order and depth can vary):**

1. **Opening** — What this thing is (product or API), one-line contrast if needed (e.g. "not the developer tool"), and a sentence that sets the post’s scope: "This post explains X, Y, Z and when a truth layer fits."
2. **What [it] is** — Definition, how it works, key mechanisms, and controls. Enough concrete detail that the reader knows exactly what they’re reading about.
3. **Where it excels** — Honest strengths (bullets or short paragraphs). Product- or API-specific.
4. **Where it falls short** — Honest limits (opaque, platform-bound, no provenance, no rollback, not structured, etc.). Use the section heading that fits: "Where it falls short," "What's missing," "Where the Memory Tool falls short."
5. **When a truth layer makes sense** — Clear criteria; optional comparison table (Memory vs truth layer) when it adds clarity.
6. **Optional** — "How configuration works" (developer posts), FAQ only when it really helps.
7. **What I'm building** — One short paragraph: Neotoma, what it does, and how it fits ("both have a place" or "use X for Y, truth layer for Z").

**How to avoid cookie-cutter:**

- **Length and depth** vary by audience and product (developer posts can be longer with tables and FAQ; user posts can be tighter with a "comparison at a glance" table).
- **Section titles** are product-specific, not fixed ("What's missing" vs "Where it falls short" vs "Where the Memory Tool falls short").
- **Include only what fits** — e.g. "Where the current setup works" only when it clarifies (e.g. OpenAI API); skip when redundant.
- **Voice** stays consistent; examples and specifics are always product-specific. No filler phrases repeated verbatim.
- **Tables** when they help; don’t force one in every post.

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

The script prefers a dedicated OG source when present: `public/images/posts/<slug>-hero-og.png` (composed for 1200×630, cover fit). Otherwise it uses the hero image (contain fit). Output: `public/images/og/<slug>-1200x630.jpg`. The cache script automatically sets `ogImage` to `og/<slug>-1200x630.jpg` when that file exists. You can also set `og_image` in Neotoma/Parquet or add a custom image (e.g. from Figma/Canva) under `public/images/` and reference it via parquet `og_image` or the same file convention.

**OG title:** For social previews, 50–60 characters is optimal. Shorter titles (e.g. 47 chars) can be lengthened in post metadata if desired.

**Note:** The system uses `posts.json` for public posts only.

## Adding a New Post

**Important:** Posts are stored in Neotoma (source of truth). Use Neotoma MCP `store` or `store_structured` with `entity_type: "post"` to add new posts. When Neotoma is not available, Parquet MCP can be used as fallback; then migrate to Neotoma per repo migration rules.

### Method 1: Using Neotoma MCP (Recommended)

Store the post as a structured entity with `entity_type: "post"`. Include all fields (slug, title, excerpt, body, published, published_date, category, read_time, tags, hero_image, created_date, updated_date, etc.). The canonical identifier for posts in Neotoma is `slug`.

### Method 2: Using Parquet MCP (Fallback)

Store the post in Neotoma via Neotoma MCP; then regenerate the export and run the cache script.

### Parquet to Neotoma migration (bulk completion)

To migrate all website posts from Parquet to Neotoma in one go:

1. **Export full records:** From repo root, run:
   ```bash
   python3 execution/scripts/migrate_website_parquet_to_neotoma.py --write-batches
   ```
   This writes deduped posts to `data/tmp/website_posts_for_neotoma_export.json` and batch files `data/tmp/website_posts_batch_N.json`. Optionally use `--output /path/to/file.json`, `--slugs slug1,slug2,...`, or `--batch-size N`.

2. **Ingest into Neotoma:** Each batch file has `{"entities": [...]}` with `entity_type: "post"` set. Call Neotoma MCP `store_structured` for each batch with a unique `idempotency_key` (e.g. `website-posts-batch-1` through `website-posts-batch-20`).

3. **After verification:** When all posts are in Neotoma, delete website post rows from Parquet via Parquet MCP `delete_records` (e.g. by slug or in batches) per `.cursor/rules/neotoma_parquet_migration.mdc`.

### Method 3: Manual Workflow (Legacy)

If you need to add posts manually:

1. Create markdown file in `drafts/` subdirectory
2. Add post metadata to a temporary JSON file
3. Run migration script: `python3 execution/scripts/migrate_posts_to_parquet.py`
4. Regenerate cache: `python3 execution/scripts/generate_posts_cache.py`

### Fields

- `slug`: Unique identifier, kebab-case (e.g., "my-new-post"); also the canonical URL path
- `alternative_slugs`: (Optional) JSON array of alternate URL slugs (e.g. `["short-slug"]`). Alternative URLs serve the same content; the page sets `<link rel="canonical">` to the primary `/posts/{slug}` URL for SEO.
- `title`: Post title
- `excerpt`: Short description (shown in post list)
- `published`: `true` for published, `false` for drafts
- `published_date`: ISO date string (YYYY-MM-DD) or null for drafts
- `category`: Post category (e.g., "essay", "technical", "article")
- `read_time`: Estimated reading time in minutes
- `tags`: JSON string array (e.g., `'["tag1", "tag2"]'`)
- `hero_image`: (Optional) Filename of hero image stored in `/public/images/posts/`
- `hero_image_style`: (Optional) CSS style for hero image
- `exclude_from_listing`: (Optional) Exclude from posts listing. Can be set in Neotoma or via **listing_overrides.json** (see below).
- `show_metadata`: (Optional) Show metadata on post page
- `body`: Full markdown content (synced from `{slug}.md`)
- `summary`: Key takeaways, markdown (synced from `{slug}.summary.md` when file exists)
- `created_date`: Creation date (YYYY-MM-DD)
- `updated_date`: Last update date (YYYY-MM-DD)

## Key Takeaways (summary)

Key takeaways for each post are editable in markdown, like the post body.

- **File**: `{slug}.summary.md` next to `{slug}.md` (or in `drafts/` for drafts)
- **Content**: Markdown (typically a bullet list) shown in the "Key takeaways" box on the post page
- **Sync**: Cache is generated from the Neotoma export. If a post has a summary in the export but no `.summary.md` file yet, the cache script writes it to `.summary.md` so you can edit it in markdown.

## Post Outlines

- **Location**: Store post outlines in `drafts/outlines/` subdirectory
- **Purpose**: Planning documents for future posts (essay outlines, content planning)
- **Git**: The `drafts/outlines/` directory is gitignored (private, not committed)
- **Naming**: Use descriptive names like `foundational-mission-essay-outline.md`

## Draft Posts

- **Always draft in Neotoma first.** Store the post in Neotoma with `published: false` (Neotoma MCP `store_structured`, `entity_type: "post"`). The site cache is generated from the Neotoma export; the private cache includes all posts (including drafts) so dev preview can show them.
- **Cache and dev preview:** When making post changes, always update Neotoma and regenerate the cache. Export posts from Neotoma to the website export JSON, then run `python3 execution/scripts/generate_posts_cache.py --from-neotoma-json data/tmp/neotoma_website_export.json`. The script writes `posts.json` (published only) and `posts.private.json` (all posts including drafts). In dev (`npm run dev`) the site loads the private cache, so drafts are visible. Drafts that exist only as `drafts/*.md` (not yet in the export) are merged into the private cache as draft-only so they appear in dev without re-exporting.
- **Visibility:** Drafts are only visible when running `npm run dev`. In production builds, drafts are hidden (site uses public cache only).
- **Cache:** `posts.json` excludes drafts; `posts.private.json` includes them for dev.

## Listing overrides

To hide specific published posts from the index (e.g. the Barcelona guest floor page or the professional mission essay) without unpublishing them, use **listing_overrides.json** in this directory:

```json
{
  "exclude_from_listing": ["barcelona-guest-floor", "professional-mission"]
}
```

The cache script applies these slugs when generating `posts.json`, so they stay excluded after re-running `generate_posts_cache.py`. Add or remove slugs as needed.

### Publishing a Draft

To publish a draft, use Neotoma MCP (e.g. correct or store with updated fields) or Parquet MCP `update_records`:

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

Then update Neotoma with the new published state and regenerate cache: `python3 execution/scripts/generate_posts_cache.py --from-neotoma-json data/tmp/neotoma_website_export.json`

## Updating Posts

When updating post content (title, excerpt, body, summary, hero, etc.): (1) update Neotoma (MCP correct/store or Parquet `update_records`) so the export reflects the change, and (2) regenerate the website cache. To update an existing post in Neotoma/Parquet:

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

Then regenerate the website cache: `python3 execution/scripts/generate_posts_cache.py --from-neotoma-json data/tmp/neotoma_website_export.json`

## Querying Posts

To query posts, use Neotoma MCP first (e.g. `retrieve_entities` entity_type=post). Fallback: Parquet MCP:

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
- **Later**: Website data (posts, links, timeline) source of truth moved to Neotoma
- **Source of truth**: Neotoma; cache is generated only from Neotoma export (`--from-neotoma-json` or default path)
- **Scripts**:
  - Cache generation: `execution/scripts/generate_posts_cache.py` (supports `--from-neotoma-json <path>`)
  - Legacy migration: `execution/scripts/migrate_posts_to_parquet.py`

## Content Strategy

Posts align with the self-publishing strategy:
- **Canonical Essays**: Long-form (600-1,250 words, 3-5 min read)
- **Technical Articles**: Deep-dives (1,000-2,500 words)
- **Categories**: essay, technical, article, etc.

See `/strategy/strategy/self-publishing-strategy.md` for complete content strategy.
