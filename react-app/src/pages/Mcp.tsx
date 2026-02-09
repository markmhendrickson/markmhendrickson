import React, { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'

const REMOTE_AGENT_JSON = 'https://markmhendrickson.com/api/agent.json'
const LOCAL_AGENT_JSON = '/api/agent.json'
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
  mcpServerRepoUrl?: string
  sections: McpSection[]
}

const LINK_CLASS =
  'text-[#1a1a1a] underline underline-offset-2 decoration-[#999] hover:decoration-[#333]'

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
              <a href={NEOTOMA_POST_URL} className={LINK_CLASS}>
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

function linkFirstMcpServer(
  text: string,
  repoUrl: string | undefined,
  mcpLinkedRef: React.MutableRefObject<boolean>,
  neotomaLinkedRef: React.MutableRefObject<boolean>
): React.ReactNode {
  if (!repoUrl || mcpLinkedRef.current || !text.includes('an MCP server')) {
    return linkFirstNeotoma(text, neotomaLinkedRef)
  }
  mcpLinkedRef.current = true
  const parts = text.split('an MCP server')
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {linkFirstNeotoma(part, neotomaLinkedRef)}
          {i < parts.length - 1 ? (
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              an MCP server
            </a>
          ) : null}
        </React.Fragment>
      ))}
    </>
  )
}

export default function Mcp() {
  const [content, setContent] = useState<McpContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const neotomaLinkedRef = useRef(false)
  const mcpServerLinkedRef = useRef(false)

  const prevContentRef = useRef<McpContent | null>(null)
  if (content && content !== prevContentRef.current) {
    neotomaLinkedRef.current = false
    mcpServerLinkedRef.current = false
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
      <div className="flex justify-center items-start min-h-content pt-10 pb-20 px-5 md:py-28 md:px-8">
        <div className="max-w-[42rem] w-full">
          {error && (
            <p className="text-[15px] text-[#666] leading-relaxed mb-4" role="alert">
              Could not load agent page: {error}. Ensure {AGENT_JSON_URL} is available.
            </p>
          )}
          {!content && !error && (
            <p className="text-[15px] text-[#666]">Loading…</p>
          )}
          {content && (
            <article className="agent-page">
              <header className="mb-16">
                <h1 className="text-[28px] font-medium mb-2 tracking-tight text-[#111]">
                  {content.title}
                </h1>
                <p className="text-[17px] text-[#666] font-normal tracking-wide max-w-[32rem]">
                  {content.subtitle}
                </p>
              </header>

              <div className="space-y-16">
                {content.sections.map((section, index) => (
                  <section key={index} className="space-y-5">
                    <h2 className="text-[20px] font-medium text-[#1a1a1a] tracking-tight border-b border-[#e0e0e0] pb-2.5">
                      {section.heading}
                    </h2>
                    <div className="text-[15px] text-[#666] leading-relaxed space-y-4">
                      {section.paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex} className="max-w-[65ch]">
                          {linkFirstMcpServer(
                            paragraph,
                            content.mcpServerRepoUrl,
                            mcpServerLinkedRef,
                            neotomaLinkedRef
                          )}
                        </p>
                      ))}
                    </div>
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-1 list-disc pl-6 space-y-2 text-[15px] text-[#666] leading-relaxed marker:text-[#888]">
                        {section.bullets.map((item, itemIndex) => (
                          <li key={itemIndex} className="pl-0.5 max-w-[65ch]">
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={LINK_CLASS}
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
                      <div className="mt-6 overflow-x-auto rounded-lg border border-[#e0e0e0] bg-[#fafafa]/50">
                        <table className="w-full text-[15px] text-[#666] border-collapse">
                          <thead>
                            <tr className="bg-[#f0f0f0]">
                              {section.table.columns.map((column, columnIndex) => (
                                <th
                                  key={columnIndex}
                                  className="text-left font-semibold px-5 py-3.5 border-b border-[#e0e0e0] text-[#1a1a1a]"
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
                                className={rowIndex % 2 === 1 ? 'bg-[#f5f5f5]/60' : ''}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className={`px-5 py-3.5 border-b border-[#ebebeb] last:border-b-0 align-top ${cellIndex === 0 ? 'font-mono text-[13px] text-[#1a1a1a] whitespace-nowrap' : 'leading-relaxed'}`}
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
