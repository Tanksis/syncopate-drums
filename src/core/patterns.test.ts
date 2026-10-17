import { describe, expect, it } from 'vitest'
import type { Exercise, GrooveHit, PracticeSettings } from './index'
import { grooveHitsByTick, meter, newExercise, patternHits, patternsFor, withPattern } from './index'

const ticks = (hits: GrooveHit[], instrument: string) => hits.filter((h) => h.instrument === instrument).map((h) => h.tick)

describe('the patterns', () => {
  it('lists the patterns that fit the time signature by family, None first', () => {
    const listed = (ts: Parameters<typeof patternsFor>[0]) =>
      patternsFor(ts).map(({ family, patterns }) => [family, patterns.map((p) => p.id)])
    expect(listed('4/4')).toEqual([
      [null, ['off']],
      ['Jazz', ['ride']],
      ['Rock & pop', ['hihatEighths']],
    ])
    expect(listed('3/4')).toEqual(listed('4/4'))
    expect(listed('6/8')).toEqual([[null, ['off']]])
  })

  it('gives each pattern a description and a strip of one character per eighth', () => {
    const ride = patternsFor('4/4')[1].patterns[0]
    expect(ride).toMatchObject({ name: 'Ride', family: 'Jazz', strip: 'x.xxx.xx' })
    expect(ride.description).not.toBe('')
  })

  it('plays the ride on every beat and the & of 2 and 4, louder on the backbeats, with no hi-hat foot', () => {
    const hits = patternHits('ride', meter('4/4'))
    expect(ticks(hits, 'ride')).toEqual([0, 12, 18, 24, 36, 42])
    expect(hits.find((h) => h.tick === 12)!.velocity).toBeGreaterThan(hits.find((h) => h.tick === 0)!.velocity)
    expect(ticks(hits, 'hihatPedal')).toEqual([])
    expect(ticks(patternHits('ride', meter('3/4')), 'ride')).toEqual([0, 12, 18, 24])
    expect(ticks(patternHits('ride', meter('2/4')), 'ride')).toEqual([0, 12, 18])
  })

  it('plays hi-hat eighths in any simple meter, and nothing for None', () => {
    expect(ticks(patternHits('hihatEighths', meter('3/4')), 'hihatClosed')).toEqual([0, 6, 12, 18, 24, 30])
    expect(patternHits('off', meter('4/4'))).toEqual([])
  })
})

describe('the feet', () => {
  const layer = (practice: Partial<PracticeSettings>, ts: Parameters<typeof meter>[0] = '4/4') => {
    const settings = { ...newExercise({ id: 'e', now: 0 }).practice, ...practice }
    return [...grooveHitsByTick(settings, meter(ts)).values()].flat()
  }

  it('plays a feathered bass drum softly on every beat, with any pattern or none', () => {
    expect(ticks(layer({ bassDrum: 'feathered' }), 'kickFeathered')).toEqual([0, 12, 24, 36])
    expect(ticks(layer({ bassDrum: 'feathered', pattern: 'hihatEighths' }, '3/4'), 'kickFeathered')).toEqual([0, 12, 24])
    expect(ticks(layer({ bassDrum: 'feathered' }, '6/8'), 'kickFeathered')).toEqual([0, 12])
    expect(ticks(layer({ bassDrum: 'off' }), 'kickFeathered')).toEqual([])
  })

  it('plays the hi-hat foot setting alongside a pattern, and on the dotted quarters in compound time', () => {
    expect(ticks(layer({ pattern: 'ride', hihatFoot: 'quarters' }), 'hihatPedal')).toEqual([0, 12, 24, 36])
    expect(ticks(layer({ pattern: 'ride', hihatFoot: 'off' }), 'hihatPedal')).toEqual([])
    expect(ticks(layer({ hihatFoot: 'quarters' }, '12/8'), 'hihatPedal')).toEqual([0, 12, 24, 36])
  })
})

describe('picking a pattern', () => {
  const exercise = (practice: Partial<PracticeSettings> = {}, timeSignature: Exercise['timeSignature'] = '4/4'): Exercise => {
    const base = newExercise({ id: 'e', now: 0 })
    return { ...base, timeSignature, practice: { ...base.practice, ...practice } }
  }

  it('sets triplet swing and the hi-hat foot on 2 & 4 when Ride is picked on a straight exercise with the foot off', () => {
    const { exercise: picked, suggested } = withPattern(exercise(), 'ride')
    expect(picked.practice).toMatchObject({ pattern: 'ride', swing: 2 / 3, hihatFoot: 'twoAndFour' })
    expect(suggested).toEqual(['swing', 'hihatFoot'])
  })

  it('leaves a swing or hi-hat foot the drummer set, and never touches the bass drum', () => {
    const { exercise: picked, suggested } = withPattern(exercise({ swing: 0.6, hihatFoot: 'quarters', bassDrum: 'feathered' }), 'ride')
    expect(picked.practice).toMatchObject({ pattern: 'ride', swing: 0.6, hihatFoot: 'quarters', bassDrum: 'feathered' })
    expect(suggested).toEqual([])
  })

  it('sets no 2 & 4 in 3/4, where the hi-hat foot has none', () => {
    const { exercise: picked, suggested } = withPattern(exercise({}, '3/4'), 'ride')
    expect(picked.practice).toMatchObject({ swing: 2 / 3, hihatFoot: 'off' })
    expect(suggested).toEqual(['swing'])
  })

  it('changes nothing for the same pattern, or one the time signature has no place for', () => {
    const onRide = exercise({ pattern: 'ride' })
    expect(withPattern(onRide, 'ride')).toEqual({ exercise: onRide, suggested: [] })
    const compound = exercise({}, '6/8')
    expect(withPattern(compound, 'hihatEighths').exercise).toBe(compound)
  })

  it('suggests nothing for Hi-hat 8ths', () => {
    const { exercise: picked, suggested } = withPattern(exercise(), 'hihatEighths')
    expect(picked.practice).toMatchObject({ pattern: 'hihatEighths', swing: 0.5, hihatFoot: 'off' })
    expect(suggested).toEqual([])
  })
})
