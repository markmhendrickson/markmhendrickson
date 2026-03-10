import { useLocale } from '@/i18n/LocaleContext'

export default function Home() {
  const { locale } = useLocale()
  const copy = {
    en: {
      subtitle: 'Building structured memory for AI agents.',
      p1: "I'm building Neotoma, a structured memory layer for AI agents. The core problem: agents are increasingly stateful, handling tasks, contacts, transactions, and commitments over time, but their memory is built for retrieval, not truth. It drifts between sessions, overwrites without history, and cannot be traced or replayed. Neotoma treats personal data the way production systems treat state: typed entities, stable IDs, full provenance, deterministic queries. Local-first, cross-platform via MCP, and entirely user-controlled.",
      p2: "The principle underneath is the same one that's driven all of my work: people should control their own data, memory, money, and digital infrastructure, not cede it to platforms that optimize for engagement over truth.",
      p3: 'I work as a solo founder in Barcelona, operating with AI agents as a team rather than as tools. Every workflow, email, finance, content, and product, runs through a shared repo and source of truth. The agents follow the same playbook I do. That only works because the state layer is explicit and inspectable, which is exactly the contract Neotoma is designed to provide.',
      p4: 'Before this chapter, I spent nearly two decades building products across consumer web, crypto, and startups: writing and shipping at TechCrunch, co-founding Plancast (acquired by Active Network), co-founding KITE Solutions, advising and building with early-stage startups, leading user experience at Hiro for the Stacks blockchain, and running Leather at Trust Machines. You can see the full arc on my timeline.',
    },
    es: {
      subtitle: 'Construyendo infraestructura de memoria soberana para agentes de IA.',
      p1: 'Estoy construyendo Neotoma, una capa de memoria estructurada para agentes de IA. El problema central: los agentes son cada vez más stateful, gestionan tareas, contactos, transacciones y compromisos a lo largo del tiempo, pero su memoria está diseñada para recuperación, no para verdad. Deriva entre sesiones, sobrescribe sin historial y no se puede trazar ni reproducir. Neotoma trata los datos personales como los sistemas de producción tratan el estado: entidades tipadas, IDs estables, procedencia completa y consultas deterministas. Local-first, multiplataforma vía MCP y totalmente bajo control del usuario.',
      p2: 'El principio de fondo es el mismo que ha guiado todo mi trabajo: las personas deben controlar sus datos, memoria, dinero e infraestructura digital, no cederlos a plataformas que optimizan el engagement por encima de la verdad.',
      p3: 'Trabajo como fundador en solitario en Barcelona, operando con agentes de IA como equipo en lugar de herramientas. Cada workflow, email, finanzas, contenido y producto, pasa por un repositorio compartido y una fuente de verdad común. Los agentes siguen el mismo playbook que sigo yo. Eso solo funciona porque la capa de estado es explícita e inspeccionable, justo el contrato que Neotoma está diseñada para ofrecer.',
      p4: 'Antes de esta etapa, pasé casi dos décadas construyendo productos en web de consumo, cripto y startups: escribiendo y lanzando en TechCrunch, cofundando Plancast (adquirida por Active Network), cofundando KITE Solutions, asesorando y construyendo con startups en fase temprana, liderando experiencia de usuario en Hiro para la blockchain de Stacks y dirigiendo Leather en Trust Machines. Puedes ver todo el recorrido en mi trayectoria.',
    },
    ca: {
      subtitle: "Construint infraestructura de memòria sobirana per a agents d'IA.",
      p1: "Estic construint Neotoma, una capa de memòria estructurada per a agents d'IA. El problema central: els agents són cada cop més stateful, gestionen tasques, contactes, transaccions i compromisos al llarg del temps, però la seva memòria està pensada per a recuperació, no per a veritat. Deriva entre sessions, sobreescriu sense historial i no es pot traçar ni reproduir. Neotoma tracta les dades personals com els sistemes de producció tracten l'estat: entitats tipades, IDs estables, procedència completa i consultes deterministes. Local-first, multiplataforma via MCP i totalment sota control de l'usuari.",
      p2: "El principi de fons és el mateix que ha guiat tota la meva feina: les persones han de controlar les seves dades, memòria, diners i infraestructura digital, no cedir-los a plataformes que optimitzen l'engagement per sobre de la veritat.",
      p3: "Treballo com a fundador en solitari a Barcelona, operant amb agents d'IA com a equip en lloc d'eines. Cada workflow, correu, finances, contingut i producte passa per un repositori compartit i una font de veritat comuna. Els agents segueixen el mateix playbook que segueixo jo. Això només funciona perquè la capa d'estat és explícita i inspeccionable, exactament el contracte que Neotoma està dissenyada per oferir.",
      p4: "Abans d'aquesta etapa, vaig passar gairebé dues dècades construint productes a la web de consum, cripto i startups: escrivint i publicant a TechCrunch, cofundant Plancast (adquirida per Active Network), cofundant KITE Solutions, assessorant i construint amb startups en fase inicial, liderant experiència d'usuari a Hiro per a la blockchain d'Stacks i dirigint Leather a Trust Machines. Pots veure tot el recorregut a la meva trajectòria.",
    },
  } as const
  const text = copy[locale as keyof typeof copy] ?? copy.en
  return (
    <div className="w-full flex justify-center items-start min-h-content pt-8 pb-4 px-4 md:pt-20 md:pb-[100px] md:px-8">
      <div className="w-full max-w-[1200px] min-w-0">
        <img
          src="/profile.jpg"
          alt="Mark Hendrickson"
          className="float-right ml-12 mb-12 w-[400px] h-[400px] rounded-none object-cover"
        />
        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Mark Hendrickson</h1>
        <div className="text-[17px] text-muted-foreground dark:text-foreground/80 mb-12 font-normal tracking-wide">
          {text.subtitle}
        </div>

        <div className="text-[15px] leading-[1.75] font-light">
          <p className="mb-6">{text.p1}</p>

          <p className="mb-6">{text.p2}</p>

          <p className="mb-6">{text.p3}</p>

          <p>{text.p4}</p>
        </div>
      </div>
    </div>
  )
}
