import { describe, expect, it } from 'vitest'
import type { EditorState, GrooveHit, ScheduledEvent, TimeSignature } from './index'
import { DEFAULT_DEVICE_SETTINGS, applyEdit, beatCountAt, editorBeatViews, grooveHitsByTick, meter, hihatFootOptions, migrateExercise, newEditorState, newExercise, parseImport, restBar, rowBeats, schedule, setBeat, staffParts, sticking, SCHEMA_VERSION } from './index'

const fresh = () => newEditorState(newExercise({ id: 'e1', now: 0 }))

/** Each bar's beats as the editor shows them, one hits string per beat, joined by spaces. */
const grid = (state: EditorState, row: 'snare' | 'kick' = 'snare') =>
  editorBeatViews(state).map((bar) => bar.map((beat) => beat[row].hits).join(' '))

describe('the time signature', () => {
  it('starts a new exercise in 4/4', () => {
    const state = fresh()
    expect(state.exercise.timeSignature).toBe('4/4')
    expect(grid(state)).toEqual(['.... .... .... ....'])
  })

  it('gives a bar three beats in 3/4, and undo brings back 4/4', () => {
    const changed = applyEdit(fresh(), { type: 'setTimeSignature', timeSignature: '3/4' })
    expect(changed.exercise.timeSignature).toBe('3/4')
    expect(grid(changed)).toEqual(['.... .... ....'])
    const undone = applyEdit(changed, { type: 'undo' })
    expect(undone.exercise.timeSignature).toBe('4/4')
    expect(grid(undone)).toEqual(['.... .... .... ....'])
  })

  /** A 4/4 exercise of two bars with the snare row written beat by beat. */
  const written = (...beats: string[]) => {
    const state = applyEdit(fresh(), { type: 'addBar' })
    const bars = beats.reduce((b, hits, i) => setBeat(b, 'snare', Math.floor(i / 4), i % 4, hits), state.exercise.bars)
    return { ...state, exercise: { ...state.exercise, bars } }
  }

  it('cuts each bar to its first beats, keeping their notes', () => {
    const state = written('x.x.', 'x...', 'xxxx', '...x', 'x...', '.x..', '..x.', 'x...')
    const changed = applyEdit(state, { type: 'setTimeSignature', timeSignature: '3/4' })
    expect(grid(changed)).toEqual(['x.x. x... xxxx', 'x... .x.. ..x.'])
  })

  it('strikes a note that was tied over the barline from a beat that is cut', () => {
    const state = written('....', '....', '....', 'x...', 'x...')
    const tied = applyEdit(state, { type: 'tieOverBarline', bar: 1, row: 'snare' })
    expect(editorBeatViews(tied)[1][0].snare.tiedInto).toBe(true)
    const changed = applyEdit(tied, { type: 'setTimeSignature', timeSignature: '2/4' })
    expect(grid(changed)).toEqual(['.... ....', 'x... ....'])
    expect(editorBeatViews(changed)[1][0].snare.tiedInto).toBe(false)
  })

  it('pads each bar with rest beats, and keeps the kick row too', () => {
    const state = applyEdit(fresh(), { type: 'setTimeSignature', timeSignature: '2/4' })
    const bars = setBeat(setBeat(state.exercise.bars, 'snare', 0, 1, 'x.x.'), 'kick', 0, 0, 'x...')
    const changed = applyEdit({ ...state, exercise: { ...state.exercise, bars } }, { type: 'setTimeSignature', timeSignature: '4/4' })
    expect(grid(changed)).toEqual(['.... x.x. .... ....'])
    expect(grid(changed, 'kick')).toEqual(['x... .... .... ....'])
  })

  it('keeps the cursor in its bar, on the last beat left', () => {
    const state = applyEdit(fresh(), { type: 'jump', to: 'end' })
    expect(state.cursor.beat).toBe(3)
    const changed = applyEdit(state, { type: 'setTimeSignature', timeSignature: '3/4' })
    expect(changed.cursor.beat).toBe(2)
  })

  it('moves the cursor over the bar line after the bar’s last beat', () => {
    const state = applyEdit(applyEdit(fresh(), { type: 'setTimeSignature', timeSignature: '3/4' }), { type: 'addBar' })
    const atStart = applyEdit(state, { type: 'moveTo', bar: 0, beat: 2 })
    expect(applyEdit(atStart, { type: 'move', by: 'beat', step: 1 }).cursor).toMatchObject({ bar: 1, beat: 0 })
  })

  it('adds bars of the bar’s beats', () => {
    const state = applyEdit(applyEdit(fresh(), { type: 'setTimeSignature', timeSignature: '2/4' }), { type: 'addBar' })
    expect(grid(state)).toEqual(['.... ....', '.... ....'])
  })
})

describe('playing a time signature', () => {
  /** A blank exercise in a time signature, at 120 BPM and straight. */
  const blankIn = (timeSignature: TimeSignature) => {
    const state = applyEdit(fresh(), { type: 'setTimeSignature', timeSignature })
    const ex = state.exercise
    return { ...ex, practice: { ...ex.practice, bpm: 120 } }
  }
  const clicks = (events: ScheduledEvent[]) => events.filter((e) => e.kind === 'click').map((e) => `${e.position.bar}:${e.position.tick}${e.accent ? '!' : ''}`)

  it('counts in with one bar of three clicks in 3/4, then clicks every beat, beat 1 accented', () => {
    const ex = blankIn('3/4')
    const { events } = schedule(ex, ex.practice, DEFAULT_DEVICE_SETTINGS, 'start', 3)
    expect(clicks(events)).toEqual(['-1:0!', '-1:12', '-1:24', '0:0!', '0:12', '0:24'])
  })

  it('loops a bar of 2/4 after its second beat', () => {
    const ex = blankIn('2/4')
    const { events } = schedule(ex, ex.practice, { ...DEFAULT_DEVICE_SETTINGS, countIn: false }, 'start', 2)
    expect(clicks(events)).toEqual(['0:0!', '0:12', '0:0!', '0:12'])
  })
})

describe('the beat count in a time signature', () => {
  it('counts a bar of three beats in 3/4', () => {
    expect(beatCountAt({ bar: 0, tick: 30 }, 3)).toEqual({ countIn: false, beat: 2, beats: 3 })
    expect(beatCountAt({ bar: -1, tick: 12 }, 2)).toEqual({ countIn: true, beat: 1, beats: 2 })
  })
})

describe('the groove in a time signature', () => {
  const ticks = (byTick: Map<number, GrooveHit[]>, instrument: string) =>
    [...byTick].flatMap(([tick, hits]) => (hits.some((h) => h.instrument === instrument) ? [tick] : []))

  it('plays the jazz ride over a bar of 3/4: beats 1, 2, the & of 2, and 3', () => {
    expect(ticks(grooveHitsByTick({ pattern: 'ride', bassDrum: 'off', hihatFoot: 'off' }, meter('3/4')), 'ride')).toEqual([0, 12, 18, 24])
  })

  it('plays eighths on the hi-hat over a bar of 2/4', () => {
    expect(ticks(grooveHitsByTick({ pattern: 'hihatEighths', bassDrum: 'off', hihatFoot: 'off' }, meter('2/4')), 'hihatClosed')).toEqual([0, 6, 12, 18])
  })

  it('plays the hi-hat foot on each beat, or each &, of the bar', () => {
    expect(ticks(grooveHitsByTick({ pattern: 'off', bassDrum: 'off', hihatFoot: 'quarters' }, meter('3/4')), 'hihatPedal')).toEqual([0, 12, 24])
    expect(ticks(grooveHitsByTick({ pattern: 'off', bassDrum: 'off', hihatFoot: 'ands' }, meter('2/4')), 'hihatPedal')).toEqual([6, 18])
  })

  it('offers 2 & 4 for the hi-hat foot only in 4/4', () => {
    expect(hihatFootOptions('4/4')).toEqual(['off', 'one', 'quarters', 'twoAndFour', 'ands'])
    expect(hihatFootOptions('3/4')).toEqual(['off', 'one', 'quarters', 'ands'])
    expect(hihatFootOptions('2/4')).toEqual(['off', 'one', 'quarters', 'ands'])
  })

  it('turns off a hi-hat foot the new time signature has no place for, and undo brings it back', () => {
    const state = fresh()
    const onTwoAndFour = { ...state, exercise: { ...state.exercise, practice: { ...state.exercise.practice, hihatFoot: 'twoAndFour' as const } } }
    const changed = applyEdit(onTwoAndFour, { type: 'setTimeSignature', timeSignature: '3/4' })
    expect(changed.exercise.practice.hihatFoot).toBe('off')
    expect(applyEdit(changed, { type: 'undo' }).exercise.practice.hihatFoot).toBe('twoAndFour')
  })
})

describe('sticking and the staff in a time signature', () => {
  /** A 3/4 exercise of two bars, every snare beat written with the same hits. */
  const allBeats = (hits: string) => {
    const state = applyEdit(applyEdit(fresh(), { type: 'setTimeSignature', timeSignature: '3/4' }), { type: 'addBar' })
    const bars = [0, 1, 2, 3, 4, 5].reduce((b, i) => setBeat(b, 'snare', Math.floor(i / 3), i % 3, hits), state.exercise.bars)
    return { ...state.exercise, bars, sticking: 'natural' as const }
  }

  it('carries a run of triplets on over the bar line of 3/4 under natural sticking', () => {
    const hands = sticking(allBeats('xxx')).map((n) => n.shown).join('')
    expect(hands).toBe('RLRLRLRLR' + 'LRLRLRLRL')
  })

  it('writes each bar of 3/4 with its three beats, and the groove in it', () => {
    const parts = staffParts(allBeats('x...').bars, 'hihatEighths')
    expect(parts).toHaveLength(2)
    expect(parts[1].hands.map((e) => `${e.start} ${e.kind}`)).toEqual(['0 chord', '6 chord', '12 chord', '18 chord', '24 chord', '30 chord'])
  })
})

describe('filling a bar with a pattern in a time signature', () => {
  it('fills the bar’s three beats in 3/4', () => {
    const state = applyEdit(fresh(), { type: 'setTimeSignature', timeSignature: '3/4' })
    const filled = applyEdit(state, { type: 'fillPattern', bar: 0, pattern: ['R', 'L', 'R', 'K'], grid: 'sixteenths' })
    expect(grid(filled)).toEqual(['xxx. xxx. xxx.'])
    expect(grid(filled, 'kick')).toEqual(['...x ...x ...x'])
  })
})

describe('storing and importing the time signature', () => {
  /** A file holding one exercise, as stored. */
  const file = (exercise: object, version = SCHEMA_VERSION) =>
    JSON.stringify({ format: 'drum-app-exercises', version, exercises: [exercise] })
  const inThreeFour = { ...newExercise({ id: 'waltz', now: 0 }), timeSignature: '3/4', bars: [restBar(3)] }

  it('brings an exercise stored at version 4 in as 4/4', () => {
    const { timeSignature: _, ...before5 } = newExercise({ id: 'old', now: 0 })
    expect(migrateExercise({ ...before5, schemaVersion: 4 }).timeSignature).toBe('4/4')
  })

  it('imports a 3/4 exercise with bars of three beats', () => {
    const parsed = parseImport(file(inThreeFour))
    expect(parsed.ok && parsed.exercises[0].timeSignature).toBe('3/4')
  })

  it('refuses a time signature it doesn’t know', () => {
    const parsed = parseImport(file({ ...inThreeFour, timeSignature: '5/4' }))
    expect(parsed.ok).toBe(false)
    expect(!parsed.ok && parsed.reason).toContain('unknown time signature')
  })

  it('refuses a bar that doesn’t last as long as its time signature’s', () => {
    const parsed = parseImport(file({ ...inThreeFour, bars: [restBar(4)] }))
    expect(parsed.ok).toBe(false)
    expect(!parsed.ok && parsed.reason).toContain('3/4')
  })
})

describe('the time signature and the rest of the editor', () => {
  it('pastes bars copied before a change of time signature cut to the new bar', () => {
    const state = applyEdit(fresh(), { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 3, position: 0 })
    const copied = applyEdit(applyEdit(state, { type: 'copyBars' }), { type: 'setTimeSignature', timeSignature: '3/4' })
    const pasted = applyEdit(applyEdit(copied, { type: 'addBar' }), { type: 'pasteBars' })
    expect(pasted.exercise.bars.map((bar) => rowBeats(bar.snare))).toEqual([3, 3])
    expect(grid(pasted)).toEqual(['.... .... ....', '.... .... ....'])
  })

  it('cuts a note held from beat 3 into beat 4 at the new bar line', () => {
    const state = applyEdit(fresh(), { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 2, position: 2 })
    const held = applyEdit(state, {
      type: 'setHold',
      from: { row: 'snare', bar: 0, beat: 2, position: 2 },
      to: { row: 'snare', bar: 0, beat: 3, position: 2 },
    })
    expect(editorBeatViews(held)[0][3].snare.tiedInto).toBe(true)
    const changed = applyEdit(held, { type: 'setTimeSignature', timeSignature: '3/4' })
    expect(grid(changed)).toEqual(['.... .... ..x.'])
  })
})
