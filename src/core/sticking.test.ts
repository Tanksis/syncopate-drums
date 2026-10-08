import { describe, expect, it } from 'vitest'
import type { Exercise, Hand, StickingMode } from './index'
import { newExercise, setBeat, sticking, toggleTie } from './index'

/** An exercise from beat figures, one string per beat: `['x.x.', 'xxx', '....', …]`. */
const line = (beats: string[], options: { mode?: StickingMode; lead?: Hand } = {}): Exercise => {
  const ex = newExercise({ id: 'e1', now: 0 })
  let bars = ex.bars
  beats.forEach((hits, i) => {
    const bar = Math.floor(i / 4)
    while (bars.length <= bar) bars = [...bars, ...newExercise({ id: 'x', now: 0 }).bars]
    bars = setBeat(bars, 'snare', bar, i % 4, hits)
  })
  return { ...ex, bars, sticking: options.mode ?? 'natural', leadHand: options.lead ?? 'R' }
}

/** The beat's first note tied to the previous beat's last note. */
const tiedInto = (ex: Exercise, bar: number, beat: number): Exercise => ({
  ...ex,
  bars: toggleTie(ex.bars, 'snare', bar, beat),
})

/** The shown hands in order, with `-` for a note that shows none. */
const shown = (ex: Exercise) => sticking(ex).map((n) => n.shown ?? '-').join('')

describe('natural sticking', () => {
  it('starts straight beats on the lead hand and runs back-to-back triplet beats on, across bar lines', () => {
    // 3♪♪♪ | ♪♪ | 3♪♪♪ | 3♪♪♪, then the triplet run carries over into bar 2.
    const ex = line(['xxx', 'x.x.', 'xxx', 'xxx', 'xxx', 'x...'])
    expect(shown(ex)).toBe('RLR' + 'RL' + 'RLR' + 'LRL' + 'RLR' + 'R')
  })

  it('puts a dotted eighth and sixteenth on the sixteenth grid: R . . L', () => {
    expect(shown(line(['x..x']))).toBe('RL')
  })

  it('plays a triplet quarter and eighth R . R', () => {
    expect(shown(line(['x.x']))).toBe('RR')
  })

  it('gives a note after a rest the hand of its grid position', () => {
    expect(shown(line(['.x.x', '.x.', '..x', 'x...']))).toBe('LL' + 'L' + 'L' + 'R')
  })

  it('starts on L when L leads', () => {
    expect(shown(line(['xxx', 'xxx', 'x.x.'], { lead: 'L' }))).toBe('LRL' + 'RLR' + 'LR')
  })

  it('lets a tied continuation use up its grid position without a hand', () => {
    const ex = tiedInto(line(['x.x.', 'x.x.']), 0, 1)
    expect(sticking(ex).map((n) => n.noteId)).toEqual(['0:0', '0:6', '0:18'])
    expect(shown(ex)).toBe('RL' + 'L')
  })
})

describe('alternate sticking', () => {
  it('strictly alternates over struck notes, across bar lines', () => {
    const ex = line(['x.x.', 'x...', '....', 'x.x.', 'x...', 'x...'], { mode: 'alternate' })
    expect(shown(ex)).toBe('RLRLRLR')
  })

  it('skips tied continuations and starts on L when L leads', () => {
    const ex = tiedInto(line(['x.x.', 'x.x.'], { mode: 'alternate', lead: 'L' }), 0, 1)
    expect(shown(ex)).toBe('LR' + 'L')
  })
})

/** The exercise with an override on the given item of bar 1. */
const overridden = (ex: Exercise, item: number, hand: Hand): Exercise => {
  const snare = ex.bars[0].snare.map((it, i) => (i === item && it.kind === 'note' ? { ...it, override: hand } : it))
  return { ...ex, bars: [{ ...ex.bars[0], snare }, ...ex.bars.slice(1)] }
}

describe('overrides and hidden sticking', () => {
  it('shows an override on its own note, leaving the others where they were', () => {
    const ex = overridden(line(['x.x.', 'x.x.'], { mode: 'alternate' }), 1, 'R')
    expect(sticking(ex).map((n) => [n.computed, n.override ?? null, n.shown])).toEqual([
      ['R', null, 'R'],
      ['L', 'R', 'R'],
      ['R', null, 'R'],
      ['L', null, 'L'],
    ])
  })

  it('shows no hands with sticking off, but keeps the overrides', () => {
    const ex = overridden(line(['x.x.'], { mode: 'off' }), 1, 'R')
    expect(sticking(ex).map((n) => [n.computed, n.override ?? null, n.shown])).toEqual([
      [null, null, null],
      [null, 'R', null],
    ])
  })

})

describe('sticking and the kick row', () => {
  it('labels only the snare row: kicks get no hand and leave the snare hands as they were', () => {
    const ex = line(['x.x.', 'xxxx'], { mode: 'alternate' })
    const kicks = ['x.x.', '.x.x'].reduce((bars, hits, beat) => setBeat(bars, 'kick', 0, beat, hits), ex.bars)
    const withKicks = { ...ex, bars: kicks }
    expect(shown(withKicks)).toBe('RLRLRL')
    expect(sticking(withKicks).map((n) => n.noteId)).toEqual(sticking(ex).map((n) => n.noteId))
  })
})

describe('sticking over the whole exercise', () => {
  it('is computed from bar 1 whatever the loop range', () => {
    const ex = line(['x.x.', 'x...', 'x...', 'x...', 'x.x.'], { mode: 'alternate' })
    const looped = { ...ex, practice: { ...ex.practice, loopRange: { first: 1, last: 1 } } }
    expect(shown(looped)).toBe(shown(ex))
    expect(shown(looped)).toBe('RLRLR' + 'LR')
  })
})
