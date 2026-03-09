import React, { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'

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
  'text-foreground underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground'

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
  const { locale } = useLocale()
  const pageCopy = {
    en: {
      fallbackTitle: 'Agent',
      fallbackDesc: 'Have your agent talk to my agent.',
      loadError: 'Could not load agent page',
      ensureAvailable: 'Ensure this URL is available',
      loading: 'Loading...',
    },
    es: {
      fallbackTitle: 'Agente',
      fallbackDesc: 'Haz que tu agente hable con mi agente.',
      loadError: 'No se pudo cargar la página de agente',
      ensureAvailable: 'Asegúrate de que esta URL esté disponible',
      loading: 'Cargando...',
    },
    ca: {
      fallbackTitle: 'Agent',
      fallbackDesc: "Fes que el teu agent parli amb el meu agent.",
      loadError: "No s'ha pogut carregar la pàgina d'agent",
      ensureAvailable: 'Assegura que aquesta URL estigui disponible',
      loading: 'Carregant...',
    },
  } as const
  const text = pageCopy[locale]
  const agentJsonUrl = import.meta.env.DEV
    ? `/api/agent${locale === 'en' ? '' : `.${locale}`}.json`
    : `${SITE_BASE}/api/agent${locale === 'en' ? '' : `.${locale}`}.json`
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
    fetch(agentJsonUrl)
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
  }, [agentJsonUrl])

  const canonicalUrl = `${SITE_BASE}${localizePath('/agent', locale)}`
  const pageTitle = content ? `${content.title} — Mark Hendrickson` : `${text.fallbackTitle} — Mark Hendrickson`
  const pageDesc = content?.description ?? text.fallbackDesc

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
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
            <p className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed mb-4" role="alert">
              {text.loadError}: {error}. {text.ensureAvailable}: {agentJsonUrl}.
            </p>
          )}
          {!content && !error && (
            <p className="text-[15px] text-muted-foreground dark:text-foreground/80">{text.loading}</p>
          )}
          {content && (
            <article className="agent-page">
              <header className="mb-16">
                <h1 className="text-[28px] font-medium mb-2 tracking-tight text-foreground">
                  {content.title}
                </h1>
                <p className="text-[17px] text-muted-foreground dark:text-foreground/80 font-normal tracking-wide max-w-[32rem]">
                  {content.subtitle}
                </p>
              </header>

              <div className="space-y-16">
                {content.sections.map((section, index) => (
                  <section key={index} className="space-y-5">
                    <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                      {section.heading}
                    </h2>
                    <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed space-y-4">
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
                      <ul className="mt-1 list-disc pl-6 space-y-2 text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed marker:text-muted-foreground dark:marker:text-foreground/70">
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
                      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-muted/30">
                        <table className="w-full text-[15px] text-muted-foreground dark:text-foreground/80 border-collapse">
                          <thead>
                            <tr className="bg-muted/50">
                              {section.table.columns.map((column, columnIndex) => (
                                <th
                                  key={columnIndex}
                                  className="text-left font-semibold px-5 py-3.5 border-b border-border text-foreground"
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
                                className={`${rowIndex % 2 === 1 ? 'bg-muted/30' : ''} ${rowIndex === section.table.rows.length - 1 ? '[&>td]:border-b-0' : ''}`.trim()}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className={`px-5 py-3.5 border-b border-border align-top ${cellIndex === 0 ? 'font-mono text-[13px] text-foreground whitespace-nowrap' : 'leading-relaxed'}`}
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
