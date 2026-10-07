import { describe, expect, it } from 'vitest'
import { grooveChords } from './index'

/** A compact view of a bar's chords: "start duration key/notehead+key/notehead". */
const show = (id: string) =>
  grooveChords(id).map(
    (c) => `${c.start} ${c.duration} ${c.hits.map((h) => `${h.notation.key}/${h.notation.notehead}`).join('+')}`,
  )

describe('drawing a groove preset', () => {
  it('writes the jazz ride as quarters on 1 and 3 and two eighths on 2 and 4, the foot under 2 and 4', () => {
    expect(show('jazz')).toEqual([
      '0 quarter f/5/x',
      '12 eighth f/5/x+d/4/x',
      '18 eighth f/5/x',
      '24 quarter f/5/x',
      '36 eighth f/5/x+d/4/x',
      '42 eighth f/5/x',
    ])
  })

  it('puts the feathered bass drum in each beat\'s first chord, with a normal notehead', () => {
    expect(show('jazzFeathered').slice(0, 3)).toEqual([
      '0 quarter f/5/x+f/4/normal',
      '12 eighth f/5/x+d/4/x+f/4/normal',
      '18 eighth f/5/x',
    ])
  })

  it('writes the hi-hat eighths above the staff', () => {
    expect(show('hihatEighths')).toEqual([0, 6, 12, 18, 24, 30, 36, 42].map((t) => `${t} eighth g/5/x`))
  })

  it('draws nothing when off', () => {
    expect(grooveChords('off')).toEqual([])
  })
})
