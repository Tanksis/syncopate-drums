import { describe, expect, it } from 'vitest'
import type { StaffEvent } from './index'
import {
  ROWS,
  SCHEMA_VERSION,
  TICKS_PER_BAR,
  TRIPLET_SWING,
  exampleExercises,
  isUnchangedNew,
  itemTicks,
  staffParts,
  sticking,
} from './index'

const ids = () => {
  let n = 0
  return () => `id-${++n}`
}

const examples = exampleExercises({ newId: ids(), now: 1000 })

describe('the example exercises', () => {
  it('are four, named for what they show, in order', () => {
    expect(examples.map((e) => e.name)).toEqual([
      'Example: syncopated eighths',
      'Example: jazz comping',
      'Example: rock beat',
      'Example: triplets',
    ])
  })

  it('come out the same from two calls, but under new ids', () => {
    const again = exampleExercises({ newId: () => crypto.randomUUID(), now: 1000 })
    const ids = new Set([...examples, ...again].map((e) => e.id))
    expect(ids.size).toBe(8)
    expect(again.map(({ id: _, ...rest }) => rest)).toEqual(examples.map(({ id: _, ...rest }) => rest))
  })

  it('are valid exercises of this version, ready to store', () => {
    for (const exercise of examples) {
      expect(exercise.schemaVersion).toBe(SCHEMA_VERSION)
      expect(exercise.lastOpened).toBe(1000)
      expect(isUnchangedNew(exercise)).toBe(false)
    }
  })

  it('fill every bar with four beats in both rows', () => {
    for (const exercise of examples) {
      for (const bar of exercise.bars) {
        for (const row of ROWS) expect(bar[row].reduce((sum, item) => sum + itemTicks(item), 0)).toBe(TICKS_PER_BAR)
      }
    }
  })
})

describe('what each example shows', () => {
  const [eighths, comping, rock, triplets] = examples

  /** Each event of a part as `start drums`, or `start rest`. */
  const show = (events: readonly StaffEvent[]) =>
    events.map((e) => `${e.start} ${e.kind === 'chord' ? e.notes.map((n) => n.drum).join('+') : e.kind}`)

  it('syncopated eighths: a snare line, straight, with natural sticking from the right hand', () => {
    expect(eighths.practice).toMatchObject({ groove: 'off', swing: 0.5 })
    expect(sticking(eighths).slice(0, 6).map((n) => n.shown)).toEqual(['R', 'R', 'L', 'R', 'R', 'L'])
  })

  it("jazz comping: swung over the jazz ride, the snare's & of 2 in bar 1 written on the let", () => {
    expect(comping.practice).toMatchObject({ groove: 'jazz', swing: TRIPLET_SWING })
    expect(comping.sticking).toBe('off')
    const hands = staffParts(comping.bars, 'jazz', { swung: true })[0].hands
    expect(hands.find((e) => e.start === 20)).toMatchObject({ triplet: true, strikes: [18] })
    expect(show(hands)).toContain('20 ride+snare')
  })

  it('rock beat: kicks on the hi-hat stems in bar 1, and the feet part in bar 2 for the kick off the hi-hat', () => {
    expect(rock.practice).toMatchObject({ groove: 'hihatEighths', swing: 0.5 })
    const [bar1, bar2] = staffParts(rock.bars, 'hihatEighths')
    expect(show(bar1.hands)).toEqual([
      '0 hihat+bass',
      '6 hihat',
      '12 hihat+snare',
      '18 hihat',
      '24 hihat+bass',
      '30 hihat+bass',
      '36 hihat+snare',
      '42 hihat',
    ])
    expect(bar1.feet).toEqual([])
    expect(show(bar2.feet).filter((e) => e.endsWith('bass'))).toEqual(['0 bass', '21 bass', '30 bass'])
  })

  it('triplets: alternate sticking runs R L through every note, across the bar line', () => {
    expect(triplets.sticking).toBe('alternate')
    const hands = sticking(triplets).map((n) => n.shown)
    expect(hands).toHaveLength(18)
    expect(hands.join('')).toBe('RLRLRLRLRLRLRLRLRL')
  })
})
