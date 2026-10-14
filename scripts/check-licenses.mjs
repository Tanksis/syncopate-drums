// Fails if any package shipped in the app (a non-dev dependency in package-lock.json)
// is not MIT, ISC or CC0. Dev tooling (Vite, Vitest, TypeScript) is not shipped and not checked.
// The looks' self-hosted fonts (`@fontsource/*`) may also be OFL-1.1, and only they (ADR 0013).
import { readFileSync } from 'node:fs'

const allowed = new Set(['MIT', 'ISC', 'CC0-1.0'])
const fontsAllowed = new Set([...allowed, 'OFL-1.1'])
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))

const name = (path) => path.replace(/^.*node_modules\//, '')
const bad = Object.entries(lock.packages)
  .filter(([path, pkg]) => path !== '' && !pkg.dev)
  .filter(([path, pkg]) => !(name(path).startsWith('@fontsource/') ? fontsAllowed : allowed).has(pkg.license))
  .map(([path, pkg]) => `${name(path)}: ${pkg.license ?? 'unknown'}`)

if (bad.length) {
  console.error(`Dependencies that are not MIT, ISC or CC0 (or OFL-1.1 for an @fontsource font):\n  ${bad.join('\n  ')}`)
  process.exit(1)
}
console.log('All shipped dependencies are MIT, ISC or CC0, and the fonts OFL-1.1.')
