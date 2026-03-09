import { Helmet } from 'react-helmet-async'
import timelineData from '@cache/timeline.json'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'

interface TimelineItem {
  role: string
  company: string
  date: string
  description: string[]
}

const timeline = timelineData as TimelineItem[]
const SITE_BASE = 'https://markmhendrickson.com'
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

function localizeTimelineItem(item: TimelineItem, locale: 'en' | 'es' | 'ca'): TimelineItem {
  if (locale === 'en') return item
  const roleMap: Record<string, { es: string; ca: string }> = {
    Founder: { es: 'Fundador', ca: 'Fundador' },
    'General Manager': { es: 'Director General', ca: 'Director General' },
    'Product Lead': { es: 'Líder de Producto', ca: 'Líder de Producte' },
    'Product Manager, Designer and Developer': { es: 'Product Manager, Diseñador y Desarrollador', ca: 'Product Manager, Dissenyador i Desenvolupador' },
    'Head of Product and Co-Founder': { es: 'Head of Product y Cofundador', ca: 'Head of Product i Cofundador' },
    'CEO and Co-Founder': { es: 'CEO y Cofundador', ca: 'CEO i Cofundador' },
    'Project Manager, Designer and Writer': { es: 'Project Manager, Diseñador y Redactor', ca: 'Project Manager, Dissenyador i Redactor' },
    'Network Engineer': { es: 'Ingeniero de Redes', ca: 'Enginyer de Xarxes' },
    'Web Designer & Developer': { es: 'Diseñador y Desarrollador Web', ca: 'Dissenyador i Desenvolupador Web' },
    'BA, Government & Economics': { es: 'Licenciatura, Gobierno y Economía', ca: 'Grau, Govern i Economia' },
    'High School': { es: 'Secundaria', ca: 'Batxillerat' },
  }
  const dateMap: Record<string, { es: string; ca: string }> = {
    '2025 – Present · Barcelona, Spain': { es: '2025 – Actualidad · Barcelona, España', ca: '2025 – Actualitat · Barcelona, Espanya' },
    '2022 – 2025 · Barcelona, Spain': { es: '2022 – 2025 · Barcelona, España', ca: '2022 – 2025 · Barcelona, Espanya' },
    '2018 – 2022 · Barcelona, Spain': { es: '2018 – 2022 · Barcelona, España', ca: '2018 – 2022 · Barcelona, Espanya' },
    '2015 – 2018 · Barcelona, Spain': { es: '2015 – 2018 · Barcelona, España', ca: '2015 – 2018 · Barcelona, Espanya' },
    '2009 – 2011 · San Francisco, California': { es: '2009 – 2011 · San Francisco, California', ca: '2009 – 2011 · San Francisco, Califòrnia' },
    '2007 – 2009 · Atherton, California': { es: '2007 – 2009 · Atherton, California', ca: '2007 – 2009 · Atherton, Califòrnia' },
    '2003 – 2007 · Brunswick, Maine': { es: '2003 – 2007 · Brunswick, Maine', ca: '2003 – 2007 · Brunswick, Maine' },
    '1997 – 2007 · Menlo Park, California and Brunswick, Maine': { es: '1997 – 2007 · Menlo Park, California y Brunswick, Maine', ca: '1997 – 2007 · Menlo Park, Califòrnia i Brunswick, Maine' },
    '1999 – 2003 · Atherton, California': { es: '1999 – 2003 · Atherton, California', ca: '1999 – 2003 · Atherton, Califòrnia' },
  }
  const descriptionMap: Record<string, { es: string; ca: string }> = {
    'Building Neotoma, a truth layer for AI memory, and Ateles, a sovereign agentic operating system for personal workflow automation.': {
      es: 'Construyendo Neotoma, una capa de verdad para memoria de IA, y Ateles, un sistema operativo agéntico soberano para automatización de workflows personales.',
      ca: "Construint Neotoma, una capa de veritat per a memòria d'IA, i Ateles, un sistema operatiu agèntic sobirà per a automatització de workflows personals.",
    },
    'Focused on schema-first design, event-sourced memory, and deterministic workflows that restore sovereignty and autonomy to individuals.': {
      es: 'Enfocado en diseño schema-first, memoria event-sourced y workflows deterministas que devuelven soberanía y autonomía a las personas.',
      ca: "Enfocat en disseny schema-first, memòria event-sourced i workflows deterministes que retornen sobirania i autonomia a les persones.",
    },
    'Led Leather, a Bitcoin wallet and subsidiary of Trust Machines focused on driving the global transition to a digital economy built on Bitcoin.': {
      es: 'Lideré Leather, una wallet de Bitcoin y subsidiaria de Trust Machines enfocada en impulsar la transición global hacia una economía digital construida sobre Bitcoin.',
      ca: 'Vaig liderar Leather, una wallet de Bitcoin i subsidiària de Trust Machines centrada en impulsar la transició global cap a una economia digital construïda sobre Bitcoin.',
    },
    "Led user experience for products that protect individuals' freedom online by securing digital ownership and privacy using the Stacks blockchain.": {
      es: 'Lideré la experiencia de usuario para productos que protegen la libertad online de las personas asegurando propiedad digital y privacidad con la blockchain de Stacks.',
      ca: "Vaig liderar l'experiència d'usuari per a productes que protegeixen la llibertat online de les persones assegurant propietat digital i privacitat amb la blockchain d'Stacks.",
    },
    'Worked with early-stage startups including Digit (acquired by Oportun), First Opinion (acquired by Curai), and STYLEBEE on product-market fit and measurable growth.': {
      es: 'Trabajé con startups en fase temprana, incluyendo Digit (adquirida por Oportun), First Opinion (adquirida por Curai) y STYLEBEE, en product-market fit y crecimiento medible.',
      ca: "Vaig treballar amb startups en fase inicial, incloent Digit (adquirida per Oportun), First Opinion (adquirida per Curai) i STYLEBEE, en product-market fit i creixement mesurable.",
    },
    'Led product design and development for a web and mobile marketplace connecting brands and agencies with emerging technologies.': {
      es: 'Lideré el diseño y desarrollo de producto para un marketplace web y móvil que conectaba marcas y agencias con tecnologías emergentes.',
      ca: 'Vaig liderar el disseny i desenvolupament de producte per a un marketplace web i mòbil que connectava marques i agències amb tecnologies emergents.',
    },
    'Led product design for Lift, an iPhone app with web companion for tracking and improving daily habits.': {
      es: 'Lideré el diseño de producto de Lift, una app de iPhone con complemento web para seguir y mejorar hábitos diarios.',
      ca: "Vaig liderar el disseny de producte de Lift, una app d'iPhone amb complement web per seguir i millorar hàbits diaris.",
    },
    'Co-founded and ran Plancast, a social event discovery service.': {
      es: 'Cofundé y dirigí Plancast, un servicio social de descubrimiento de eventos.',
      ca: "Vaig cofundar i dirigir Plancast, un servei social de descobriment d'esdeveniments.",
    },
    'Led product development, programmed the application, and designed the frontend; acquired by Active Network in 2012.': {
      es: 'Lideré el desarrollo de producto, programé la aplicación y diseñé el frontend; adquirida por Active Network en 2012.',
      ca: 'Vaig liderar el desenvolupament de producte, vaig programar l’aplicació i vaig dissenyar el frontend; adquirida per Active Network el 2012.',
    },
    'Led efforts to redesign Crunchbase and the TechCrunch blog network while writing over 500 articles about new web technologies. TechCrunch acquired by AOL in 2010; Crunchbase spun out from AOL as an independent company in 2015.': {
      es: 'Lideré la renovación de Crunchbase y de la red de blogs de TechCrunch mientras escribía más de 500 artículos sobre nuevas tecnologías web. TechCrunch fue adquirida por AOL en 2010; Crunchbase se separó de AOL como empresa independiente en 2015.',
      ca: "Vaig liderar la renovació de Crunchbase i de la xarxa de blogs de TechCrunch mentre escrivia més de 500 articles sobre noves tecnologies web. TechCrunch va ser adquirida per AOL el 2010; Crunchbase es va separar d'AOL com a empresa independent el 2015.",
    },
    'Upgraded and maintained a campus-wide network for student body and faculty.': {
      es: 'Actualicé y mantuve una red de campus para estudiantes y profesorado.',
      ca: "Vaig actualitzar i mantenir una xarxa de campus per a estudiants i professorat.",
    },
    'Designed and developed web projects for small businesses, non-profits, student organizations, and Bowdoin College.': {
      es: 'Diseñé y desarrollé proyectos web para pequeñas empresas, organizaciones sin ánimo de lucro, asociaciones estudiantiles y Bowdoin College.',
      ca: "Vaig dissenyar i desenvolupar projectes web per a petites empreses, organitzacions sense ànim de lucre, associacions d'estudiants i Bowdoin College.",
    },
    'Double major with coursework in classical and modern political theory, constitutional and international law, and economics.': {
      es: 'Doble especialización con cursos en teoría política clásica y moderna, derecho constitucional e internacional y economía.',
      ca: 'Doble especialització amb cursos en teoria política clàssica i moderna, dret constitucional i internacional i economia.',
    },
    "Awarded summa cum laude for honors thesis examining Nietzsche's theory of morality across Human, All Too Human, Daybreak, and On the Genealogy of Morals, and its relationship to Schopenhauer and Rée.": {
      es: 'Graduado summa cum laude por una tesis de honor que examina la teoría de la moral de Nietzsche en Human, All Too Human, Daybreak y On the Genealogy of Morals, y su relación con Schopenhauer y Rée.',
      ca: "Graduat summa cum laude per una tesi d'honor que examina la teoria de la moral de Nietzsche a Human, All Too Human, Daybreak i On the Genealogy of Morals, i la seva relació amb Schopenhauer i Rée.",
    },
  }
  const role = roleMap[item.role]?.[locale] ?? item.role
  const date = dateMap[item.date]?.[locale] ?? item.date
  const description = item.description.map((line) => descriptionMap[line]?.[locale] ?? line)
  return { ...item, role, date, description }
}

export default function Timeline() {
  const { locale } = useLocale()
  const copy = {
    en: { title: 'Timeline', desc: 'Career and education history' },
    es: { title: 'Trayectoria', desc: 'Trayectoria profesional y educativa' },
    ca: { title: 'Trajectòria', desc: 'Trajectòria professional i educativa' },
  } as const
  const pageCopy = copy[locale]
  const pageTitle = `${pageCopy.title} — Mark Hendrickson`
  const pageDesc = pageCopy.desc
  const canonicalUrl = `${SITE_BASE}${localizePath('/timeline', locale)}`
  const localizedTimeline = timeline.map((item) => localizeTimelineItem(item, locale))
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta name="twitter:image:height" content={String(OG_IMAGE_HEIGHT)} />
      </Helmet>
      <div className="flex justify-center items-center min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
        <div className="max-w-[600px] w-full">
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">{pageCopy.title}</h1>
          <div className="w-full text-[17px] text-muted-foreground dark:text-foreground/80 mb-12 font-normal tracking-wide">
            {pageCopy.desc}
          </div>

          <div className="mt-12 mb-12">
            {localizedTimeline.map((item, index) => (
              <div key={index} className="mb-16 relative pl-6 last:mb-0">
                <div className="absolute left-0 top-[0.7em] w-1.5 h-1.5 rounded-full bg-foreground transform -translate-y-1/2"></div>
                {index < localizedTimeline.length - 1 && (
                  <div className="absolute left-[2.5px] top-4 w-px bg-border" style={{ height: 'calc(100% + 1rem)' }}></div>
                )}
                <div className="text-[15px] font-medium mb-1">{item.role}</div>
                <div className="text-[15px] text-muted-foreground dark:text-foreground/80 mb-1">{item.company}</div>
                <div className="text-[13px] text-muted-foreground dark:text-foreground/80 mb-2">{item.date}</div>
                {item.description.length > 0 && (
                  <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed">
                    {item.description.map((desc, i) => (
                      <p key={i} className={i < item.description.length - 1 ? 'mb-3' : ''}>{desc}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
