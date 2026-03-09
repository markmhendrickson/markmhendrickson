import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Mcp from './pages/Mcp'
import Schedule from './pages/Schedule'
import NotFound from './pages/NotFound'
import TestError from './pages/TestError'
import { defaultLocale, type SupportedLocale } from './i18n/config'
import { LocaleProvider, useLocale } from './i18n/LocaleContext'
import { localizePath, stripLocaleFromPath } from './i18n/routing'

const isDev = import.meta.env.DEV

function RedirectToLocalizedHome() {
  const { locale } = useLocale()
  return <Navigate to={localizePath('/', locale)} replace />
}

function RedirectToLocalizedMeet() {
  const { locale } = useLocale()
  return <Navigate to={localizePath('/meet', locale)} replace />
}

function LegacyEnglishRedirect() {
  const location = useLocation()
  const target = stripLocaleFromPath(location.pathname || '/')
  return <Navigate replace to={`${target}${location.search}${location.hash}`} />
}

function LocalizedAppRoutes({ locale }: { locale: SupportedLocale }) {
  return (
    <LocaleProvider locale={locale}>
      <Routes>
        <Route index element={<Layout><Post slug="professional-mission" /></Layout>} />
        <Route path="about" element={<Navigate to={localizePath('/', locale)} replace />} />
        <Route path="timeline" element={<Layout><Timeline /></Layout>} />
        <Route path="newsletter" element={<Layout><Newsletter /></Layout>} />
        <Route path="newsletter/confirm" element={<Layout><NewsletterConfirm /></Layout>} />
        <Route path="posts" element={<Layout><Posts /></Layout>} />
        <Route path="posts/draft" element={isDev ? <Layout><Posts draft /></Layout> : <Layout><NotFound /></Layout>} />
        <Route path="posts/:slug" element={<Layout><Post /></Layout>} />
        <Route path="links" element={<Layout><SocialMedia /></Layout>} />
        <Route path="meet" element={<Layout><Schedule /></Layout>} />
        <Route path="schedule" element={<Navigate to={localizePath('/meet', locale)} replace />} />
        <Route path="songs" element={<Layout><Songs /></Layout>} />
        <Route path="agent" element={<Layout><Mcp /></Layout>} />
        <Route path="test-error" element={<Layout><TestError /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </LocaleProvider>
  )
}

const routes = (
  <Routes>
    <Route path="/en/*" element={<LegacyEnglishRedirect />} />
    <Route path="/es/*" element={<LocalizedAppRoutes locale="es" />} />
    <Route path="/ca/*" element={<LocalizedAppRoutes locale="ca" />} />
    <Route path="/*" element={<LocalizedAppRoutes locale={defaultLocale} />} />
  </Routes>
)

interface AppProps {
  /** When set, use StaticRouter for server-side rendering */
  url?: string
}

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

function App({ url }: AppProps) {
  const router = url != null ? (
    <StaticRouter location={url}>{routes}</StaticRouter>
  ) : (
    <BrowserRouter future={routerFuture}>{routes}</BrowserRouter>
  )
  return <ErrorBoundary>{router}</ErrorBoundary>
}

export default App
