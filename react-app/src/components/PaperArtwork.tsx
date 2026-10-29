import { useId } from 'react'
import hero from '@/assets/neotoma-paper/published/connected-records.svg?raw'
import observation from '@/assets/neotoma-paper/published/synthetic-sources.svg?raw'
import invoice from '@/assets/neotoma-paper/published/current-record.svg?raw'
import tools from '@/assets/neotoma-paper/tools.svg?raw'
import domain from '@/assets/neotoma-paper/published/shared-instance.svg?raw'
import positions from '@/assets/neotoma-paper/published/competing-claims.svg?raw'
import explanation from '@/assets/neotoma-paper/published/explanations-impact.svg?raw'

// Only these committed local exports can become inline markup. Markdown URLs and
// downloaded SVGs never supply HTML, even when their title requests a paper figure.
const artwork = new Map([
  ['/images/posts/neotoma-paper/hero.svg', hero],
  ['/images/posts/neotoma-paper/observation.svg', observation],
  ['/images/posts/neotoma-paper/invoice-example.svg', invoice],
  ['/images/posts/neotoma-paper/tools.svg', tools],
  ['/images/posts/neotoma-paper/vision-domain.svg', domain],
  ['/images/posts/neotoma-paper/vision-positions.svg', positions],
  ['/images/posts/neotoma-paper/vision-explanation.svg', explanation],
])

export function hasPaperArtwork(src: string | undefined): boolean {
  return src != null && artwork.has(src)
}

export function PaperArtwork({ src, alt }: { src: string; alt: string }) {
  const prefix = `essay-${useId().replace(/:/g, '')}`
  const source = artwork.get(src)
  if (!source) return <img src={src} alt={alt} />

  // Every instance needs its own filter, gradient and title IDs after inlining.
  // Prefix only IDs declared in this trusted asset; preserve the authored geometry.
  let svg = source
  // The supplied alternative names every trusted inline scene. Escape it as
  // SVG text before inserting it into the authored title element.
  const name = alt
  const title = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
  svg = svg.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/, (_match, open, close) => `${open}${title}${close}`)
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  for (const id of ids) {
    svg = svg.split(`id="${id}"`).join(`id="${prefix}-${id}"`)
      .split(`url(#${id})`).join(`url(#${prefix}-${id})`)
      .split(`href="#${id}"`).join(`href="#${prefix}-${id}"`)
      .split(`aria-labelledby="${id}"`).join(`aria-labelledby="${prefix}-${id}"`)
  }
  return <div className="essay-paper-art" dangerouslySetInnerHTML={{ __html: svg }} />
}
