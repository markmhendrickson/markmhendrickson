import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  getPostImageSrc,
  formatPostPublishedDate,
  stripSeriesPrefixFromTitle,
  isParsablePublishedDate,
} from '@/lib/utils'
import { HighlightedText, PostListingExcerpt } from '@/components/PostListingBlocks'
import { SeriesOverviewProse, seriesOverviewTextForProse } from '@/components/SeriesOverviewProse'
import { seriesSeriesHeroBasename } from '@/lib/seriesListThumb'
import { getSeriesOverview } from '@/lib/seriesOverview'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'
import type { FeedItem } from '@/lib/postsFeed'

/** X/Twitter cutoff for "Show more" (280 chars) */
const TWEET_SHOW_MORE_CUTOFF = 280

function TweetPreview({
  body,
  expanded,
  onToggle,
  cutoff,
  showMoreLabel,
  showLessLabel,
}: {
  body: string
  expanded: boolean
  onToggle: () => void
  cutoff: number
  showMoreLabel: string
  showLessLabel: string
}) {
  const truncated = body.length > cutoff
  const displayText = truncated && !expanded ? body.slice(0, cutoff) : body

  return (
    <p className="text-[15px] text-foreground mb-3 leading-relaxed whitespace-pre-wrap">
      {displayText}
      {truncated && !expanded && (
        <>
          {' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground hover:underline bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit"
          >
            {showMoreLabel}
          </button>
        </>
      )}
      {truncated && expanded && (
        <>
          {' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground hover:underline bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit"
          >
            {showLessLabel}
          </button>
        </>
      )}
    </p>
  )
}

/**
 * The list-item markup shared by the /posts index and the homepage "latest posts" section.
 * Renders one `<article>` per feed item (series bundle or standalone post) as a fragment, so the
 * caller owns the wrapping element and its spacing.
 */
export function PostsFeedItems({
  items,
  query = '',
  titleAs: Title = 'h2',
}: {
  items: FeedItem[]
  query?: string
  /** Heading level for item titles; the visual style is identical for every level. */
  titleAs?: 'h2' | 'h3'
}) {
  const { locale, languageTag, t } = useLocale()
  const [expandedTweetSlugs, setExpandedTweetSlugs] = useState<Set<string>>(new Set())

  return (
    <>
      {items.map((item) => {
        if (item.kind === 'series') {
          const { slug, title, parts } = item.bundle
          const byPart = [...parts].sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0))
          const maxDeclaredSeriesTotal = parts.reduce(
            (max, p) =>
              typeof p.seriesTotal === 'number' && p.seriesTotal > 0 && p.seriesTotal > max
                ? p.seriesTotal
                : max,
            0,
          )
          const partCountForLabel = Math.max(parts.length, maxDeclaredSeriesTotal)
          const overviewRaw = getSeriesOverview(slug, byPart, locale)
          const description = overviewRaw ? seriesOverviewTextForProse(overviewRaw) : undefined
          const thumbBasename = seriesSeriesHeroBasename(slug)
          const thumbSrc = getPostImageSrc(thumbBasename)
          const latestDate = parts[0]?.publishedDate
          const primaryCategory = byPart.find((p) => (p.category || '').trim())?.category?.trim()
          return (
            <article
              key={`series-${slug}`}
              className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4"
            >
              <Link
                to={localizePath(`/posts/series/${slug}`, locale)}
                data-series-thumb-posts-index
                className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                aria-label={`${title} -- ${t.postsSeriesSeriesPage}`}
              >
                <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                  <img
                    src={thumbSrc}
                    alt={title}
                    loading="lazy"
                    className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center center' }}
                    onError={(e) => {
                      const root = e.currentTarget.closest('[data-series-thumb-posts-index]')
                      if (root instanceof HTMLElement) root.style.display = 'none'
                    }}
                  />
                </div>
              </Link>
              <div className="order-2 md:order-1 min-w-0 flex-1">
                <Title className="text-[20px] font-medium mb-2 tracking-tight">
                  <Link
                    to={localizePath(`/posts/series/${slug}`, locale)}
                    className="text-foreground no-underline hover:underline"
                  >
                    {title}
                  </Link>
                </Title>
                {description ? (
                  <SeriesOverviewProse
                    text={description}
                    paragraphClassName="text-[15px] text-foreground leading-relaxed"
                    maxParagraphs={1}
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                  {isParsablePublishedDate(latestDate) && (
                    <Link
                      to={localizePath(`/posts/series/${slug}`, locale)}
                      className="text-muted-foreground hover:text-foreground hover:underline no-underline"
                    >
                      <time dateTime={latestDate}>
                        {formatPostPublishedDate(latestDate, languageTag)}
                      </time>
                    </Link>
                  )}
                  <span>
                    {partCountForLabel}{' '}
                    {partCountForLabel === 1 ? t.postsSeriesPartSingular : t.postsSeriesPartPlural}
                  </span>
                  {primaryCategory ? (
                    <span className="capitalize">
                      {primaryCategory.toLowerCase() === 'tweet'
                        ? t.xPost
                        : primaryCategory.toLowerCase() === 'essay'
                          ? t.categoryEssay
                          : primaryCategory}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          )
        }

        const post = item.post
        return (
          <article key={post.slug} className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4">
            {(post.heroImage || post.ogImage || post.tweetMetadata?.images?.[0]) && (
              <Link
                to={localizePath(`/posts/${post.slug}`, locale)}
                className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
              >
                <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                  <img
                    src={getPostImageSrc(post.heroImageSquare ?? post.heroImage ?? post.ogImage ?? post.tweetMetadata?.images?.[0] ?? '')}
                    alt={stripSeriesPrefixFromTitle(post.title || '', post.series) || ''}
                    className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center center' }}
                  />
                </div>
              </Link>
            )}
            <div className="order-2 md:order-1 min-w-0 flex-1">
              {(post.category || '').toLowerCase() === 'tweet' ? (
                <TweetPreview
                  body={post.body ?? ''}
                  expanded={expandedTweetSlugs.has(post.slug)}
                  onToggle={() => {
                    setExpandedTweetSlugs(prev => {
                      const next = new Set(prev)
                      if (next.has(post.slug)) next.delete(post.slug)
                      else next.add(post.slug)
                      return next
                    })
                  }}
                  cutoff={TWEET_SHOW_MORE_CUTOFF}
                  showMoreLabel={t.showMore}
                  showLessLabel={t.showLess}
                />
              ) : (
                <Title className="text-[20px] font-medium mb-2 tracking-tight">
                  <Link
                    to={localizePath(`/posts/${post.slug}`, locale)}
                    className="text-foreground no-underline hover:underline"
                  >
                    <HighlightedText
                      text={stripSeriesPrefixFromTitle(post.title, post.series)}
                      query={query}
                    />
                  </Link>
                </Title>
              )}
              <PostListingExcerpt
                excerpt={post.excerpt}
                isTweet={(post.category || '').toLowerCase() === 'tweet'}
                query={query}
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                {post.seriesPart != null && post.seriesTotal != null && (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Part {post.seriesPart} of {post.seriesTotal}
                  </span>
                )}
                {post.publishedDate && (
                  <Link
                    to={localizePath(`/posts/${post.slug}`, locale)}
                    className="text-muted-foreground hover:text-foreground hover:underline no-underline"
                  >
                    <time dateTime={post.publishedDate}>
                      {formatPostPublishedDate(post.publishedDate, languageTag)}
                    </time>
                  </Link>
                )}
                {post.readTime && (
                  <span>{post.readTime} {t.minRead}</span>
                )}
                {post.category && (
                  <span className="capitalize">
                    {(post.category || '').toLowerCase() === 'tweet'
                      ? t.xPost
                      : (post.category || '').toLowerCase() === 'essay'
                        ? t.categoryEssay
                        : post.category}
                  </span>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </>
  )
}
