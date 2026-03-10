import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import timelineData from '@cache/timeline.json'
import timelineProjectLinks from '@/data/timeline_project_links.json'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales, type SupportedLocale } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'

interface TimelineItem {
  role: string
  company: string
  date: string
  description: string[]
}

interface TimelineProjectLink {
  company: string
  url?: string
  postSlug?: string
}

const projectLinkByCompany = (timelineProjectLinks as TimelineProjectLink[]).reduce(
  (acc, entry) => {
    acc.set(entry.company, { url: entry.url, postSlug: entry.postSlug })
    return acc
  },
  new Map<string, { url?: string; postSlug?: string }>()
)

const timeline = timelineData as TimelineItem[]
const SITE_BASE = 'https://markmhendrickson.com'
const LINK_CLASS = 'underline underline-offset-2 decoration-muted-foreground/70 hover:decoration-foreground focus:outline-none focus:decoration-foreground'

function descriptionWithCrunchbaseLink(text: string): React.ReactNode {
  const idx = text.indexOf('Crunchbase')
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const after = text.slice(idx + 'Crunchbase'.length)
  return (
    <>
      {before}
      <a href="https://www.crunchbase.com" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        Crunchbase
      </a>
      {after}
    </>
  )
}
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

function localizeTimelineItem(item: TimelineItem, locale: SupportedLocale): TimelineItem {
  if (locale === 'en') return item
  const roleMap: Record<string, { es: string; ca: string; zh: string }> = {
    Founder: { es: 'Fundador', ca: 'Fundador', zh: '创始人' },
    'General Manager': { es: 'Director General', ca: 'Director General', zh: '总经理' },
    'Product Lead': { es: 'Líder de Producto', ca: 'Líder de Producte', zh: '产品负责人' },
    'Product Manager, Designer and Developer': { es: 'Product Manager, Diseñador y Desarrollador', ca: 'Product Manager, Dissenyador i Desenvolupador', zh: '产品经理、设计师与开发者' },
    'Head of Product and Co-Founder': { es: 'Head of Product y Cofundador', ca: 'Head of Product i Cofundador', zh: '产品负责人兼联合创始人' },
    'CEO and Co-Founder': { es: 'CEO y Cofundador', ca: 'CEO i Cofundador', zh: '首席执行官兼联合创始人' },
    'Project Manager, Designer and Writer': { es: 'Project Manager, Diseñador y Redactor', ca: 'Project Manager, Dissenyador i Redactor', zh: '项目经理、设计师与撰稿人' },
    'Network Engineer': { es: 'Ingeniero de Redes', ca: 'Enginyer de Xarxes', zh: '网络工程师' },
    'Web Designer & Developer': { es: 'Diseñador y Desarrollador Web', ca: 'Dissenyador i Desenvolupador Web', zh: '网页设计师与开发者' },
    'BA, Government & Economics': { es: 'Licenciatura, Gobierno y Economía', ca: 'Grau, Govern i Economia', zh: '政府与经济学学士' },
    'High School': { es: 'Secundaria', ca: 'Batxillerat', zh: '高中' },
  }
  const dateMap: Record<string, { es: string; ca: string; zh: string }> = {
    '2025 – Present · Barcelona, Spain': { es: '2025 – Actualidad · Barcelona, España', ca: '2025 – Actualitat · Barcelona, Espanya', zh: '2025 – 至今 · 西班牙巴塞罗那' },
    '2022 – 2025 · Barcelona, Spain': { es: '2022 – 2025 · Barcelona, España', ca: '2022 – 2025 · Barcelona, Espanya', zh: '2022 – 2025 · 西班牙巴塞罗那' },
    '2018 – 2022 · Barcelona, Spain': { es: '2018 – 2022 · Barcelona, España', ca: '2018 – 2022 · Barcelona, Espanya', zh: '2018 – 2022 · 西班牙巴塞罗那' },
    '2015 – 2018 · Barcelona, Spain': { es: '2015 – 2018 · Barcelona, España', ca: '2015 – 2018 · Barcelona, Espanya', zh: '2015 – 2018 · 西班牙巴塞罗那' },
    '2009 – 2011 · San Francisco, California': { es: '2009 – 2011 · San Francisco, California', ca: '2009 – 2011 · San Francisco, Califòrnia', zh: '2009 – 2011 · 加州旧金山' },
    '2007 – 2009 · Atherton, California': { es: '2007 – 2009 · Atherton, California', ca: '2007 – 2009 · Atherton, Califòrnia', zh: '2007 – 2009 · 加州阿瑟顿' },
    '2003 – 2007 · Brunswick, Maine': { es: '2003 – 2007 · Brunswick, Maine', ca: '2003 – 2007 · Brunswick, Maine', zh: '2003 – 2007 · 缅因州布伦瑞克' },
    '1997 – 2007 · Menlo Park, California and Brunswick, Maine': { es: '1997 – 2007 · Menlo Park, California y Brunswick, Maine', ca: '1997 – 2007 · Menlo Park, Califòrnia i Brunswick, Maine', zh: '1997 – 2007 · 加州门洛帕克与缅因州布伦瑞克' },
    '1999 – 2003 · Atherton, California': { es: '1999 – 2003 · Atherton, California', ca: '1999 – 2003 · Atherton, Califòrnia', zh: '1999 – 2003 · 加州阿瑟顿' },
  }
  const descriptionMap: Record<string, { es: string; ca: string; zh: string }> = {
    'Building Neotoma, a truth layer for AI memory, and Ateles, a sovereign agentic operating system for personal workflow automation.': {
      es: 'Construyendo Neotoma, una capa de verdad para memoria de IA, y Ateles, un sistema operativo agéntico soberano para automatización de workflows personales.',
      ca: "Construint Neotoma, una capa de veritat per a memòria d'IA, i Ateles, un sistema operatiu agèntic sobirà per a automatització de workflows personals.",
      zh: '正在构建 Neotoma（AI 记忆的真相层）和 Ateles（用于个人工作流自动化的主权代理操作系统）。',
    },
    'Focused on schema-first design, event-sourced memory, and deterministic workflows that restore sovereignty and autonomy to individuals.': {
      es: 'Enfocado en diseño schema-first, memoria event-sourced y workflows deterministas que devuelven soberanía y autonomía a las personas.',
      ca: "Enfocat en disseny schema-first, memòria event-sourced i workflows deterministes que retornen sobirania i autonomia a les persones.",
      zh: '专注于 schema-first 设计、事件溯源记忆和确定性工作流，以恢复个体的主权与自主性。',
    },
    'Led Leather, a Bitcoin wallet and subsidiary of Trust Machines focused on driving the global transition to a digital economy built on Bitcoin.': {
      es: 'Lideré Leather, una wallet de Bitcoin y subsidiaria de Trust Machines enfocada en impulsar la transición global hacia una economía digital construida sobre Bitcoin.',
      ca: 'Vaig liderar Leather, una wallet de Bitcoin i subsidiària de Trust Machines centrada en impulsar la transició global cap a una economia digital construïda sobre Bitcoin.',
      zh: '领导了 Leather（Trust Machines 旗下比特币钱包），推动全球向建立在比特币之上的数字经济转型。',
    },
    "Led user experience for products that protect individuals' freedom online by securing digital ownership and privacy using the Stacks blockchain.": {
      es: 'Lideré la experiencia de usuario para productos que protegen la libertad online de las personas asegurando propiedad digital y privacidad con la blockchain de Stacks.',
      ca: "Vaig liderar l'experiència d'usuari per a productes que protegeixen la llibertat online de les persones assegurant propietat digital i privacitat amb la blockchain d'Stacks.",
      zh: '负责产品用户体验，通过 Stacks 区块链保障数字所有权与隐私，保护个人在线自由。',
    },
    'Worked with early-stage startups including Digit (acquired by Oportun), First Opinion (acquired by Curai), and STYLEBEE on product-market fit and measurable growth.': {
      es: 'Trabajé con startups en fase temprana, incluyendo Digit (adquirida por Oportun), First Opinion (adquirida por Curai) y STYLEBEE, en product-market fit y crecimiento medible.',
      ca: "Vaig treballar amb startups en fase inicial, incloent Digit (adquirida per Oportun), First Opinion (adquirida per Curai) i STYLEBEE, en product-market fit i creixement mesurable.",
      zh: '与早期初创公司合作（包括 Digit、First Opinion 和 STYLEBEE），聚焦 PMF 与可衡量增长。',
    },
    'Led product design and development for a web and mobile marketplace connecting brands and agencies with emerging technologies.': {
      es: 'Lideré el diseño y desarrollo de producto para un marketplace web y móvil que conectaba marcas y agencias con tecnologías emergentes.',
      ca: 'Vaig liderar el disseny i desenvolupament de producte per a un marketplace web i mòbil que connectava marques i agències amb tecnologies emergents.',
      zh: '领导了一个连接品牌与机构及新兴技术的 Web/移动端市场产品设计与开发。',
    },
    'Led product design for Lift, an iPhone app with web companion for tracking and improving daily habits.': {
      es: 'Lideré el diseño de producto de Lift, una app de iPhone con complemento web para seguir y mejorar hábitos diarios.',
      ca: "Vaig liderar el disseny de producte de Lift, una app d'iPhone amb complement web per seguir i millorar hàbits diaris.",
      zh: '负责 Lift 的产品设计：一款用于追踪并改善日常习惯的 iPhone 应用（含 Web 配套）。',
    },
    'Co-founded and ran Plancast, a social event discovery service.': {
      es: 'Cofundé y dirigí Plancast, un servicio social de descubrimiento de eventos.',
      ca: "Vaig cofundar i dirigir Plancast, un servei social de descobriment d'esdeveniments.",
      zh: '联合创办并运营 Plancast（社交活动发现服务）。',
    },
    'Led product development, programmed the application, and designed the frontend; acquired by Active Network in 2012.': {
      es: 'Lideré el desarrollo de producto, programé la aplicación y diseñé el frontend; adquirida por Active Network en 2012.',
      ca: 'Vaig liderar el desenvolupament de producte, vaig programar l’aplicació i vaig dissenyar el frontend; adquirida per Active Network el 2012.',
      zh: '主导产品开发、应用编程与前端设计；公司于 2012 年被 Active Network 收购。',
    },
    'Led efforts to redesign Crunchbase and the TechCrunch blog network while writing over 500 articles about new web technologies. TechCrunch acquired by AOL in 2010; Crunchbase spun out from AOL as an independent company in 2015.': {
      es: 'Lideré la renovación de Crunchbase y de la red de blogs de TechCrunch mientras escribía más de 500 artículos sobre nuevas tecnologías web. TechCrunch fue adquirida por AOL en 2010; Crunchbase se separó de AOL como empresa independiente en 2015.',
      ca: "Vaig liderar la renovació de Crunchbase i de la xarxa de blogs de TechCrunch mentre escrivia més de 500 articles sobre noves tecnologies web. TechCrunch va ser adquirida per AOL el 2010; Crunchbase es va separar d'AOL com a empresa independent el 2015.",
      zh: '主导了 Crunchbase 与 TechCrunch 博客网络改版，并撰写了 500 多篇新 Web 技术文章。TechCrunch 于 2010 年被 AOL 收购；Crunchbase 于 2015 年从 AOL 分拆为独立公司。',
    },
    'Upgraded and maintained a campus-wide network for student body and faculty.': {
      es: 'Actualicé y mantuve una red de campus para estudiantes y profesorado.',
      ca: "Vaig actualitzar i mantenir una xarxa de campus per a estudiants i professorat.",
      zh: '升级并维护了覆盖全校师生的校园网络。',
    },
    'Designed and developed web projects for small businesses, non-profits, student organizations, and Bowdoin College.': {
      es: 'Diseñé y desarrollé proyectos web para pequeñas empresas, organizaciones sin ánimo de lucro, asociaciones estudiantiles y Bowdoin College.',
      ca: "Vaig dissenyar i desenvolupar projectes web per a petites empreses, organitzacions sense ànim de lucre, associacions d'estudiants i Bowdoin College.",
      zh: '为小型企业、非营利组织、学生组织及 Bowdoin College 设计并开发 Web 项目。',
    },
    'Double major with coursework in classical and modern political theory, constitutional and international law, and economics.': {
      es: 'Doble especialización con cursos en teoría política clásica y moderna, derecho constitucional e internacional y economía.',
      ca: 'Doble especialització amb cursos en teoria política clàssica i moderna, dret constitucional i internacional i economia.',
      zh: '双专业背景，课程涵盖古典与现代政治理论、宪法与国际法以及经济学。',
    },
    "Awarded summa cum laude for honors thesis examining Nietzsche's theory of morality across Human, All Too Human, Daybreak, and On the Genealogy of Morals, and its relationship to Schopenhauer and Rée.": {
      es: 'Graduado summa cum laude por una tesis de honor que examina la teoría de la moral de Nietzsche en Human, All Too Human, Daybreak y On the Genealogy of Morals, y su relación con Schopenhauer y Rée.',
      ca: "Graduat summa cum laude per una tesi d'honor que examina la teoria de la moral de Nietzsche a Human, All Too Human, Daybreak i On the Genealogy of Morals, i la seva relació amb Schopenhauer i Rée.",
      zh: '因荣誉论文获得“最优等”毕业荣誉，该论文研究尼采在《人性的，太人性的》《曙光》《道德谱系学》中的道德理论及其与叔本华和里尔的关系。',
    },
  }
  const localizedKey = locale === 'ca' ? 'ca' : locale === 'es' ? 'es' : locale === 'zh' ? 'zh' : null
  const role = localizedKey ? (roleMap[item.role]?.[localizedKey] ?? item.role) : item.role
  const date = localizedKey ? (dateMap[item.date]?.[localizedKey] ?? item.date) : item.date
  const description = item.description.map((line) =>
    localizedKey ? (descriptionMap[line]?.[localizedKey] ?? line) : line
  )
  return { ...item, role, date, description }
}

export default function Timeline() {
  const { locale, t } = useLocale()
  const pageTitle = `${t.timelineTitle} — Mark Hendrickson`
  const pageDesc = t.timelineDescription
  const canonicalUrl = `${SITE_BASE}${localizePath('/timeline', locale)}`
  const localizedTimeline = timeline.map((item) => localizeTimelineItem(item, locale))
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        {supportedLocales.map((altLocale) => (
          <link
            key={altLocale}
            rel="alternate"
            hrefLang={altLocale}
            href={`${SITE_BASE}${localizePath('/timeline', altLocale)}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/timeline`} />
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
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">{t.timelineTitle}</h1>
          <div className="w-full text-[17px] text-muted-foreground dark:text-foreground/80 mb-12 font-normal tracking-wide">
            {t.timelineDescription}
          </div>

          <div className="mt-12 mb-12">
            {localizedTimeline.map((item, index) => (
              <div key={index} className="mb-16 relative pl-6 last:mb-0">
                <div className="absolute left-0 top-[0.7em] w-1.5 h-1.5 rounded-full bg-foreground transform -translate-y-1/2"></div>
                {index < localizedTimeline.length - 1 && (
                  <div className="absolute left-[2.5px] top-4 w-px bg-border" style={{ height: 'calc(100% + 1rem)' }}></div>
                )}
                <div className="text-[15px] font-medium mb-1">
                  {(() => {
                    const linkClass = LINK_CLASS
                    if (item.company === 'Startup (Neotoma & Ateles)') {
                      return (
                        <>
                          Startup (
                          <a href="https://neotoma.io" target="_blank" rel="noopener noreferrer" className={linkClass}>Neotoma</a>
                          {' & '}
                          <Link to={localizePath('/posts/what-my-agentic-stack-actually-does', locale)} className={linkClass}>Ateles</Link>
                          )
                        </>
                      )
                    }
                    if (item.company === 'Trust Machines (Leather)') {
                      return (
                        <>
                          <a href="https://leather.io" target="_blank" rel="noopener noreferrer" className={linkClass}>Leather</a>
                          {' (subsidiary of '}
                          <a href="https://trustmachines.co" target="_blank" rel="noopener noreferrer" className={linkClass}>Trust Machines</a>
                          )
                        </>
                      )
                    }
                    if (item.company === 'Hiro Systems PBC (originally Blockstack)') {
                      return (
                        <>
                          <a href="https://hiro.so" target="_blank" rel="noopener noreferrer" className={linkClass}>Hiro Systems PBC</a>
                          {' (originally '}
                          <a href="https://venturebeat.com/ai/blockstack-raises-52-million-to-build-a-parallel-internet-where-you-own-all-your-data" target="_blank" rel="noopener noreferrer" className={linkClass}>Blockstack</a>
                          )
                        </>
                      )
                    }
                    if (item.company === 'KITE Solutions Inc.') {
                      return (
                        <>
                          KITE Solutions Inc. (now{' '}
                          <a href="https://www.nucla.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>Nucla</a>
                          )
                        </>
                      )
                    }
                    const link = projectLinkByCompany.get(item.company)
                    if (link?.url) {
                      return (
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          {item.company}
                        </a>
                      )
                    }
                    if (link?.postSlug) {
                      return (
                        <Link to={localizePath(`/posts/${link.postSlug}`, locale)} className={linkClass}>
                          {item.company}
                        </Link>
                      )
                    }
                    return item.company
                  })()}
                </div>
                <div className="text-[15px] text-muted-foreground dark:text-foreground/80 mb-1">{item.role}</div>
                <div className="text-[13px] text-muted-foreground dark:text-foreground/80 mb-2">{item.date}</div>
                {item.description.length > 0 && (
                  <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed">
                    {item.description.map((desc, i) => {
                      const isBowdoinBaSecond = item.company === 'Bowdoin College' && item.role === 'BA, Government & Economics' && i === 1
                      return (
                        <p key={i} className={i < item.description.length - 1 ? 'mb-3' : ''}>
                          {descriptionWithCrunchbaseLink(desc)}
                          {isBowdoinBaSecond && (
                            <>
                              {' '}
                              Captain of the{' '}
                              <a href="https://students.bowdoin.edu/crew/" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                                rowing team
                              </a>
                              .
                            </>
                          )}
                        </p>
                      )
                    })}
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
