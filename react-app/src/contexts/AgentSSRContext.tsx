import React from 'react'

export interface AgentContentSSR {
  title: string
  subtitle: string
  description: string
  mcpServerRepoUrl?: string
  sections: Array<{
    heading: string
    paragraphs: string[]
    bullets?: Array<{ text: string; url?: string }>
    table?: { columns: string[]; rows: string[][] }
  }>
}

const AgentSSRContext = React.createContext<AgentContentSSR | null>(null)

const SCRIPT_ID = 'agent-ssr-data'

export function AgentSSRProvider({
  content,
  children,
}: {
  content: AgentContentSSR | null
  children: React.ReactNode
}) {
  return (
    <AgentSSRContext.Provider value={content}>
      {content != null && (
        <script
          type="application/json"
          id={SCRIPT_ID}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(content) }}
        />
      )}
      {children}
    </AgentSSRContext.Provider>
  )
}

export function useAgentSSR(): AgentContentSSR | null {
  return React.useContext(AgentSSRContext)
}

export function getAgentSSRFromDom(): AgentContentSSR | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById(SCRIPT_ID)
  if (!el?.textContent) return null
  try {
    return JSON.parse(el.textContent) as AgentContentSSR
  } catch {
    return null
  }
}
