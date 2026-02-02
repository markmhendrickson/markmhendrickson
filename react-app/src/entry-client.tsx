import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'

// GA4: load gtag when measurement ID is set (e.g. VITE_GA_MEASUREMENT_ID at build time)
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
if (gaId && typeof document !== 'undefined') {
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(s)
  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date().toISOString())
  window.gtag('config', gaId, { send_page_view: true })
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

// HelmetProvider must wrap App so Post/Posts <Helmet> has context (entry-client is the actual entry, not main.tsx)
const app = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
)
// Hydrate when server-rendered HTML replaced the placeholder; otherwise render (SPA dev without server)
const hasServerContent = rootEl.hasChildNodes() && !rootEl.innerHTML.includes('<!--ssr-outlet-->')
if (hasServerContent) {
  ReactDOM.hydrateRoot(rootEl, app)
} else {
  ReactDOM.createRoot(rootEl).render(app)
}
