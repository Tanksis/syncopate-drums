// Fails if any package shipped in the app (a non-dev dependency in package-lock.json)
// is not MIT or CC0. Dev tooling (Vite, Vitest, TypeScript) is not shipped and not checked.
import { readFileSync } from 'node:fs'

const allowed = new Set(['MIT', 'CC0-1.0'])
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))

const bad = Object.entries(lock.packages)
  .filter(([path, pkg]) => path !== '' && !pkg.dev)
  .filter(([, pkg]) => !allowed.has(pkg.license))
  .map(([path, pkg]) => `${path.replace(/^.*node_modules\//, '')}: ${pkg.license ?? 'unknown'}`)

if (bad.length) {
  console.error(`Dependencies that are not MIT or CC0:\n  ${bad.join('\n  ')}`)
  process.exit(1)
}
console.log('All shipped dependencies are MIT or CC0.')
