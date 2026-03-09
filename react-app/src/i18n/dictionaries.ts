import type { SupportedLocale } from './config'

type Dict = {
  navHome: string
  navPosts: string
  navTimeline: string
  navAgent: string
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
}

const dictionaries: Record<SupportedLocale, Dict> = {
  en: {
    navHome: 'Home',
    navPosts: 'Posts',
    navTimeline: 'Timeline',
    navAgent: 'Agent',
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
  },
  es: {
    navHome: 'Inicio',
    navPosts: 'Publicaciones',
    navTimeline: 'Trayectoria',
    navAgent: 'Agente',
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
  },
  ca: {
    navHome: 'Inici',
    navPosts: 'Publicacions',
    navTimeline: 'Trajectòria',
    navAgent: 'Agent',
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
  },
}

export function getDictionary(locale: SupportedLocale): Dict {
  return dictionaries[locale]
}
