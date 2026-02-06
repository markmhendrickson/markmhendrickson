import React, { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'

const REMOTE_AGENT_JSON = 'https://markmhendrickson.com/agent.json'
const LOCAL_AGENT_JSON = '/agent.json'
const AGENT_JSON_URL = import.meta.env.DEV ? LOCAL_AGENT_JSON : REMOTE_AGENT_JSON
const SITE_BASE = 'https://markmhendrickson.com'
const NEOTOMA_POST_URL = `${SITE_BASE}/posts/truth-layer-agent-memory`
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

interface McpBullet {
  text: string
  url?: string
}

interface McpTable {
  columns: string[]
  rows: string[][]
}

interface McpSection {
  heading: string
  paragraphs: string[]
  bullets?: McpBullet[]
  table?: McpTable
}

interface McpContent {
  title: string
  subtitle: string
  description: string
  sections: McpSection[]
}

function linkFirstNeotoma(
  text: string,
  linkedRef: React.MutableRefObject<boolean>
): React.ReactNode {
  if (!linkedRef.current && text.includes('Neotoma')) {
    linkedRef.current = true
    const parts = text.split('Neotoma')
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 ? (
              <a
                href={NEOTOMA_POST_URL}
                className="text-[#1a1a1a] underline underline-offset-2 decoration-[#999] hover:decoration-[#333]"
              >
                Neotoma
              </a>
            ) : null}
          </React.Fragment>
        ))}
      </>
    )
  }
  return text
}

export default function Mcp() {
  const [content, setContent] = useState<McpContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const neotomaLinkedRef = useRef(false)

  const prevContentRef = useRef<McpContent | null>(null)
  if (content && content !== prevContentRef.current) {
    neotomaLinkedRef.current = false
    prevContentRef.current = content
  }

  useEffect(() => {
    let cancelled = false
    fetch(AGENT_JSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setContent(data as McpContent)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
    return () => { cancelled = true }
  }, [])

  const canonicalUrl = `${SITE_BASE}/agent`
  const pageTitle = content ? `${content.title} — Mark Hendrickson` : 'Agent — Mark Hendrickson'
  const pageDesc = content?.description ?? 'Have your agent talk to my agent.'

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta name="twitter:image:height" content={String(OG_IMAGE_HEIGHT)} />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-8 pb-16 px-4 md:py-24 md:px-8">
        <div className="max-w-[680px] w-full">
          {error && (
            <p className="text-[15px] text-[#555] leading-relaxed mb-4" role="alert">
              Could not load agent page: {error}. Ensure {AGENT_JSON_URL} is available.
            </p>
          )}
          {!content && !error && (
            <p className="text-[15px] text-[#555]">Loading…</p>
          )}
          {content && (
            <article className="agent-page">
              <header className="mb-14">
                <h1 className="text-[32px] md:text-[36px] font-medium mb-3 tracking-tight text-[#111]">
                  {content.title}
                </h1>
                <p className="text-[18px] text-[#555] leading-snug">
                  {content.subtitle}
                </p>
              </header>

              <div className="space-y-14">
                {content.sections.map((section, index) => (
                  <section key={index} className="space-y-4">
                    <h2 className="text-[17px] font-semibold text-[#222] tracking-tight border-b border-[#e5e5e5] pb-2">
                      {section.heading}
                    </h2>
                    <div className="text-[15px] text-[#444] leading-[1.65] space-y-3">
                      {section.paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex}>
                          {linkFirstNeotoma(paragraph, neotomaLinkedRef)}
                        </p>
                      ))}
                    </div>
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 space-y-1.5 text-[15px] text-[#444] leading-[1.6]">
                        {section.bullets.map((item, itemIndex) => (
                          <li key={itemIndex}>
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#1a1a1a] underline underline-offset-2 decoration-[#999] hover:decoration-[#333]"
                              >
                                {item.text}
                              </a>
                            ) : (
                              linkFirstNeotoma(item.text, neotomaLinkedRef)
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.table && section.table.columns.length > 0 && (
                      <div className="mt-6 overflow-x-auto rounded-md border border-[#e5e5e5]">
                        <table className="w-full text-[14px] text-[#333]">
                          <thead>
                            <tr className="bg-[#f7f7f7]">
                              {section.table.columns.map((column, columnIndex) => (
                                <th
                                  key={columnIndex}
                                  className="text-left font-semibold px-4 py-3 border-b border-[#e5e5e5] text-[#222]"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.table.rows.map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                className={rowIndex % 2 === 1 ? 'bg-[#fafafa]' : ''}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className={`px-4 py-3 border-b border-[#eee] last:border-b-0 align-top ${cellIndex === 0 ? 'font-mono text-[13px] text-[#222]' : ''}`}
                                  >
                                    {linkFirstNeotoma(cell, neotomaLinkedRef)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>
    </>
  )
}
