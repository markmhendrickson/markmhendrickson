import { useLayoutEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './design-study.css'

const surfaces = [
  { label: 'Neotoma essay', path: '/posts/one-place-where-a-fact-is-settled/' },
  { label: 'Design essay', path: '/posts/three-types-of-design/' },
  { label: 'Homepage', path: '/' },
]

// Loaded only by the DEV branch in App. The query makes each comparison shareable,
// with no saved preference, production stylesheet or change to the default design.
export default function DesignStudy() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const choice = params.get('design')
  const active = choice === 'editorial' || choice === 'current'

  useLayoutEffect(() => {
    if (choice === 'editorial') document.documentElement.dataset.designStudy = 'editorial'
    else delete document.documentElement.dataset.designStudy
    return () => { delete document.documentElement.dataset.designStudy }
  }, [choice])

  if (!active) return null

  const href = (design: string, path = location.pathname) => {
    const search = new URLSearchParams(location.search)
    search.set('design', design)
    return `${path}?${search}${path === location.pathname ? location.hash : ''}`
  }

  return (
    <details className="design-study">
      <summary>Design comparison · {choice === 'editorial' ? 'Editorial' : 'Current'}</summary>
      <div className="design-study__panel">
        <p>Local style study. Content and artwork are the same.</p>
        <nav aria-label="Design comparison">
          <div className="design-study__choices">
            <Link to={href('current')} aria-current={choice === 'current' ? 'true' : undefined}>Current</Link>
            <Link to={href('editorial')} aria-current={choice === 'editorial' ? 'true' : undefined}>Editorial</Link>
          </div>
          <div className="design-study__surfaces">
            {surfaces.map(({ label, path }) => (
              <Link key={path} to={href(choice, path)} aria-current={location.pathname.replace(/\/$/, '') === path.replace(/\/$/, '') ? 'page' : undefined}>{label}</Link>
            ))}
          </div>
        </nav>
      </div>
    </details>
  )
}
