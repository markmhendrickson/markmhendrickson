# Posts Directory

This directory contains cache files and markdown files for blog posts and essays.

## Source of Truth

**Posts are stored in Parquet MCP storage** (`$DATA_DIR/posts/posts.parquet`). The JSON files in this directory are **generated cache files** created during the build process.

## Structure

- `posts.json` - **Generated cache** of public posts only (published: true) - auto-generated on build
- `posts.private.json` - **Generated cache** of all posts including drafts - auto-generated on build
- `*.md` - Markdown files for published posts (kept for reference, but not source of truth)
- `drafts/` - Directory for draft posts (gitignored, not committed to version control)
- `drafts/outlines/` - Directory for post outlines (gitignored, private planning documents)

**Build Process:**
1. `npm run build` triggers prebuild script
2. Prebuild script (`generate_posts_cache.py`) queries parquet MCP
3. Cache JSON files are generated automatically
4. Vite builds the React app using cache files

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

Supported formats: JPG, PNG, WebP, etc. (any format supported by browsers)

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

- `slug`: Unique identifier, kebab-case (e.g., "my-new-post")
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
- `body`: Full markdown content
- `created_date`: Creation date (YYYY-MM-DD)
- `updated_date`: Last update date (YYYY-MM-DD)

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
