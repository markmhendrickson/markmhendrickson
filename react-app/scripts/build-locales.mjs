import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const setting = fs.readFileSync(path.join(app, '.env.production'), 'utf8')
const match = /^VITE_WEBSITE_LOCALES=(.+)$/m.exec(setting)
if (!match) throw new Error('Production website locales are not configured')
export const buildLocales = match[1].split(',').map((locale) => locale.trim())
export const prefixedBuildLocales = buildLocales.filter((locale) => locale !== 'en')
const config = fs.readFileSync(path.join(app, 'src/i18n/config.ts'), 'utf8')
const availableList = /export const availableLocales = \[([\s\S]*?)\]/.exec(config)?.[1]
if (!availableList) throw new Error('Available website locales were not found')
export const availableLocales = [...availableList.matchAll(/'([a-z]{2})'/g)].map((match) => match[1])
export const removedLocales = availableLocales.filter((locale) => !buildLocales.includes(locale))
