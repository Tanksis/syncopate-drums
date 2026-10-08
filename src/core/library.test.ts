import { describe, expect, it } from 'vitest'
import {
  applyEdit,
  duplicateExercise,
  exerciseToOpenAfterDelete,
  exerciseToOpenAtLaunch,
  filterByName,
  launchListOrder,
  addedOnTop,
  updatedInPlace,
  isUnchangedNew,
  newEditorState,
  newExercise,
  exampleExercises,
  withBpm,
} from './index'

const paradiddles = { id: 'paradiddles', lastOpened: 300 }
const syncopation = { id: 'syncopation-p38', lastOpened: 900 }
const triplets = { id: 'triplets', lastOpened: 500 }
const library = [paradiddles, syncopation, triplets]

describe('the exercise opened at launch', () => {
  it('is the one open when the app was last closed', () => {
    expect(exerciseToOpenAtLaunch(library, 'triplets')).toBe(triplets)
  })

  it('is the most recently opened one when the last-opened exercise is gone', () => {
    expect(exerciseToOpenAtLaunch(library, 'deleted')).toBe(syncopation)
    expect(exerciseToOpenAtLaunch(library, null)).toBe(syncopation)
  })

  it('is the example that was open, under its fixed id', () => {
    const [, comping] = exampleExercises()
    expect(exerciseToOpenAtLaunch(library, 'example:jazz-comping')).toEqual(comping)
    expect(exerciseToOpenAtLaunch([], 'example:jazz-comping')).toEqual(comping)
  })

  it('is the first example on a fresh device: nothing ever open, and an empty library', () => {
    expect(exerciseToOpenAtLaunch([], null)).toEqual(exampleExercises()[0])
  })

  it('is none on a device that emptied its library, so a new Untitled exercise opens', () => {
    expect(exerciseToOpenAtLaunch([], 'deleted')).toBeNull()
  })
})

describe('the exercise opened after a delete', () => {
  it('stays the open one when the open exercise is kept', () => {
    expect(exerciseToOpenAfterDelete(library, 'triplets', ['syncopation-p38'])).toBe(triplets)
  })

  it('is the most recently opened one left when the open exercise is deleted', () => {
    expect(exerciseToOpenAfterDelete(library, 'triplets', ['triplets'])).toBe(syncopation)
    expect(exerciseToOpenAfterDelete(library, 'syncopation-p38', ['syncopation-p38', 'triplets'])).toBe(paradiddles)
  })

  it('is none when every exercise is deleted, so a new Untitled exercise opens', () => {
    expect(exerciseToOpenAfterDelete(library, 'triplets', ['paradiddles', 'syncopation-p38', 'triplets'])).toBeNull()
  })
})

describe('an unchanged new exercise', () => {
  const untitled = newExercise({ id: 'new', now: 1000 })

  it('is one still at the new-exercise defaults, whenever it was last opened', () => {
    expect(isUnchangedNew(untitled)).toBe(true)
    expect(isUnchangedNew({ ...untitled, lastOpened: 5000 })).toBe(true)
  })

  it('stops being unchanged once a setting changes', () => {
    expect(isUnchangedNew(withBpm(untitled, 81))).toBe(false)
    expect(isUnchangedNew({ ...untitled, sticking: 'alternate' })).toBe(false)
    expect(isUnchangedNew({ ...untitled, leadHand: 'L' })).toBe(false)
    expect(isUnchangedNew({ ...untitled, practice: { ...untitled.practice, swing: 0.58 } })).toBe(false)
  })

  it('stops being unchanged once a note is entered', () => {
    const edited = applyEdit(newEditorState(untitled), { type: 'enterFigure', hits: 'x...' })
    expect(isUnchangedNew(edited.exercise)).toBe(false)
    const kicked = applyEdit(newEditorState(untitled), { type: 'toggleGridPosition', row: 'kick', bar: 0, beat: 0, position: 0 })
    expect(isUnchangedNew(kicked.exercise)).toBe(false)
  })

  it('stops being unchanged once it is renamed', () => {
    expect(isUnchangedNew({ ...untitled, name: 'p.37 #4' })).toBe(false)
  })
})

describe('duplicating an exercise', () => {
  const original = {
    ...applyEdit(newEditorState(newExercise({ id: 'orig', now: 100 })), { type: 'enterFigure', hits: 'x...' }).exercise,
    name: 'p.37 #4',
    sticking: 'alternate' as const,
    practice: { bpm: 132, loopRange: { first: 0, last: 0 }, groove: 'off' as const, swing: 0.58 },
  }
  const copy = duplicateExercise(original, { id: 'copy', now: 900 })

  it('names the copy "<name> (copy)" under a new id, opened now', () => {
    expect(copy.name).toBe('p.37 #4 (copy)')
    expect(copy.id).toBe('copy')
    expect(copy.lastOpened).toBe(900)
  })

  it('keeps the content and practice settings', () => {
    expect(copy.bars).toEqual(original.bars)
    expect(copy.sticking).toBe('alternate')
    expect(copy.practice).toEqual({ bpm: 132, loopRange: { first: 0, last: 0 }, groove: 'off', swing: 0.58 })
  })
})

describe('the name filter', () => {
  const list = [{ name: 'Syncopation p.37 #4' }, { name: 'Paradiddles' }, { name: 'p.38 triplets' }]

  it('matches any part of a name, ignoring case', () => {
    expect(filterByName(list, 'P.3')).toEqual([list[0], list[2]])
    expect(filterByName(list, 'DIDDLE')).toEqual([list[1]])
  })

  it('keeps the list order, and keeps everything for an empty filter', () => {
    expect(filterByName(list, '')).toEqual(list)
    expect(filterByName(list, 'zzz')).toEqual([])
  })
})

describe('the library list order during a session', () => {
  const launched = launchListOrder(library)

  it('starts as most recently opened first, as of launch', () => {
    expect(launched.map((e) => e.id)).toEqual(['syncopation-p38', 'triplets', 'paradiddles'])
  })

  it('stays put when an exercise is opened or changed', () => {
    const reopened = updatedInPlace(launched, { id: 'paradiddles', lastOpened: 2000 })
    expect(reopened.map((e) => e.id)).toEqual(['syncopation-p38', 'triplets', 'paradiddles'])
    expect(reopened[2].lastOpened).toBe(2000)
  })

  it('puts exercises created this session on top, newest first', () => {
    const withNew = addedOnTop(addedOnTop(launched, { id: 'new-1', lastOpened: 3000 }), { id: 'new-2', lastOpened: 4000 })
    expect(withNew.map((e) => e.id)).toEqual(['new-2', 'new-1', 'syncopation-p38', 'triplets', 'paradiddles'])
    const reopenedFirst = updatedInPlace(withNew, { id: 'new-1', lastOpened: 5000 })
    expect(reopenedFirst.map((e) => e.id)).toEqual(['new-2', 'new-1', 'syncopation-p38', 'triplets', 'paradiddles'])
  })
})
