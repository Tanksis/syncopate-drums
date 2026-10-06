import { describe, expect, it } from 'vitest'
import { exerciseToOpenAtLaunch } from './index'

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

  it('is none with an empty library, so a new Untitled exercise opens', () => {
    expect(exerciseToOpenAtLaunch([], 'deleted')).toBeNull()
    expect(exerciseToOpenAtLaunch([], null)).toBeNull()
  })
})
