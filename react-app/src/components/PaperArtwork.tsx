import { useEffect, useId, useState } from 'react'
import hero from '@/assets/neotoma-paper/hero.svg?raw'
import observation from '@/assets/neotoma-paper/observation.svg?raw'
import invoice from '@/assets/neotoma-paper/invoice-example.svg?raw'
import tools from '@/assets/neotoma-paper/tools.svg?raw'
import domain from '@/assets/neotoma-paper/vision-domain.svg?raw'
import positions from '@/assets/neotoma-paper/vision-positions.svg?raw'
import explanation from '@/assets/neotoma-paper/vision-explanation.svg?raw'

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
  const [proof, setProof] = useState<{ src: string; svg: string } | null>(null)
  const wantsProof = import.meta.env.DEV && typeof window !== 'undefined' &&
    ['/images/posts/neotoma-paper/invoice-example.svg','/images/posts/neotoma-paper/hero.svg','/images/posts/neotoma-paper/observation.svg','/images/posts/neotoma-paper/vision-domain.svg','/images/posts/neotoma-paper/vision-positions.svg','/images/posts/neotoma-paper/vision-explanation.svg'].includes(src) &&
    new URLSearchParams(window.location?.search || '').get('visual') === 'overhead-proof'
  useEffect(() => {
    if (!import.meta.env.DEV || !wantsProof) { setProof(null); return }
    let active = true
    const load = src === '/images/posts/neotoma-paper/vision-domain.svg' ? import('../dev/overhead-record/governedCollaborationProof.svg?raw') :
      src === '/images/posts/neotoma-paper/vision-positions.svg' ? import('../dev/overhead-record/competingClaimsProof.svg?raw') :
      src === '/images/posts/neotoma-paper/vision-explanation.svg' ? import('../dev/overhead-record/explanationsImpactProof.svg?raw') :
      src === '/images/posts/neotoma-paper/hero.svg' ? import('../dev/overhead-record/connectedRecordsProof.svg?raw') :
      src === '/images/posts/neotoma-paper/observation.svg' ? import('../dev/overhead-record/syntheticSourcesProof.svg?raw') :
      import('../dev/overhead-record/invoice.svg?raw')
    void load.then(({ default: svg }) => {
      if (active) setProof({ src, svg })
    }).catch(() => { if (active) setProof(null) })
    return () => { active = false }
  }, [wantsProof, src])
  const selectedProof = wantsProof && proof?.src === src ? proof.svg : null
  const source = selectedProof ?? artwork.get(src)
  if (!source) return <img src={src} alt={alt} />

  // Every instance needs its own filter, gradient and title IDs after inlining.
  // Prefix only IDs declared in this trusted asset; preserve the authored geometry.
  let svg = source
  // The supplied alternative names every trusted inline scene. Escape it as
  // SVG text before inserting it into the authored title element.
  const name = selectedProof ? (src.endsWith('/vision-domain.svg') ? 'A person and an authorized agent reach the same shared record in one Neotoma instance.' : src.endsWith('/vision-positions.svg') ? 'Two conflicting due-date claims remain visible, and a separate decision adopts the later date.' : src.endsWith('/vision-explanation.svg') ? 'A current due date rests on source evidence and authority; its change reaches a schedule and task, while an unrelated amount remains outside the impact path.' : src.endsWith('/hero.svg') ? 'Distinct paper records for a person, invoice and follow-up task connect while retaining their own forms and evidence.' : src.endsWith('/observation.svg') ? 'An original invoice and a later email feed two retained observations before a current record is selected.' : 'An overhead invoice proof: the original invoice and email feed two retained observations; the current amount follows the invoice and the current due date follows the email.') : alt
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
