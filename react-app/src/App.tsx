import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { StaticRouter } from 'react-router-dom/server'
import { Layout } from './components/Layout'
import ErrorBoundary from '@shared/components/ErrorBoundary'
import Timeline from './pages/Timeline'
import Newsletter from './pages/Newsletter'
import NewsletterConfirm from './pages/NewsletterConfirm'
import Posts from './pages/Posts'
import Post from './pages/Post'
import Home from './pages/Home'
import SocialMedia from './pages/SocialMedia'
import Songs from './pages/Songs'
import Mcp from './pages/Mcp'
import Consulting from './pages/Consulting'
import Investing from './pages/Investing'
import Wisdom from './pages/Wisdom'
import Schedule from './pages/Schedule'
import NotFound from './pages/NotFound'
import TestError from './pages/TestError'
import {
  defaultLocale,
  nonDefaultLocales,
  type SupportedLocale,
} from './i18n/config'
import { LocaleProvider, useLocale } from './i18n/LocaleContext'
import { localizePath, resolvePreferredLocale, stripLocaleFromPath } from './i18n/routing'

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

function PreferredLocaleAppRoutes() {
  const location = useLocation()
  const preferredLocale = resolvePreferredLocale()

  if (preferredLocale === defaultLocale) {
    return <LocalizedAppRoutes locale={defaultLocale} />
  }

  const target = localizePath(location.pathname || '/', preferredLocale)
  return <Navigate replace to={`${target}${location.search}${location.hash}`} />
}

function LocalizedAppRoutes({ locale }: { locale: SupportedLocale }) {
  return (
    <LocaleProvider locale={locale}>
      <Routes>
        <Route index element={<Layout><Home /></Layout>} />
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
        <Route path="consulting" element={<Layout><Consulting /></Layout>} />
        <Route path="investing" element={<Layout><Investing /></Layout>} />
        <Route path="wisdom" element={<Layout><Wisdom /></Layout>} />
        <Route path="test-error" element={<Layout><TestError /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </LocaleProvider>
  )
}

const routes = (
  <Routes>
    <Route path={`/${defaultLocale}/*`} element={<LegacyEnglishRedirect />} />
    {nonDefaultLocales.map((locale) => (
      <Route key={locale} path={`/${locale}/*`} element={<LocalizedAppRoutes locale={locale} />} />
    ))}
    <Route path="/*" element={<PreferredLocaleAppRoutes />} />
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
