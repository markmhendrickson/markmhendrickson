import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { PostSSRProvider } from './contexts/PostSSRContext'
import { PostsListSSRProvider, getPostsListSSRFromDom } from './contexts/PostsListSSRContext'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

// Hydration: use posts list from SSR script tag so /posts page has data without a client fetch
const ssrPostsList = getPostsListSSRFromDom()

// HelmetProvider must wrap App so Post/Posts <Helmet> has context (entry-client is the actual entry, not main.tsx)
// PostSSRProvider(null) on client so usePostSSR() has a provider; SSR injects postMeta in entry-server
const app = (
  <PostSSRProvider postMeta={null}>
    <PostsListSSRProvider posts={ssrPostsList}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
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
