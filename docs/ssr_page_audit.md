# SSR page audit

Pages checked for "view-source has full content" (no client-only data loading).

## OK (sync data or already SSR)

| Page | Data source | Notes |
|------|-------------|--------|
| Home | `getLocalizedPublicPosts(locale)` | Sync at render |
| Posts | `PostsListSSRContext` | Injected list + script tag for hydration |
| Post (single) | `PostSSRProvider` + `postBody` | Server passes body in prerender |
| Timeline | `@cache/timeline.json` | Static import |
| Links | `@cache/links.json` | Static import |
| Consulting | Inline `copy` | No fetch |
| Investing | `@/data/pages/investing.json` | Static import |
| Wisdom | `@cache/wisdom.json` | Static import |
| Schedule (meet) | Inline copy | No fetch |
| Honors thesis | `honors-thesis-body.md` + `honors-thesis.json` | Static imports |
| Newsletter | Form only | No list to SSR |
| NotFound | Static | N/A |

## Fixed (were client-only, now SSR)

| Page | Fix |
|------|-----|
| **Songs** (`/songs`) | Server reads `public/data/songs.json` in prerender, passes via `SongsSSRProvider` + script tag; Songs.tsx uses `useSongsSSR()` and skips fetch when present. |
| **Agent** (`/agent`, `/:locale/agent`) | Server reads `cache/api/agent.json` (and `agent.{locale}.json`) in prerender, passes via `AgentSSRProvider` + script tag; Mcp.tsx uses `useAgentSSR()` and skips fetch when present. |

## Minor

| Page | Note |
|------|------|
| NewsletterConfirm | `useEffect` POSTs to confirm API; visible content (form, survey) is static. Confirm result is async; acceptable to leave as-is. |

## Implementation order

1. **Agent** – High visibility page; content is in `cache/api/agent.json` (and `agent.{locale}.json`).
2. **Songs** – Data in `public/data/songs.json`; available at build time (Vite copies public to dist).
