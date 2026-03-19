import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { PostSSRProvider } from './contexts/PostSSRContext'
import { PostsListSSRProvider, getPostsListSSRFromDom } from './contexts/PostsListSSRContext'
import { AgentSSRProvider, getAgentSSRFromDom } from './contexts/AgentSSRContext'
import { SongsSSRProvider, getSongsSSRFromDom } from './contexts/SongsSSRContext'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

// Hydration: use SSR script tags so /posts, /agent, /songs have data without client fetch
const ssrPostsList = getPostsListSSRFromDom()
const ssrAgentContent = getAgentSSRFromDom()
const ssrSongs = getSongsSSRFromDom()

// HelmetProvider must wrap App so Post/Posts <Helmet> have context (entry-client is the actual entry, not main.tsx)
// PostSSRProvider(null) on client so usePostSSR() has a provider; SSR injects postMeta in entry-server
const app = (
  <PostSSRProvider postMeta={null}>
    <PostsListSSRProvider posts={ssrPostsList}>
      <AgentSSRProvider content={ssrAgentContent}>
        <SongsSSRProvider songs={ssrSongs}>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </SongsSSRProvider>
      </AgentSSRProvider>
    </PostsListSSRProvider>
  </PostSSRProvider>
)
// Hydrate when server-rendered HTML replaced the placeholder; otherwise render (SPA dev without server)
const hasServerContent = rootEl.hasChildNodes() && !rootEl.innerHTML.includes('<!--ssr-outlet-->')
if (hasServerContent) {
  ReactDOM.hydrateRoot(rootEl, app)
} else {
  ReactDOM.createRoot(rootEl).render(app)
}
