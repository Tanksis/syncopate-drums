import { describe, expect, it } from 'vitest'
import { exerciseToOpenAtLaunch } from './index'

const library = [
  { id: 'paradiddles', lastOpened: 300 },
  { id: 'syncopation-p38', lastOpened: 900 },
  { id: 'triplets', lastOpened: 500 },
]

describe('the exercise opened at launch', () => {
  it('is the one open when the app was last closed', () => {
    expect(exerciseToOpenAtLaunch(library, 'triplets')).toBe('triplets')
  })

  it('is the most recently opened one when the last-opened exercise is gone', () => {
    expect(exerciseToOpenAtLaunch(library, 'deleted')).toBe('syncopation-p38')
    expect(exerciseToOpenAtLaunch(library, null)).toBe('syncopation-p38')
  })

  it('is none with an empty library, so a new Untitled exercise opens', () => {
    expect(exerciseToOpenAtLaunch([], 'deleted')).toBeNull()
    expect(exerciseToOpenAtLaunch([], null)).toBeNull()
  })
})
