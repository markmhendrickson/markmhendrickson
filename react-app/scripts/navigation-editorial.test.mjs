import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const dist = process.env.WEBSITE_TEST_DIST ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

const { render } = await import(pathToFileURL(path.join(dist, 'server/entry-server.js')).href)

function visibleHtml(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
}

test('collapsed navigation has named, localized destinations in generated pages', () => {
  for (const [page, labels] of [
    ['index.html', [['Home', '/'], ['Posts', '/posts/']]],
    ['es/index.html', [['Inicio', '/es/'], ['Publicaciones', '/es/posts/']]],
  ]) {
    const html = fs.readFileSync(path.join(dist, page), 'utf8')
    const menuLinks = [...html.matchAll(/<a\b[^>]*class="[^"]*peer\/menu-button[^"]*"[^>]*>/g)].map((match) => match[0])
    assert(menuLinks.length >= 8, `${page}: rendered icon-rail links exist`)
    for (const [label, href] of labels) {
      assert(menuLinks.some((link) => link.includes(`aria-label="${label}"`) && link.includes(`href="${href}"`)), `${page}: ${label} names ${href}`)
    }
  }
})

test('the hydrated collapsed desktop expand control has an accessible name in every locale', () => {
  const labels = {
    en: 'Expand sidebar',
    es: 'Expandir la barra lateral',
    ca: 'Amplia la barra lateral',
    zh: '展开侧边栏',
    hi: 'साइडबार फैलाएँ',
    ar: 'توسيع الشريط الجانبي',
    fr: 'Développer la barre latérale',
    pt: 'Expandir a barra lateral',
    ru: 'Развернуть боковую панель',
    bn: 'সাইডবার প্রসারিত করুন',
    ur: 'سائیڈ بار پھیلائیں',
    id: 'Perluas bilah sisi',
    de: 'Seitenleiste erweitern',
  }
  const probe = path.join(path.dirname(fileURLToPath(import.meta.url)), 'desktop-sidebar-name.probe.mjs')
  for (const [locale, expected] of Object.entries(labels)) {
    const output = execFileSync(process.execPath, [probe, dist, locale], { encoding: 'utf8', timeout: 10000 })
    assert.equal(JSON.parse(output).label, expected, `${locale}: hydrated desktop expand control name`)
  }
})

test('the two product footer cards render as distinct public destinations', () => {
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  assert(html.includes('The system of record for AI agents.'))
  assert(html.includes('Building the operating system for agentic organizations.'))
  assert(html.includes('An open-source project in development for organizing agents, tasks, and plans across supported tools.'))
  assert(html.includes('utm_campaign=products_site_footer'))
  assert(html.includes('github.com/markmhendrickson/ateles'))
  for (const [locale, title, description] of [
    ['es', 'Construyendo el sistema operativo para organizaciones de agentes.', 'Un proyecto de código abierto en desarrollo para organizar agentes, tareas y planes con las herramientas compatibles.'],
    ['ca', "Construint el sistema operatiu per a organitzacions d'agents.", 'Un projecte de codi obert en desenvolupament per organitzar agents, tasques i plans amb les eines compatibles.'],
  ]) {
    const localized = fs.readFileSync(path.join(dist, locale, 'index.html'), 'utf8')
    assert(localized.includes(title.replaceAll("'", '&#x27;')), `${locale}: Ateles development status is visible`)
    assert(localized.includes(description), `${locale}: Ateles supported-tools scope is visible`)
  }
  const localizedAteles = {
    zh: '一个开发中的开源项目', hi: 'विकासाधीन ओपन-सोर्स परियोजना', ar: 'مشروع مفتوح المصدر قيد التطوير',
    fr: 'Un projet open source en cours de développement', pt: 'Um projeto de código aberto em desenvolvimento',
    ru: 'Открытый проект в разработке', bn: 'উন্নয়নাধীন ওপেন-সোর্স প্রকল্প', ur: 'زیرِ ترقی اوپن سورس منصوبہ',
    id: 'Proyek sumber terbuka yang sedang dikembangkan', de: 'Ein quelloffenes Projekt in Entwicklung',
  }
  for (const [locale, phrase] of Object.entries(localizedAteles)) {
    const localized = fs.readFileSync(path.join(dist, locale, 'index.html'), 'utf8')
    assert(localized.includes(phrase), `${locale}: localized development status is visible`)
    assert(!localized.includes('An open-source project in development for organizing agents, tasks, and plans across supported tools.'), `${locale}: no English footer fallback`)
  }
})

test('an editorial post promotes the opening hero once, expands takeover art, and calls out one bold message', () => {
  const body = [
    '![Opening image](/images/editorial-opening.png "hero")',
    '',
    'Opening paragraph remains in the article.',
    '',
    '![Full width image](/images/editorial-full.png "takeover")',
    '',
    '> **The key message stands alone.**',
  ].join('\n')
  const html = visibleHtml(render('/posts/editorial-fixture/', {}, {
    unlistedPost: { slug: 'editorial-fixture', title: 'Editorial fixture', published: true, body },
  }))

  assert(/<header class="post-takeover\b[^>]*>[\s\S]*?<img src="\/images\/editorial-opening\.png"/.test(html), 'opening image becomes the editorial hero')
  assert.equal((html.match(/<img src="\/images\/editorial-opening\.png"/g) ?? []).length, 1, 'opening image is not duplicated in the article')
  assert(html.includes('Opening paragraph remains in the article.'), 'opening prose remains in the article')
  assert(/class="post-takeover not-prose[^\"]*"[^>]*><img src="\/images\/editorial-full\.png"/.test(html), 'takeover image gets the full-bleed treatment')
  assert(/<aside class="post-message not-prose" role="note">[\s\S]*?<strong>The key message stands alone\.<\/strong>[\s\S]*?<\/aside>/.test(html), 'one bold blockquote becomes the key-message aside')
  assert(!/<a\b(?=[^>]*href="\/posts\/editorial-fixture\.md")[^>]*>/.test(html), 'an injected review fixture has no public Markdown action')
})

test('the localized raw Markdown header action is present for a public post and absent for its unlisted preview', () => {
  const labels = {
    en: 'View Markdown',
    es: 'Ver Markdown',
    ca: 'Veure Markdown',
    zh: '查看 Markdown',
    hi: 'Markdown देखें',
    ar: 'عرض Markdown',
    fr: 'Voir le Markdown',
    pt: 'Ver Markdown',
    ru: 'Просмотреть Markdown',
    bn: 'Markdown দেখুন',
    ur: 'Markdown دیکھیں',
    id: 'Lihat Markdown',
    de: 'Markdown anzeigen',
  }
  const slug = 'the-human-inversion-the-attention-ceiling'
  for (const [locale, label] of Object.entries(labels)) {
    const localePath = locale === 'en' ? '' : `${locale}/`
    const publicHtml = visibleHtml(fs.readFileSync(path.join(dist, localePath, `posts/${slug}/index.html`), 'utf8'))
    const href = `/${localePath}posts/${slug}.md`
    const actions = [...publicHtml.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag)
    assert(actions.some((tag) => tag.includes(`href="${href}"`) && tag.includes(`aria-label="${label}"`)), `${locale}: public post names its Markdown action`)
  }
  const unlistedHtml = visibleHtml(render('/posts/unlisted-editorial-fixture/', {}, {
    unlistedPost: { slug: 'unlisted-editorial-fixture', title: 'Unlisted fixture', published: true, unlisted: true, body: 'Preview body.' },
  }))

  assert(!/<a\b(?=[^>]*href="\/posts\/unlisted-editorial-fixture\.md")[^>]*>/.test(unlistedHtml), 'unlisted review omits the header action')
  assert(unlistedHtml.includes('data-testid="unlisted-preview-status"'), 'unlisted preview keeps its visible footer status')
  assert(unlistedHtml.includes('>Preview</span>'), 'the preview status is visible to readers')
  assert(unlistedHtml.includes('Preview body.'), 'unlisted article still renders')
})
