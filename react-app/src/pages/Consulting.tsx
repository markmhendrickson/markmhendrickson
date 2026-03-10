import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales, type SupportedLocale } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'

const SITE_BASE = 'https://markmhendrickson.com'
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

const LINK_CLASS =
  'text-foreground underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground'

interface FocusArea {
  title: string
  description: string
  topics: string[]
}

interface EngagementType {
  title: string
  description: string
}

interface ConsultingCopy {
  title: string
  subtitle: string
  pageDesc: string
  contextHeading: string
  contextParagraphs: string[]
  focusAreasHeading: string
  focusAreas: FocusArea[]
  engagementTypesHeading: string
  engagementTypes: EngagementType[]
  engagementFitHeading: string
  engagementFitTraits: string[]
  structureHeading: string
  structureBullets: string[]
  openSourceHeading: string
  openSourceParagraphs: string[]
  ctaHeading: string
  ctaParagraph: string
  ctaEmailLabel: string
  ctaInclude: string[]
  ctaButton: string
}

const copy: Record<string, ConsultingCopy> = {
  en: {
    title: 'Advisory & consulting',
    subtitle: 'Select engagements in agent infrastructure, deterministic state, and machine-native commerce.',
    pageDesc: 'Mark Hendrickson offers select advisory and consulting in AI agent systems, deterministic state infrastructure, and machine-native commerce.',
    contextHeading: 'Context',
    contextParagraphs: [
      'I take on a small number of consulting engagements in areas where I have deep, current, hands-on expertise. Each engagement is chosen for technical overlap with the infrastructure problems I work on daily.',
      'My background spans nearly two decades across consumer web, developer platforms, and crypto infrastructure: writing and shipping at TechCrunch, co-founding Plancast, leading user experience at Hiro for the Stacks blockchain, and running Leather at Trust Machines. I now build Neotoma, a structured memory layer for AI agents, and operate with a full agentic stack where AI agents function as collaborators rather than tools. You can see the full arc on my timeline.',
    ],
    focusAreasHeading: 'Focus areas',
    focusAreas: [
      {
        title: 'Agent systems & AI infrastructure',
        description: 'Architecture and reliability for AI systems that take actions, maintain state, and evolve over time.',
        topics: [
          'Multi-step autonomous workflows and orchestration',
          'Tool-using LLM systems and agent runtimes',
          'Evaluation pipelines and observability',
          'Debugging reliability problems in agent execution',
          'Data pipelines feeding agent workflows',
        ],
      },
      {
        title: 'Deterministic state & knowledge architecture',
        description: 'Systems where correctness, traceability, and reproducibility of state are critical.',
        topics: [
          'Event-sourced architectures and versioned data',
          'Knowledge graphs and entity resolution',
          'Provenance tracking and audit systems',
          'Long-running workflow state management',
        ],
      },
      {
        title: 'Machine-native commerce',
        description: 'Programmable payment infrastructure for autonomous software agents.',
        topics: [
          'Agent-controlled wallets and custody models',
          'Agent-to-agent payment architectures',
          'Programmable settlement and API-native payment flows',
          'Infrastructure enabling autonomous services to transact',
        ],
      },
    ],
    engagementTypesHeading: 'Types of engagements',
    engagementTypes: [
      {
        title: 'Architecture review',
        description: 'Focused analysis of system architecture, identifying structural weaknesses, reliability risks, and opportunities.',
      },
      {
        title: 'Technical advisory',
        description: 'Ongoing advisory providing architectural guidance and strategic technical input.',
      },
      {
        title: 'System debugging & reliability',
        description: 'Diagnosing complex failures in AI systems, automation pipelines, or distributed systems.',
      },
      {
        title: 'Platform & infrastructure design',
        description: 'Advising on the architecture of new platforms involving agents, workflows, or programmable infrastructure.',
      },
      {
        title: 'Product architecture & developer experience',
        description: 'Advising on how product design maps to system architecture for developer-facing AI tools. API surface design, developer onboarding, and adoption strategy for infrastructure products.',
      },
    ],
    engagementFitHeading: 'Best fit',
    engagementFitTraits: [
      'Technically ambitious systems at the infrastructure level',
      'Teams with strong engineering who need architectural or product-architecture perspective',
      'Problems involving state evolution, reproducibility, or complex automation',
      'Willingness to explore unconventional architectural approaches',
    ],
    structureHeading: 'Working structure',
    structureBullets: [
      '5\u201310 hours per week, defined scope and timeline',
      '2\u20138 weeks for architecture engagements',
      '1\u20133 months for advisory retainers',
      'Fixed-scope projects, architecture sprints, or monthly retainers',
      'No embedded team participation or day-to-day engineering roles',
    ],
    openSourceHeading: 'Open-source commitment',
    openSourceParagraphs: [
      'Neotoma is developed as open infrastructure. Engagements must allow continued development of Neotoma, reuse of general architectural ideas, and publication of open-source work.',
      'Client-specific work stays confidential. Engagements requiring exclusivity over core architectural concepts or restricting open-source development are not accepted.',
    ],
    ctaHeading: 'Get in touch',
    ctaParagraph: 'If you think your project may be a good fit, I\u2019d be happy to discuss it.',
    ctaEmailLabel: 'Email me',
    ctaInclude: [
      'A short description of the system you are building',
      'The technical challenges you are encountering',
      'The type of engagement you have in mind',
      'Expected timeline',
    ],
    ctaButton: 'Schedule a conversation',
  },
  es: {
    title: 'Asesoría y consultoría',
    subtitle: 'Proyectos selectos en infraestructura de agentes, estado determinista y comercio nativo para máquinas.',
    pageDesc: 'Mark Hendrickson ofrece asesoría selecta en sistemas de agentes IA, infraestructura de estado determinista y comercio nativo para máquinas.',
    contextHeading: 'Contexto',
    contextParagraphs: [
      'Acepto un número reducido de proyectos de consultoría en áreas donde tengo experiencia profunda y práctica actual. Cada proyecto se elige por su relación técnica con los problemas de infraestructura en los que trabajo a diario.',
      'Mi trayectoria abarca casi dos décadas en web de consumo, plataformas para desarrolladores e infraestructura cripto: escribiendo y publicando en TechCrunch, cofundando Plancast, liderando experiencia de usuario en Hiro para la blockchain Stacks, y dirigiendo Leather en Trust Machines. Ahora construyo Neotoma, una capa de memoria estructurada para agentes IA, y opero con un stack agéntico completo donde los agentes funcionan como colaboradores. Puedes ver la trayectoria completa en mi timeline.',
    ],
    focusAreasHeading: 'Áreas de enfoque',
    focusAreas: [
      {
        title: 'Sistemas de agentes e infraestructura IA',
        description: 'Arquitectura y fiabilidad para sistemas IA que ejecutan acciones, mantienen estado y evolucionan con el tiempo.',
        topics: [
          'Flujos de trabajo autónomos y orquestación',
          'Sistemas LLM con herramientas y runtimes de agentes',
          'Pipelines de evaluación y observabilidad',
          'Depuración de problemas de fiabilidad en ejecución de agentes',
          'Pipelines de datos para flujos de trabajo de agentes',
        ],
      },
      {
        title: 'Estado determinista y arquitectura de conocimiento',
        description: 'Sistemas donde la corrección, trazabilidad y reproducibilidad del estado son críticas.',
        topics: [
          'Arquitecturas event-sourced y datos versionados',
          'Grafos de conocimiento y resolución de entidades',
          'Seguimiento de proveniencia y sistemas de auditoría',
          'Gestión de estado en flujos de trabajo de larga duración',
        ],
      },
      {
        title: 'Comercio nativo para máquinas',
        description: 'Infraestructura de pagos programable para agentes de software autónomos.',
        topics: [
          'Wallets controlados por agentes y modelos de custodia',
          'Arquitecturas de pago agente-a-agente',
          'Liquidación programable y flujos de pago nativos de API',
          'Infraestructura para que servicios autónomos realicen transacciones',
        ],
      },
    ],
    engagementTypesHeading: 'Tipos de proyectos',
    engagementTypes: [
      {
        title: 'Revisión de arquitectura',
        description: 'Análisis enfocado de la arquitectura del sistema, identificando debilidades estructurales, riesgos de fiabilidad y oportunidades.',
      },
      {
        title: 'Asesoría técnica',
        description: 'Relación de asesoría continua proporcionando orientación arquitectónica e input técnico estratégico.',
      },
      {
        title: 'Depuración y fiabilidad',
        description: 'Diagnóstico de fallos complejos en sistemas IA, pipelines de automatización o sistemas distribuidos.',
      },
      {
        title: 'Diseño de plataformas e infraestructura',
        description: 'Asesoría sobre la arquitectura de nuevas plataformas con agentes, flujos de trabajo o infraestructura programable.',
      },
      {
        title: 'Arquitectura de producto y experiencia de desarrollador',
        description: 'Asesoría sobre cómo el diseño de producto se conecta con la arquitectura del sistema para herramientas IA orientadas a desarrolladores. Diseño de API, onboarding de desarrolladores y estrategia de adopción para productos de infraestructura.',
      },
    ],
    engagementFitHeading: 'Mejor ajuste',
    engagementFitTraits: [
      'Sistemas técnicamente ambiciosos a nivel de infraestructura',
      'Equipos con ingeniería sólida que necesitan perspectiva arquitectónica o de producto',
      'Problemas que involucran evolución de estado, reproducibilidad o automatización compleja',
      'Disposición a explorar enfoques arquitectónicos no convencionales',
    ],
    structureHeading: 'Estructura de trabajo',
    structureBullets: [
      '5\u201310 horas por semana, alcance y cronograma definidos',
      '2\u20138 semanas para proyectos de arquitectura',
      '1\u20133 meses para retainers de asesoría',
      'Proyectos de alcance fijo, sprints de arquitectura o retainers mensuales',
      'Sin participación embebida en equipo ni roles de ingeniería del día a día',
    ],
    openSourceHeading: 'Compromiso open-source',
    openSourceParagraphs: [
      'Neotoma se desarrolla como infraestructura abierta. Los proyectos deben permitir el desarrollo continuo de Neotoma, la reutilización de ideas arquitectónicas generales y la publicación de trabajo open-source.',
      'El trabajo específico para cada cliente se mantiene confidencial. No se aceptan proyectos que requieran exclusividad sobre conceptos arquitectónicos fundamentales o que restrinjan el desarrollo open-source.',
    ],
    ctaHeading: 'Contacto',
    ctaParagraph: 'Si crees que tu proyecto podría encajar bien, estaré encantado de hablarlo.',
    ctaEmailLabel: 'Escríbeme',
    ctaInclude: [
      'Una breve descripción del sistema que estás construyendo',
      'Los desafíos técnicos que estás encontrando',
      'El tipo de proyecto que tienes en mente',
      'Cronograma esperado',
    ],
    ctaButton: 'Agendar una conversación',
  },
  ca: {
    title: 'Assessoria i consultoria',
    subtitle: "Projectes selectes en infraestructura d'agents, estat determinista i comerç natiu per a màquines.",
    pageDesc: "Mark Hendrickson ofereix assessoria selecta en sistemes d'agents IA, infraestructura d'estat determinista i comerç natiu per a màquines.",
    contextHeading: 'Context',
    contextParagraphs: [
      "Accepto un nombre reduït de projectes de consultoria en àrees on tinc experiència profunda i pràctica actual. Cada projecte es tria per la seva relació tècnica amb els problemes d'infraestructura en què treballo diàriament.",
      "La meva trajectòria abasta gairebé dues dècades en web de consum, plataformes per a desenvolupadors i infraestructura cripto: escrivint i publicant a TechCrunch, cofundant Plancast, liderant experiència d'usuari a Hiro per a la blockchain Stacks, i dirigint Leather a Trust Machines. Ara construeixo Neotoma, una capa de memòria estructurada per a agents IA, i opero amb un stack agèntic complet on els agents funcionen com a col·laboradors. Pots veure la trajectòria completa al meu timeline.",
    ],
    focusAreasHeading: "Àrees d'enfocament",
    focusAreas: [
      {
        title: "Sistemes d'agents i infraestructura IA",
        description: "Arquitectura i fiabilitat per a sistemes IA que executen accions, mantenen estat i evolucionen amb el temps.",
        topics: [
          "Fluxos de treball autònoms i orquestració",
          "Sistemes LLM amb eines i runtimes d'agents",
          "Pipelines d'avaluació i observabilitat",
          "Depuració de problemes de fiabilitat en execució d'agents",
          "Pipelines de dades per a fluxos de treball d'agents",
        ],
      },
      {
        title: 'Estat determinista i arquitectura de coneixement',
        description: "Sistemes on la correcció, traçabilitat i reproductibilitat de l'estat són crítiques.",
        topics: [
          'Arquitectures event-sourced i dades versionades',
          "Grafs de coneixement i resolució d'entitats",
          "Seguiment de procedència i sistemes d'auditoria",
          "Gestió d'estat en fluxos de treball de llarga durada",
        ],
      },
      {
        title: 'Comerç natiu per a màquines',
        description: "Infraestructura de pagaments programable per a agents de programari autònoms.",
        topics: [
          "Wallets controlats per agents i models de custòdia",
          'Arquitectures de pagament agent-a-agent',
          "Liquidació programable i fluxos de pagament natius d'API",
          'Infraestructura per a que serveis autònoms realitzin transaccions',
        ],
      },
    ],
    engagementTypesHeading: 'Tipus de projectes',
    engagementTypes: [
      {
        title: "Revisió d'arquitectura",
        description: "Anàlisi enfocada de l'arquitectura del sistema, identificant debilitats estructurals, riscos de fiabilitat i oportunitats.",
      },
      {
        title: 'Assessoria tècnica',
        description: "Relació d'assessoria contínua proporcionant orientació arquitectònica i input tècnic estratègic.",
      },
      {
        title: 'Depuració i fiabilitat',
        description: "Diagnòstic de fallades complexes en sistemes IA, pipelines d'automatització o sistemes distribuïts.",
      },
      {
        title: "Disseny de plataformes i infraestructura",
        description: "Assessoria sobre l'arquitectura de noves plataformes amb agents, fluxos de treball o infraestructura programable.",
      },
      {
        title: "Arquitectura de producte i experiència de desenvolupador",
        description: "Assessoria sobre com el disseny de producte es connecta amb l'arquitectura del sistema per a eines IA orientades a desenvolupadors. Disseny d'API, onboarding de desenvolupadors i estratègia d'adopció per a productes d'infraestructura.",
      },
    ],
    engagementFitHeading: 'Millor encaix',
    engagementFitTraits: [
      "Sistemes tècnicament ambiciosos a nivell d'infraestructura",
      'Equips amb enginyeria sòlida que necessiten perspectiva arquitectònica o de producte',
      "Problemes que involucren evolució d'estat, reproductibilitat o automatització complexa",
      'Disposició a explorar enfocaments arquitectònics no convencionals',
    ],
    structureHeading: 'Estructura de treball',
    structureBullets: [
      '5\u201310 hores per setmana, abast i cronograma definits',
      "2\u20138 setmanes per a projectes d'arquitectura",
      "1\u20133 mesos per a retainers d'assessoria",
      "Projectes d'abast fix, sprints d'arquitectura o retainers mensuals",
      "Sense participació integrada a l'equip ni rols d'enginyeria del dia a dia",
    ],
    openSourceHeading: 'Compromís open-source',
    openSourceParagraphs: [
      "Neotoma es desenvolupa com a infraestructura oberta. Els projectes han de permetre el desenvolupament continu de Neotoma, la reutilització d'idees arquitectòniques generals i la publicació de treball open-source.",
      "El treball específic per a cada client es manté confidencial. No s'accepten projectes que requereixin exclusivitat sobre conceptes arquitectònics fonamentals o que restringeixin el desenvolupament open-source.",
    ],
    ctaHeading: 'Contacte',
    ctaParagraph: "Si creus que el teu projecte podria encaixar bé, estaré encantat de parlar-ne.",
    ctaEmailLabel: "Envia'm un correu",
    ctaInclude: [
      'Una breu descripció del sistema que estàs construint',
      'Els reptes tècnics que estàs trobant',
      'El tipus de projecte que tens en ment',
      'Cronograma esperat',
    ],
    ctaButton: 'Programa una conversa',
  },
}

export default function Consulting() {
  const { locale } = useLocale()
  const text = copy[locale] ?? copy.en

  const canonicalUrl = `${SITE_BASE}${localizePath('/consulting', locale)}`
  const pageTitle = `${text.title} \u2014 Mark Hendrickson`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={text.pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        {supportedLocales.map((altLocale) => (
          <link
            key={altLocale}
            rel="alternate"
            hrefLang={altLocale}
            href={`${SITE_BASE}${localizePath('/consulting', altLocale)}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/consulting`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={text.pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={text.pageDesc} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta name="twitter:image:height" content={String(OG_IMAGE_HEIGHT)} />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-10 pb-20 px-5 md:py-28 md:px-8">
        <div className="max-w-[42rem] w-full">
          <header className="mb-16">
            <h1 className="text-[28px] font-medium mb-2 tracking-tight text-foreground">
              {text.title}
            </h1>
            <p className="text-[17px] text-muted-foreground dark:text-foreground/80 font-normal tracking-wide max-w-[32rem]">
              {text.subtitle}
            </p>
          </header>

          <div className="space-y-16">
            {/* Context */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.contextHeading}
              </h2>
              <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed space-y-4">
                {text.contextParagraphs.map((p, i) => (
                  <p key={i} className="max-w-[65ch]">
                    {i === 1 ? paragraphWithProjectLinks(p, locale) : p}
                  </p>
                ))}
              </div>
            </section>

            {/* Focus Areas */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.focusAreasHeading}
              </h2>
              <div className="space-y-10">
                {text.focusAreas.map((area, i) => (
                  <div key={i} className="space-y-3">
                    <h3 className="text-[16px] font-medium text-foreground">
                      {area.title}
                    </h3>
                    <p className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed max-w-[65ch]">
                      {area.description}
                    </p>
                    <ul className="list-disc pl-6 space-y-1.5 text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed marker:text-muted-foreground dark:marker:text-foreground/70">
                      {area.topics.map((topic, j) => (
                        <li key={j} className="pl-0.5 max-w-[65ch]">{topic}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Types of Engagements */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.engagementTypesHeading}
              </h2>
              <div className="space-y-6">
                {text.engagementTypes.map((engagement, i) => (
                  <div key={i}>
                    <h3 className="text-[15px] font-medium text-foreground mb-1">
                      {engagement.title}
                    </h3>
                    <p className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed max-w-[65ch]">
                      {engagement.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Best Fit */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.engagementFitHeading}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed marker:text-muted-foreground dark:marker:text-foreground/70">
                {text.engagementFitTraits.map((trait, i) => (
                  <li key={i} className="pl-0.5 max-w-[65ch]">{trait}</li>
                ))}
              </ul>
            </section>

            {/* Working Structure */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.structureHeading}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed marker:text-muted-foreground dark:marker:text-foreground/70">
                {text.structureBullets.map((bullet, i) => (
                  <li key={i} className="pl-0.5 max-w-[65ch]">{bullet}</li>
                ))}
              </ul>
            </section>

            {/* Open-Source Commitment */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.openSourceHeading}
              </h2>
              <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed space-y-4">
                {text.openSourceParagraphs.map((p, i) => (
                  <p key={i} className="max-w-[65ch]">
                    {p}
                  </p>
                ))}
              </div>
            </section>

            {/* Get in Touch */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.ctaHeading}
              </h2>
              <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed space-y-4">
                <p className="max-w-[65ch]">{text.ctaParagraph}</p>
                <p className="max-w-[65ch] font-medium text-foreground">
                  <a
                    href="mailto:markmhendrickson@gmail.com?subject=Consulting%20inquiry"
                    className={LINK_CLASS}
                  >
                    {text.ctaEmailLabel}
                  </a>
                  {locale === 'es' ? ' y por favor incluye:' : locale === 'ca' ? " i si us plau inclou:" : ' and please include:'}
                </p>
                <ul className="list-disc pl-6 space-y-1.5 marker:text-muted-foreground dark:marker:text-foreground/70">
                  {text.ctaInclude.map((item, i) => (
                    <li key={i} className="pl-0.5 max-w-[65ch]">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2">
                <Link
                  to={localizePath('/meet', locale)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border hover:border-muted-foreground hover:bg-muted transition-all text-[15px] font-medium text-foreground"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>{text.ctaButton}</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

const CONSULTING_PROJECT_LINKS: Array<
  { phrase: string; url?: string; postSlug?: string; path?: string }
> = [
  { phrase: 'Trust Machines', url: 'https://trustmachines.co' },
  { phrase: 'TechCrunch', url: 'https://techcrunch.com' },
  { phrase: 'Plancast', postSlug: 'a-postmortem-for-plancast' },
  { phrase: 'Hiro', url: 'https://hiro.so' },
  { phrase: 'Leather', url: 'https://leather.io' },
  { phrase: 'Neotoma', url: 'https://neotoma.io' },
  { phrase: 'timeline', path: '/timeline' },
]

function paragraphWithProjectLinks(
  text: string,
  locale: SupportedLocale
): React.ReactNode {
  let earliest = {
    index: -1,
    phrase: '',
    url: undefined as string | undefined,
    postSlug: undefined as string | undefined,
    path: undefined as string | undefined,
  }
  for (const { phrase, url, postSlug, path } of CONSULTING_PROJECT_LINKS) {
    const idx = text.indexOf(phrase)
    if (idx !== -1 && (earliest.index === -1 || idx < earliest.index)) {
      earliest = { index: idx, phrase, url, postSlug, path }
    }
  }
  if (earliest.index === -1) return text
  const before = text.slice(0, earliest.index)
  const after = text.slice(earliest.index + earliest.phrase.length)
  const linkNode = earliest.url ? (
    <a
      href={earliest.url}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {earliest.phrase}
    </a>
  ) : earliest.postSlug ? (
    <Link
      to={localizePath(`/posts/${earliest.postSlug}`, locale)}
      className={LINK_CLASS}
    >
      {earliest.phrase}
    </Link>
  ) : earliest.path ? (
    <Link
      to={localizePath(earliest.path, locale)}
      className={LINK_CLASS}
    >
      {earliest.phrase}
    </Link>
  ) : (
    earliest.phrase
  )
  return (
    <>
      {before}
      {linkNode}
      {paragraphWithProjectLinks(after, locale)}
    </>
  )
}
