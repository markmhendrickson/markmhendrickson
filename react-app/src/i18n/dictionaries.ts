import type { SupportedLocale } from './config'
import generatedDictionaries from './dictionaries.generated.json'

export type Dict = {
  navHome: string
  navPosts: string
  navTimeline: string
  navAgent: string
  navConsulting: string
  navMeet: string
  navLinks: string
  navLanguage: string
  drafts: string
  latestPost: string
  readMore: string
  nextPost: string
  previousPost: string
  postsTitle: string
  postsDescription: string
  draftsDescription: string
  viewDrafts: string
  backToPosts: string
  searchPosts: string
  noPostsYet: string
  noDraftsYet: string
  minRead: string
  xPost: string
  notFoundTitle: string
  notFoundSubtitle: string
  notFoundDescription: string
  goHome: string
  browsePosts: string
  keyTakeaways: string
  paginationPrevious: string
  paginationNext: string
  paginationPage: string
  paginationOf: string
  themeMenuLabel: string
  themeMenuAriaLabel: string
  themeSystem: string
  themeLight: string
  themeDark: string
  categoryEssay: string
  newsletter: string
  testError: string
  defaultHomeDescription: string
  showMore: string
  showLess: string
  noMatchPrefix: string
  postLoading: string
  linkToSection: string
  relatedXPost: string
  viewXPost: string
  xTimeline: string
  followOnX: string
  xPosts: string
  share: string
  shareOn: string
  copyLink: string
  copied: string
  imageViewer: string
  close: string
  previousImage: string
  nextImage: string
  previousAndNextPosts: string
  footnotesHeading: string
  footnoteBackLabel: string
  timelineTitle: string
  timelineDescription: string
  linksTitle: string
  linksSubtitle: string
  linksPageDescription: string
  mcpFallbackTitle: string
  mcpFallbackDescription: string
  mcpLoadError: string
  mcpEnsureAvailable: string
  mcpLoading: string
}

const enDict: Dict = {
    navHome: 'Home',
    navPosts: 'Posts',
    navTimeline: 'Timeline',
    navAgent: 'Agent',
    navConsulting: 'Consulting',
    navMeet: 'Meet',
    navLinks: 'Links',
    navLanguage: 'Language',
    drafts: 'Drafts',
    latestPost: 'Latest post',
    readMore: 'Read more',
    nextPost: 'Next post',
    previousPost: 'Previous post',
    postsTitle: 'Posts',
    postsDescription: 'Essays, technical articles, and thoughts on building sovereign systems.',
    draftsDescription: 'Unpublished posts and works in progress.',
    viewDrafts: 'View drafts',
    backToPosts: 'Back to posts',
    searchPosts: 'Search posts',
    noPostsYet: 'No posts yet.',
    noDraftsYet: 'No drafts yet.',
    minRead: 'min read',
    xPost: 'X Post',
    notFoundTitle: '404',
    notFoundSubtitle: "This path isn't in the graph",
    notFoundDescription: "The page you're looking for doesn't exist or has been moved. You can head back to the homepage or browse recent posts.",
    goHome: 'Go home',
    browsePosts: 'Browse posts',
    keyTakeaways: 'Key takeaways',
    paginationPrevious: 'Previous',
    paginationNext: 'Next',
    paginationPage: 'Page',
    paginationOf: 'of',
    themeMenuLabel: 'Theme',
    themeMenuAriaLabel: 'Toggle theme menu',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    categoryEssay: 'Essay',
    newsletter: 'Newsletter',
    testError: 'Test Error',
    defaultHomeDescription:
      'Essays on user-owned agent memory, personal infrastructure, and building systems that restore sovereignty in an age of AI, crypto, and complexity.',
    showMore: 'Show more',
    showLess: 'Show less',
    noMatchPrefix: 'No posts match',
    postLoading: 'Loading...',
    linkToSection: 'Link to section',
    relatedXPost: 'Related X post',
    viewXPost: 'View X post',
    xTimeline: 'X timeline',
    followOnX: 'Follow on X',
    xPosts: 'X Posts',
    share: 'Share',
    shareOn: 'Share on',
    copyLink: 'Copy link',
    copied: 'OK',
    imageViewer: 'Image viewer',
    close: 'Close',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    previousAndNextPosts: 'Previous and next posts',
    footnotesHeading: 'Footnotes',
    footnoteBackLabel: 'Back to content',
    timelineTitle: 'Timeline',
    timelineDescription: 'Career and education history',
    linksTitle: 'Links',
    linksSubtitle: 'Connect with me across platforms',
    linksPageDescription: 'Links to profiles and contact channels.',
    mcpFallbackTitle: 'Agent',
    mcpFallbackDescription: 'Have your agent talk to my agent.',
    mcpLoadError: 'Could not load agent page',
    mcpEnsureAvailable: 'Ensure this URL is available',
    mcpLoading: 'Loading...',
}

const esDict: Dict = {
    navHome: 'Inicio',
    navPosts: 'Publicaciones',
    navTimeline: 'Trayectoria',
    navAgent: 'Agente',
    navConsulting: 'Consultoría',
    navMeet: 'Reunión',
    navLinks: 'Enlaces',
    navLanguage: 'Idioma',
    drafts: 'Borradores',
    latestPost: 'Última publicación',
    readMore: 'Seguir leyendo',
    nextPost: 'Siguiente publicación',
    previousPost: 'Publicación anterior',
    postsTitle: 'Publicaciones',
    postsDescription: 'Ensayos, artículos técnicos y reflexiones sobre sistemas soberanos.',
    draftsDescription: 'Publicaciones sin publicar y trabajos en progreso.',
    viewDrafts: 'Ver borradores',
    backToPosts: 'Volver a publicaciones',
    searchPosts: 'Buscar publicaciones',
    noPostsYet: 'Aún no hay publicaciones.',
    noDraftsYet: 'Aún no hay borradores.',
    minRead: 'min de lectura',
    xPost: 'Publicación en X',
    notFoundTitle: '404',
    notFoundSubtitle: 'Esta ruta no está en el grafo',
    notFoundDescription: 'La página que buscas no existe o se movió. Puedes volver al inicio o ver las publicaciones recientes.',
    goHome: 'Ir al inicio',
    browsePosts: 'Ver publicaciones',
    keyTakeaways: 'Puntos clave',
    paginationPrevious: 'Anterior',
    paginationNext: 'Siguiente',
    paginationPage: 'Página',
    paginationOf: 'de',
    themeMenuLabel: 'Tema',
    themeMenuAriaLabel: 'Abrir menú de tema',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    categoryEssay: 'Ensayo',
    newsletter: 'Newsletter',
    testError: 'Error de prueba',
    defaultHomeDescription:
      'Ensayos sobre memoria de agentes controlada por el usuario, infraestructura personal y sistemas que restauran la soberanía en una era de IA, cripto y complejidad.',
    showMore: 'Ver más',
    showLess: 'Ver menos',
    noMatchPrefix: 'No hay publicaciones que coincidan con',
    postLoading: 'Cargando...',
    linkToSection: 'Enlace a la sección',
    relatedXPost: 'Publicación relacionada en X',
    viewXPost: 'Ver publicación en X',
    xTimeline: 'Timeline de X',
    followOnX: 'Seguir en X',
    xPosts: 'Publicaciones en X',
    share: 'Compartir',
    shareOn: 'Compartir en',
    copyLink: 'Copiar enlace',
    copied: 'OK',
    imageViewer: 'Visor de imágenes',
    close: 'Cerrar',
    previousImage: 'Imagen anterior',
    nextImage: 'Siguiente imagen',
    previousAndNextPosts: 'Publicación anterior y siguiente',
    footnotesHeading: 'Notas al pie',
    footnoteBackLabel: 'Volver al contenido',
    timelineTitle: 'Trayectoria',
    timelineDescription: 'Trayectoria profesional y educativa',
    linksTitle: 'Enlaces',
    linksSubtitle: 'Conecta conmigo en distintas plataformas',
    linksPageDescription: 'Enlaces a perfiles y canales de contacto.',
    mcpFallbackTitle: 'Agente',
    mcpFallbackDescription: 'Haz que tu agente hable con mi agente.',
    mcpLoadError: 'No se pudo cargar la página de agente',
    mcpEnsureAvailable: 'Asegúrate de que esta URL esté disponible',
    mcpLoading: 'Cargando...',
}

const caDict: Dict = {
    navHome: 'Inici',
    navPosts: 'Publicacions',
    navTimeline: 'Trajectòria',
    navAgent: 'Agent',
    navConsulting: 'Consultoria',
    navMeet: 'Trobada',
    navLinks: 'Enllaços',
    navLanguage: 'Idioma',
    drafts: 'Esborranys',
    latestPost: 'Última publicació',
    readMore: 'Llegir més',
    nextPost: 'Publicació següent',
    previousPost: 'Publicació anterior',
    postsTitle: 'Publicacions',
    postsDescription: 'Assajos, articles tècnics i reflexions sobre sistemes sobirans.',
    draftsDescription: 'Publicacions no publicades i treball en curs.',
    viewDrafts: 'Veure esborranys',
    backToPosts: 'Tornar a publicacions',
    searchPosts: 'Cercar publicacions',
    noPostsYet: 'Encara no hi ha publicacions.',
    noDraftsYet: 'Encara no hi ha esborranys.',
    minRead: 'min de lectura',
    xPost: 'Publicació a X',
    notFoundTitle: '404',
    notFoundSubtitle: 'Aquest camí no és al graf',
    notFoundDescription: "La pàgina que busques no existeix o s'ha mogut. Pots tornar a l'inici o veure les publicacions recents.",
    goHome: "Anar a l'inici",
    browsePosts: 'Veure publicacions',
    keyTakeaways: 'Punts clau',
    paginationPrevious: 'Anterior',
    paginationNext: 'Següent',
    paginationPage: 'Pàgina',
    paginationOf: 'de',
    themeMenuLabel: 'Tema',
    themeMenuAriaLabel: 'Obrir menú de tema',
    themeSystem: 'Sistema',
    themeLight: 'Clar',
    themeDark: 'Fosc',
    categoryEssay: 'Assaig',
    newsletter: 'Butlletí',
    testError: 'Error de prova',
    defaultHomeDescription:
      "Assajos sobre memòria d'agents controlada per l'usuari, infraestructura personal i sistemes que restauren la sobirania en una era d'IA, cripto i complexitat.",
    showMore: 'Mostra més',
    showLess: 'Mostra menys',
    noMatchPrefix: 'No hi ha publicacions que coincideixin amb',
    postLoading: 'Carregant...',
    linkToSection: 'Enllaç a la secció',
    relatedXPost: 'Publicació relacionada a X',
    viewXPost: 'Veure publicació a X',
    xTimeline: "Timeline d'X",
    followOnX: 'Segueix a X',
    xPosts: "Publicacions d'X",
    share: 'Comparteix',
    shareOn: 'Comparteix a',
    copyLink: 'Copia enllaç',
    copied: 'OK',
    imageViewer: "Visor d'imatges",
    close: 'Tanca',
    previousImage: 'Imatge anterior',
    nextImage: 'Imatge següent',
    previousAndNextPosts: 'Publicació anterior i següent',
    footnotesHeading: 'Notes al peu',
    footnoteBackLabel: 'Tornar al contingut',
    timelineTitle: 'Trajectòria',
    timelineDescription: 'Trajectòria professional i educativa',
    linksTitle: 'Enllaços',
    linksSubtitle: 'Connecta amb mi a diferents plataformes',
    linksPageDescription: 'Enllaços a perfils i canals de contacte.',
    mcpFallbackTitle: 'Agent',
    mcpFallbackDescription: 'Fes que el teu agent parli amb el meu agent.',
    mcpLoadError: "No s'ha pogut carregar la pàgina d'agent",
    mcpEnsureAvailable: 'Assegura que aquesta URL estigui disponible',
    mcpLoading: 'Carregant...',
}

function withEnglishFallback(overrides: Partial<Dict>): Dict {
  return { ...enDict, ...overrides }
}

function generatedLocaleDict(locale: string): Dict {
  const generated = (generatedDictionaries as Record<string, Partial<Dict> | undefined>)[locale]
  return generated ? withEnglishFallback(generated) : enDict
}

const dictionaries: Record<SupportedLocale, Dict> = {
  en: enDict,
  es: esDict,
  ca: caDict,
  zh: generatedLocaleDict('zh'),
  hi: generatedLocaleDict('hi'),
  ar: generatedLocaleDict('ar'),
  fr: generatedLocaleDict('fr'),
  pt: generatedLocaleDict('pt'),
  ru: generatedLocaleDict('ru'),
  bn: generatedLocaleDict('bn'),
  ur: generatedLocaleDict('ur'),
  id: generatedLocaleDict('id'),
  de: generatedLocaleDict('de'),
}

export function getDictionary(locale: SupportedLocale): Dict {
  return dictionaries[locale] ?? enDict
}
