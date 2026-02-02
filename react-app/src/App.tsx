import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StaticRouter } from 'react-router-dom/server'
import { Layout } from './components/Layout'
import ErrorBoundary from '@shared/components/ErrorBoundary'
import Timeline from './pages/Timeline'
import Newsletter from './pages/Newsletter'
import NewsletterConfirm from './pages/NewsletterConfirm'
import Posts from './pages/Posts'
import Post from './pages/Post'
import SocialMedia from './pages/SocialMedia'
import Songs from './pages/Songs'
import NotFound from './pages/NotFound'
import TestError from './pages/TestError'

const isDev = import.meta.env.DEV

const routes = (
  <Routes>
    <Route path="/" element={<Layout><Post slug="professional-mission" /></Layout>} />
    <Route path="/timeline" element={<Layout><Timeline /></Layout>} />
    <Route path="/newsletter" element={<Layout><Newsletter /></Layout>} />
    <Route path="/newsletter/confirm" element={<Layout><NewsletterConfirm /></Layout>} />
    <Route path="/posts" element={<Layout><Posts /></Layout>} />
    <Route path="/posts/draft" element={isDev ? <Layout><Posts draft /></Layout> : <Layout><NotFound /></Layout>} />
    <Route path="/posts/:slug" element={<Layout><Post /></Layout>} />
    <Route path="/social" element={<Layout><SocialMedia /></Layout>} />
    <Route path="/songs" element={<Layout><Songs /></Layout>} />
    <Route path="/test-error" element={<Layout><TestError /></Layout>} />
    <Route path="*" element={<Layout><NotFound /></Layout>} />
  </Routes>
)

interface AppProps {
  /** When set, use StaticRouter for server-side rendering */
  url?: string
}

function App({ url }: AppProps) {
  const router = url != null ? (
    <StaticRouter location={url}>{routes}</StaticRouter>
  ) : (
    <BrowserRouter>{routes}</BrowserRouter>
  )
  return <ErrorBoundary>{router}</ErrorBoundary>
}

export default App
