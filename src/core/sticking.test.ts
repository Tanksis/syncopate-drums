import { describe, expect, it } from 'vitest'
import type { Exercise, Hand, Mark, StickingMode } from './index'
import { newExercise, setBeat, sticking, toggleMark, toggleTie } from './index'

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

  it('mirrors every override under a left lead, as it mirrors the computed hands', () => {
    // A paradiddle-diddle's RLRRLL written as overrides on six sixteenths under a right lead.
    const paradiddle = (lead: Hand) =>
      ['R', 'L', 'R', 'R', 'L', 'L'].reduce((ex, hand, i) => overridden(ex, i, hand as Hand), line(['xxxx', 'xx..'], { lead }))
    expect(shown(paradiddle('R'))).toBe('RLRR' + 'LL')
    expect(shown(paradiddle('L'))).toBe('LRLL' + 'RR')
    expect(sticking(paradiddle('L')).map((n) => n.override).join('')).toBe('LRLLRR')
  })
})

describe('sticking and the kick row', () => {
  /** The exercise with the kick row's beats set, one string per beat of bar 1. */
  const withKicks = (ex: Exercise, beats: string[]): Exercise => ({
    ...ex,
    bars: beats.reduce((bars, hits, beat) => setBeat(bars, 'kick', 0, beat, hits), ex.bars),
  })

  it('gives kicks under hands no label, and leaves the snare hands as they were', () => {
    const ex = line(['x.x.', 'xxxx'], { mode: 'alternate' })
    const kicked = withKicks(ex, ['x.x.', '.x.x'])
    expect(shown(kicked)).toBe('RLRLRL')
    expect(sticking(kicked).map((n) => n.noteId)).toEqual(sticking(ex).map((n) => n.noteId))
  })

  it('shows K under a kick that no hand plays with, in order with the hands: RLRK', () => {
    const ex = withKicks(line(['xxx.']), ['...x'])
    expect(shown(ex)).toBe('RLRK')
    expect(sticking(ex)[3]).toMatchObject({ noteId: 'kick:0:9', bar: 0, start: 9, shown: 'K' })
  })

  it('shows only the hand where a kick lands with a snare note', () => {
    // R L . L on the snare, kicks on 1, 3 and 4: only the 3rd sixteenth has no hand.
    expect(shown(withKicks(line(['xx.x']), ['x.xx']))).toBe('RLKL')
  })

  it('shows K under a kick held under a tied snare note, which no hand strikes', () => {
    const ex = withKicks(tiedInto(line(['x.x.', 'x...']), 0, 1), ['....', 'x...'])
    expect(shown(ex)).toBe('RL' + 'K')
  })

  it('shows no K with sticking off', () => {
    expect(shown(withKicks(line(['xxx.'], { mode: 'off' }), ['...x']))).toBe('---')
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

describe('grace hands', () => {
  /** Each struck note's hands, its grace hands small before it: `lR` for a flam. */
  const hands = (ex: Exercise) => sticking(ex).map((n) => (n.graces ?? []).join('').toLowerCase() + (n.shown ?? '-')).join(' ')
  const marked = (ex: Exercise, ...marks: [beat: number, position: number, mark: Mark][]): Exercise => ({
    ...ex,
    bars: marks.reduce((bars, [beat, position, mark]) => toggleMark(bars, 'snare', 0, beat, position, mark), ex.bars),
  })

  it("plays a flam's or a drag's grace notes with the other hand from its note", () => {
    const ex = marked(line(['x.x.', 'x...']), [0, 0, 'flam'], [0, 2, 'drag'], [1, 0, 'flam'])
    expect(hands(ex)).toBe('lR rrL lR')
  })

  it('mirrors the grace hands with a left lead, overrides too', () => {
    const ex = marked(overridden(line(['xx..']), 1, 'R'), [0, 0, 'flam'], [0, 1, 'drag'])
    expect(hands(ex)).toBe('lR llR')
    expect(hands({ ...ex, leadHand: 'L' })).toBe('rL rrL')
  })

  it('prints no grace hands with sticking off', () => {
    const ex = marked(line(['x...'], { mode: 'off' }), [0, 0, 'flam'])
    expect(sticking(ex)[0].graces).toBeUndefined()
  })
})
