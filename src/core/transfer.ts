// Export and import: the JSON file that moves exercises between computers.

import { inKnownFolder } from './folders'
import { PATTERN_IDS, fittedPractice } from './groove'
import { migrateExercise } from './migrate'
import type { Duration, Exercise, Folder, Hand, Item, StickingMode, TimeSignature } from './model'
import {
  BASS_DRUM_SETTINGS,
  HIHAT_FOOT_SETTINGS,
  MAX_BPM,
  MAX_SWING,
  MIN_BPM,
  MIN_SWING,
  ROWS,
  SCHEMA_VERSION,
  TIME_SIGNATURES,
  barTicks,
  itemTicks,
  meter,
} from './model'
import { fittedBars } from './speller'

/** Marks a file as an exercise export. Chosen before the app was named, and kept. */
export const EXPORT_FORMAT = 'drum-app-exercises'

export interface ExportFile {
  format: typeof EXPORT_FORMAT
  /** The schema version the exercises are stored in. */
  version: number
  /** The folders the exercises are in, so an import can file them by name. From version 3. */
  folders: Folder[]
  exercises: Exercise[]
}

/**
 * The export file for some exercises, each in its stored shape, with the folders they're in.
 * Device settings (the tab, collapsed folders) are never in it.
 */
export function exportFile(exercises: Exercise[], folders: readonly Folder[]): ExportFile {
  const used = new Set(exercises.map((e) => e.folderId))
  return { format: EXPORT_FORMAT, version: SCHEMA_VERSION, folders: folders.filter((f) => used.has(f.id)), exercises }
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

export type ParsedImport = { ok: true; exercises: Exercise[]; folders: Folder[] } | { ok: false; reason: string }

/**
 * The exercises in an import file, brought up to the current schema through the same migration
 * chain as the database, and the folders they're in. One whose folder the file doesn't list is in
 * no folder; a file from before folders has none. A file from a newer version of the app, a
 * malformed one, or one that isn't an exercise export is refused whole, with a reason to show the
 * drummer. Each exercise is fitted to its time signature.
 */
export function parseImport(json: string, appVersion: number = SCHEMA_VERSION): ParsedImport {
  const file = parseJson(json)
  if (!isRecord(file) || file.format !== EXPORT_FORMAT) return refuse(NOT_AN_EXPORT)
  const { version, exercises } = file
  if (!isWholeNumber(version) || !Array.isArray(exercises)) return refuse(NOT_AN_EXPORT)
  if (version > appVersion) return refuse(NEWER)
  if (exercises.length === 0) return refuse('This file holds no exercises, so nothing was imported.')
  const folders = file.folders ?? []
  if (!Array.isArray(folders)) return refuse(damaged("its folders aren't a list"))
  for (const [index, folder] of folders.entries()) {
    if (!isRecord(folder) || typeof folder.id !== 'string' || typeof folder.name !== 'string') {
      return refuse(damaged(`folder ${index + 1} has no id or name`))
    }
  }

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
    read.push(inKnownFolder(fitted(exercise), folders))
  }
  return { ok: true, exercises: read, folders }
}

/**
 * An imported exercise as the app could have written it: in compound time a straight beat keeps
 * only its downbeat, and a pattern or hi-hat foot its time signature doesn't offer is turned off,
 * as a change to that time signature does. A hand-edited file is fitted rather than refused.
 */
function fitted(exercise: Exercise): Exercise {
  const { bars, timeSignature, practice } = exercise
  return { ...exercise, bars: fittedBars(bars, timeSignature, timeSignature), practice: fittedPractice(practice, timeSignature) }
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
  if (!oneOf(e.timeSignature, TIME_SIGNATURES)) return 'has an unknown time signature'
  const { beats } = meter(e.timeSignature as TimeSignature)
  if (!e.bars.every((bar) => isBar(bar, beats))) return `has a bar that isn't ${e.timeSignature} of notes and rests in each row`
  if (!oneOf(e.sticking, STICKING_MODES)) return 'has an unknown sticking mode'
  if (!oneOf(e.leadHand, HANDS)) return 'has an unknown lead hand'
  if (!isFiniteNumber(e.lastOpened)) return 'has no last-opened time'
  if (e.folderId !== null && typeof e.folderId !== 'string') return 'has an unknown folder'
  return practiceProblem(e.practice, e.bars.length)
}

function practiceProblem(practice: unknown, barCount: number): string | null {
  if (!isRecord(practice)) return 'has no practice settings'
  const { bpm, swing, pattern, bassDrum, hihatFoot, loopRange } = practice
  if (!isFiniteNumber(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) return 'has a BPM out of range'
  if (!isFiniteNumber(swing) || swing < MIN_SWING || swing > MAX_SWING) return 'has a swing amount out of range'
  if (!oneOf(pattern, PATTERN_IDS)) return 'has an unknown pattern'
  if (!oneOf(bassDrum, BASS_DRUM_SETTINGS)) return 'has an unknown bass drum setting'
  if (!oneOf(hihatFoot, HIHAT_FOOT_SETTINGS)) return 'has an unknown hi-hat foot setting'
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

function isBar(bar: unknown, beats: number): boolean {
  return isRecord(bar) && ROWS.every((row) => isRowOfBar(bar[row], beats))
}

/** One row of a bar: notes and rests adding up to the bar's beats. */
function isRowOfBar(items: unknown, beats: number): boolean {
  if (!Array.isArray(items) || !items.every(isItem)) return false
  return items.reduce((ticks: number, item: Item) => ticks + itemTicks(item), 0) === barTicks(beats)
}

function isItem(item: unknown): item is Item {
  if (!isRecord(item)) return false
  const { kind, duration, dotted, triplet } = item
  if (!oneOf(duration, DURATIONS) || typeof dotted !== 'boolean' || typeof triplet !== 'boolean') return false
  if (kind === 'rest') return true
  return kind === 'note' && typeof item.tiedToNext === 'boolean' && (item.override === undefined || oneOf(item.override, HANDS))
}

const STICKING_MODES: StickingMode[] = ['natural', 'alternate', 'off']
const HANDS: Hand[] = ['R', 'L']
const DURATIONS: Duration[] = ['quarter', 'eighth', 'sixteenth']
