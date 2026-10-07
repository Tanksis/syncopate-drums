// Export and import: the JSON file that moves exercises between computers.

import { GROOVE_PRESETS } from './groove'
import { migrateExercise } from './migrate'
import type { Duration, Exercise, Hand, Item, StickingMode, Voice } from './model'
import { MAX_BPM, MAX_SWING, MIN_BPM, MIN_SWING, SCHEMA_VERSION, TICKS_PER_BAR, itemTicks } from './model'

/** Marks a file as an exercise export. Chosen before the app was named, and kept. */
export const EXPORT_FORMAT = 'drum-app-exercises'

export interface ExportFile {
  format: typeof EXPORT_FORMAT
  /** The schema version the exercises are stored in. */
  version: number
  exercises: Exercise[]
}

/** The export file for some exercises, each in its stored shape. Device settings are never in it. */
export function exportFile(exercises: Exercise[]): ExportFile {
  return { format: EXPORT_FORMAT, version: SCHEMA_VERSION, exercises }
}

/** Characters Windows, macOS or Linux don't allow in a file name, and control characters. */
const NOT_IN_FILE_NAMES = /[<>:"/\\|?*\u0000-\u001f]/g

/**
 * The export's file name: the exercise's name, cleaned up, for one exercise, and
 * `drum-exercises-YYYY-MM-DD.json` with today's local date for several.
 */
export function exportFileName(exercises: Pick<Exercise, 'name'>[], today: Date): string {
  if (exercises.length !== 1) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `drum-exercises-${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.json`
  }
  const name = exercises[0].name
    .replace(NOT_IN_FILE_NAMES, '')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/, '')
    .trim()
  return `${name || 'drum-exercise'}.json`
}

export type ParsedImport = { ok: true; exercises: Exercise[] } | { ok: false; reason: string }

/**
 * The exercises in an import file, brought up to the current schema through the same migration
 * chain as the database. A file from a newer version of the app, a malformed one, or one that
 * isn't an exercise export is refused whole, with a reason to show the drummer.
 */
export function parseImport(json: string, appVersion: number = SCHEMA_VERSION): ParsedImport {
  const file = parseJson(json)
  if (!isRecord(file) || file.format !== EXPORT_FORMAT) return refuse(NOT_AN_EXPORT)
  const { version, exercises } = file
  if (!isWholeNumber(version) || !Array.isArray(exercises)) return refuse(NOT_AN_EXPORT)
  if (version > appVersion) return refuse(NEWER)
  if (exercises.length === 0) return refuse('This file holds no exercises, so nothing was imported.')

  const read: Exercise[] = []
  for (const [index, stored] of exercises.entries()) {
    const which = `exercise ${index + 1}`
    if (!isRecord(stored)) return refuse(damaged(`${which} isn't an exercise`))
    // An exercise without its own schema version is in the file's.
    const storedVersion = stored.schemaVersion ?? version
    if (!isWholeNumber(storedVersion)) return refuse(damaged(`${which} has no schema version`))
    if (storedVersion > appVersion) return refuse(NEWER)
    const exercise = migrateExercise({ ...stored, schemaVersion: storedVersion })
    const problem = exerciseProblem(exercise)
    if (problem) return refuse(damaged(`${which}${named(exercise)} ${problem}`))
    if (read.some((e) => e.id === exercise.id)) return refuse(damaged(`${which}${named(exercise)} has the same id as another`))
    read.push(exercise)
  }
  return { ok: true, exercises: read }
}

/** How many of the imported exercises the library already holds, matched by id only. */
export function importConflicts(incoming: Pick<Exercise, 'id'>[], existingIds: readonly string[]): number {
  const existing = new Set(existingIds)
  return incoming.filter((e) => existing.has(e.id)).length
}

/** What to do with every imported exercise the library already holds. */
export type ImportChoice = 'replace' | 'keepBoth' | 'skip'

/**
 * The exercises to store for an import: those new to the library as they are, and the ones it
 * already holds replaced, kept as copies under new ids with the same names, or skipped. An import
 * only ever adds and replaces; it never deletes.
 */
export function planImport(
  incoming: Exercise[],
  existingIds: readonly string[],
  choice: ImportChoice,
  { newId }: { newId: () => string },
): Exercise[] {
  const existing = new Set(existingIds)
  return incoming.flatMap((exercise) => {
    if (!existing.has(exercise.id) || choice === 'replace') return [exercise]
    return choice === 'keepBoth' ? [{ ...exercise, id: newId() }] : []
  })
}

const named = (exercise: { name?: unknown }) => (typeof exercise.name === 'string' ? ` (“${exercise.name}”)` : '')

const damaged = (problem: string) => `This file is damaged: ${problem}. Nothing was imported.`

const NOT_AN_EXPORT = "This file isn't a Syncopate! export, so nothing was imported."
const NEWER = 'This file is from a newer version of Syncopate! Update the app to import it.'

const refuse = (reason: string): ParsedImport => ({ ok: false, reason })

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch {
    return undefined
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isWholeNumber = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

const oneOf = (value: unknown, options: readonly unknown[]) => options.includes(value)
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** What is wrong with an exercise read from a file, in the current shape, or null if nothing is. */
function exerciseProblem(exercise: Exercise): string | null {
  const e = exercise as unknown as Record<string, unknown>
  if (typeof e.id !== 'string' || e.id === '') return 'has no id'
  if (typeof e.name !== 'string') return 'has no name'
  if (!Array.isArray(e.bars) || e.bars.length === 0) return 'has no bars'
  if (!e.bars.every(isBar)) return "has a bar that isn't four beats of notes and rests"
  if (!oneOf(e.voice, VOICES)) return 'has an unknown voice'
  if (!oneOf(e.sticking, STICKING_MODES)) return 'has an unknown sticking mode'
  if (!oneOf(e.leadHand, HANDS)) return 'has an unknown lead hand'
  if (!isFiniteNumber(e.lastOpened)) return 'has no last-opened time'
  return practiceProblem(e.practice, e.bars.length)
}

function practiceProblem(practice: unknown, barCount: number): string | null {
  if (!isRecord(practice)) return 'has no practice settings'
  const { bpm, swing, groove, loopRange } = practice
  if (!isFiniteNumber(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) return 'has a tempo out of range'
  if (!isFiniteNumber(swing) || swing < MIN_SWING || swing > MAX_SWING) return 'has a swing amount out of range'
  if (!oneOf(groove, GROOVE_PRESETS.map((p) => p.id))) return 'has an unknown groove'
  if (loopRange === null) return null
  if (
    !isRecord(loopRange) ||
    !isWholeNumber(loopRange.first) ||
    !isWholeNumber(loopRange.last) ||
    loopRange.first > loopRange.last ||
    loopRange.last >= barCount
  ) {
    return 'has a loop range outside its bars'
  }
  return null
}

function isBar(bar: unknown): boolean {
  if (!isRecord(bar) || !Array.isArray(bar.items) || !bar.items.every(isItem)) return false
  return bar.items.reduce((ticks: number, item: Item) => ticks + itemTicks(item), 0) === TICKS_PER_BAR
}

function isItem(item: unknown): item is Item {
  if (!isRecord(item)) return false
  const { kind, duration, dotted, triplet } = item
  if (!oneOf(duration, DURATIONS) || typeof dotted !== 'boolean' || typeof triplet !== 'boolean') return false
  if (kind === 'rest') return true
  return kind === 'note' && typeof item.tiedToNext === 'boolean' && (item.override === undefined || oneOf(item.override, HANDS))
}

const VOICES: Voice[] = ['snare', 'bass']
const STICKING_MODES: StickingMode[] = ['natural', 'alternate', 'off']
const HANDS: Hand[] = ['R', 'L']
const DURATIONS: Duration[] = ['quarter', 'eighth', 'sixteenth']
