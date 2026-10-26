import { Link } from 'react-router-dom'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'
import { PostsFeedItems } from '@/components/PostsFeedItems'
import { usePostsFeedPage } from '@/lib/usePostsFeedPage'
import localizedHomeCopy from '@/i18n/homeCopy.localized.json'
import type { FeedItem } from '@/lib/postsFeed'

const LINK_CLASS =
  'underline underline-offset-2 decoration-muted-foreground/70 hover:decoration-foreground focus:outline-none focus:decoration-foreground'

export function HomeLatestPosts({ items, totalPages }: { items: FeedItem[]; totalPages: number }) {
  const { locale, t } = useLocale()
  return (
    <section aria-labelledby="home-latest-posts" className="clear-both mt-12 md:mt-16">
      <h2 id="home-latest-posts" className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-6">
        {t.homeLatestPosts}
      </h2>
      {items.length > 0 ? (
        <>
          <div className="space-y-8"><PostsFeedItems items={items} titleAs="h3" /></div>
          <p className="mt-8">
            <Link
              to={totalPages > 1 ? `${localizePath('/posts', locale)}?page=2` : localizePath('/posts', locale)}
              className={`${LINK_CLASS} text-[16px] font-medium`}
            >
              {totalPages > 1 ? t.homeMorePosts : t.homeViewAllPosts} →
            </Link>
          </p>
        </>
      ) : (
        <p className="text-[16px] text-muted-foreground">{t.noPostsYet}</p>
      )}
    </section>
  )
}

export default function Home() {
  const { locale } = useLocale()
  // Page 1 of the /posts feed, from the same hook and item component the posts page uses.
  const { items: latestItems, totalPages } = usePostsFeedPage(1)
  const copy = {
    en: {
      subtitle: 'Building the system of record for AI agents and designing an operating system for agentic organizations.',
      p1Before: "I'm building ",
      p1Link: 'Neotoma',
      p1After:
        ", the system of record for AI agents. The idea is a record, not recall. Without one, an agent works from whatever it happens to recall: part of the last session, a note its tool saved, or nothing. With one, it reads what was stored, from which source, and what is current now, so the agents you connect can defer to one answer. Neotoma is open source, runs locally, and connects to agents through MCP, a REST API, and a CLI.",
      p2: "The principle underneath is the same one that's driven all of my work: people should control their own data, memory, money, and digital infrastructure, not cede it to platforms that optimize for engagement over truth.",
      p3Before: 'I work as a solo founder in Barcelona, operating with AI agents as a team rather than as tools. Every workflow, email, finance, content, and product, runs through a shared repo and a shared record. The agents follow the same playbook I do. That experience informs ',
      p3Link: 'Ateles',
      p3After: ', an open-source project in development for organizing agents, tasks, and plans around Neotoma’s shared record.',
      p4Before:
        'Before this chapter, I spent nearly two decades building products across consumer web, crypto, and startups: writing and shipping at TechCrunch, co-founding Plancast (acquired by Active Network), co-founding KITE Solutions, advising and building with early-stage startups, leading user experience at Hiro for the Stacks blockchain, and running Leather at Trust Machines. You can see the full arc on my ',
      p4Link: 'timeline',
      p4After: '.',
    },
    es: {
      subtitle: 'Construyendo el sistema de registro para agentes de IA y diseñando un sistema operativo para organizaciones de agentes.',
      p1Before: 'Estoy construyendo ',
      p1Link: 'Neotoma',
      p1After:
        ", el sistema de registro para agentes de IA. La idea es un registro, no el recuerdo. Sin uno, un agente trabaja con lo que recuerde en ese momento: parte de la última sesión, una nota que guardó su herramienta, o nada. Con uno, lee lo que se guardó, de qué fuente y qué es vigente ahora, de modo que los agentes que conectas puedan remitirse a una sola respuesta. Neotoma es de código abierto, se ejecuta en local y se conecta a los agentes mediante MCP, una API REST y una CLI.",
      p2: 'El principio de fondo es el mismo que ha guiado todo mi trabajo: las personas deben controlar sus datos, memoria, dinero e infraestructura digital, no cederlos a plataformas que optimizan el engagement por encima de la verdad.',
      p3Before: 'Trabajo como fundador en solitario en Barcelona, operando con agentes de IA como equipo en lugar de herramientas. Cada workflow, email, finanzas, contenido y producto pasa por un repositorio compartido y un registro compartido. Los agentes siguen el mismo manual que yo. Esa experiencia guía ',
      p3Link: 'Ateles',
      p3After: ', un proyecto de código abierto en desarrollo para organizar agentes, tareas y planes alrededor del registro compartido de Neotoma.',
      p4Before:
        'Antes de esta etapa, pasé casi dos décadas construyendo productos en web de consumo, cripto y startups: escribiendo y lanzando en TechCrunch, cofundando Plancast (adquirida por Active Network), cofundando KITE Solutions, asesorando y construyendo con startups en fase temprana, liderando experiencia de usuario en Hiro para la blockchain de Stacks y dirigiendo Leather en Trust Machines. Puedes ver todo el recorrido en mi ',
      p4Link: 'trayectoria',
      p4After: '.',
    },
    ca: {
      subtitle: "Construint el sistema de registre per a agents d'IA i dissenyant un sistema operatiu per a organitzacions d'agents.",
      p1Before: "Estic construint ",
      p1Link: 'Neotoma',
      p1After:
        ", el sistema de registre per a agents d'IA. La idea és un registre, no el record. Sense un, un agent treballa amb el que recordi en aquell moment: part de l'última sessió, una nota que va desar la seva eina, o res. Amb un, llegeix el que es va desar, de quina font i què és vigent ara, de manera que els agents que connectes puguin remetre's a una sola resposta. Neotoma és de codi obert, s'executa en local i es connecta als agents mitjançant MCP, una API REST i una CLI.",
      p2: "El principi de fons és el mateix que ha guiat tota la meva feina: les persones han de controlar les seves dades, memòria, diners i infraestructura digital, no cedir-los a plataformes que optimitzen l'engagement per sobre de la veritat.",
      p3Before: "Treballo com a fundador en solitari a Barcelona, operant amb agents d'IA com a equip en lloc d'eines. Cada workflow, correu, finances, contingut i producte passa per un repositori compartit i un registre compartit. Els agents segueixen el mateix manual que jo. Aquesta experiència guia ",
      p3Link: 'Ateles',
      p3After: ", un projecte de codi obert en desenvolupament per organitzar agents, tasques i plans al voltant del registre compartit de Neotoma.",
      p4Before:
        "Abans d'aquesta etapa, vaig passar gairebé dues dècades construint productes a la web de consum, cripto i startups: escrivint i publicant a TechCrunch, cofundant Plancast (adquirida per Active Network), cofundant KITE Solutions, assessorant i construint amb startups en fase inicial, liderant experiència d'usuari a Hiro per a la blockchain d'Stacks i dirigint Leather a Trust Machines. Pots veure tot el recorregut a la meva ",
      p4Link: 'trajectòria',
      p4After: '.',
    },
    ...localizedHomeCopy,
  } as const
  const text = copy[locale]
  return (
    <div className="flex justify-center items-start min-h-content pt-8 pb-4 px-4 md:pt-20 md:pb-[100px] md:px-8">
      <div className="max-w-[var(--content-max)] w-full">
        <img
          src="/profile.jpg"
          alt="Mark Hendrickson"
          className="mb-8 w-full h-auto aspect-square rounded-none object-cover sm:float-right sm:ml-6 sm:mb-4 sm:h-[160px] sm:w-[160px] md:ml-8 md:mb-6 md:h-[220px] md:w-[220px] lg:mb-8 lg:h-[300px] lg:w-[300px]"
        />
        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Mark&nbsp;Hendrickson</h1>
        <div className="text-[17px] text-muted-foreground dark:text-foreground/80 mb-8 font-normal tracking-wide">
          {text.subtitle}
        </div>

        <div className="text-[16px] leading-[1.75]">
          <p className="mb-6">
            {text.p1Before}
            <a
              href="https://neotoma.io"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {text.p1Link}
            </a>
            {text.p1After}
          </p>

          <p className="mb-6">{text.p2}</p>

          <p className="mb-6">
            {text.p3Before}
            <a
              href="https://github.com/markmhendrickson/ateles"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {text.p3Link}
            </a>
            {text.p3After}
          </p>

          <p>
            {text.p4Before}
            <Link to={localizePath('/timeline', locale)} className={LINK_CLASS}>
              {text.p4Link}
            </Link>
            {text.p4After}
          </p>
        </div>

        <HomeLatestPosts items={latestItems} totalPages={totalPages} />
      </div>
    </div>
  )
}
