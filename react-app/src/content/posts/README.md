# Posts Directory

This directory contains all blog posts and essays for the personal website.

## Structure

- `posts.json` - **Public** metadata for published posts only (committed to git)
- `posts.private.json` - **Private** metadata including drafts (gitignored, optional)
- `*.md` - Markdown files for published posts (one file per post)
- `drafts/` - Directory for draft posts (gitignored, not committed to version control)

**Note:** The system uses `posts.private.json` if available, otherwise falls back to `posts.json`. Private file should include all posts (published + drafts), while public file only includes published posts.

## Adding a New Post

1. **Create markdown file**: 
   - **Published posts**: Create `{slug}.md` in this directory
   - **Draft posts**: Create `{slug}.md` in `drafts/` subdirectory
   - Use kebab-case for the slug (e.g., `my-new-post.md`)
   - Write content in Markdown format

2. **Add metadata**: 
   - **For published posts**: Add entry to `posts.json` (public, committed)
   - **For draft posts**: Add entry to `posts.private.json` (private, gitignored)
   - If `posts.private.json` exists, it takes precedence and should include all posts
   
   ```json
   {
     "slug": "my-new-post",
     "title": "My New Post Title",
     "excerpt": "Brief description of the post...",
     "published": false,
     "publishedDate": null,
     "category": "essay",
     "readTime": 5,
     "tags": ["tag1", "tag2"]
   }
   ```

3. **Fields:**
   - `slug`: Must match the markdown filename (without `.md`)
   - `title`: Post title
   - `excerpt`: Short description (shown in post list)
   - `published`: `true` for published, `false` for drafts
   - `publishedDate`: ISO date string (YYYY-MM-DD) or `null` for drafts
   - `category`: Post category (e.g., "essay", "technical", "article")
   - `readTime`: Estimated reading time in minutes
   - `tags`: Array of tag strings

## Draft Posts

- **Location**: Store draft markdown files in `drafts/` subdirectory
- **Git**: The `drafts/` directory and `posts.private.json` are gitignored
- **Metadata**: 
  - Add draft entries to `posts.private.json` (not `posts.json`)
  - Set `"published": false` to mark as draft
- **Visibility**: Drafts are only visible when running `npm run dev` (development mode)
- **Production**: In production builds, drafts are automatically hidden
- **Publishing**: To publish a draft:
  1. Move the markdown file from `drafts/` to the main `posts/` directory
  2. Set `"published": true` in `posts.private.json` (or `posts.json` if not using private file)
  3. Add a `publishedDate` if not already set
  4. Copy the entry from `posts.private.json` to `posts.json` (public file)

## Content Strategy

Posts align with the self-publishing strategy:
- **Canonical Essays**: Long-form (600-1,250 words, 3-5 min read)
- **Technical Articles**: Deep-dives (1,000-2,500 words)
- **Categories**: essay, technical, article, etc.

See `/strategy/strategy/self-publishing-strategy.md` for complete content strategy.
