// PROTOTYPE, throwaway (branch prototype/beat-flash): three visual beat flashes for the Practice
// screen, switched with ?flash=A|B|C (or the floating bar at the bottom). Not for main.

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { TICKS_PER_BEAT } from '@/core'
import { playhead } from './engine'

const VARIANTS = ['off', 'A', 'B', 'C'] as const
type Variant = (typeof VARIANTS)[number]
const NAMES: Record<Variant, string> = { off: 'Off', A: 'Edge glow', B: 'Count', C: 'Screen flash' }

interface Beat {
  /** -1 during the count-in, else the bar counted from 0. */
  bar: number
  /** The beat in the bar, counted from 0. */
  beat: number
}

function readVariant(): Variant {
  const v = new URLSearchParams(location.search).get('flash')
  return (VARIANTS as readonly string[]).includes(v ?? '') ? (v as Variant) : 'A'
}

/** Calls `onBeat` once on each beat the drummer hears, while the exercise plays. */
function useBeats(onBeat: (beat: Beat) => void) {
  const playing = useAppStore((s) => s.playing)
  const latest = useRef(onBeat)
  latest.current = onBeat
  useEffect(() => {
    if (!playing) return
    let last = ''
    let frame = requestAnimationFrame(function step() {
      const head = playhead()
      if (head) {
        const beat = { bar: head.position.bar < 0 ? -1 : head.position.bar, beat: Math.floor(head.position.tick / TICKS_PER_BEAT) }
        const key = `${head.position.bar}:${beat.beat}`
        if (key !== last) {
          last = key
          latest.current(beat)
        }
      }
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing])
}

/** A: the notation card's edge glows on each beat, harder on 1. Peripheral vision on a music stand. */
function EdgeGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useBeats(({ bar, beat }) => {
    const strong = beat === 0 || bar < 0
    ref.current?.animate(
      [
        { boxShadow: `inset 0 0 0 ${strong ? 8 : 4}px var(--color-accent)`, opacity: strong ? 1 : 0.7 },
        { boxShadow: 'inset 0 0 0 0 var(--color-accent)', opacity: 0 },
      ],
      { duration: strong ? 320 : 220, easing: 'ease-out' },
    )
  })
  return <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0" />
}

/** B: a big count, 1 2 3 4, with the beat being played lit; the count-in counts down. */
function Count() {
  const playing = useAppStore((s) => s.playing)
  const [now, setNow] = useState<Beat | undefined>()
  useBeats(setNow)
  useEffect(() => {
    if (!playing) setNow(undefined)
  }, [playing])
  return (
    <div aria-hidden className="pointer-events-none absolute top-3 right-4 z-10 flex items-baseline gap-3 font-semibold tabular-nums">
      {now?.bar === -1 && <span className="mr-2 text-sm text-mute">count-in</span>}
      {[0, 1, 2, 3].map((b) => {
        const on = now?.beat === b
        return (
          <span
            key={b}
            className={`text-3xl transition-[color,transform] duration-75 ${on ? (b === 0 ? 'scale-150 text-accent' : 'scale-125 text-ink') : 'text-line'}`}
          >
            {b + 1}
          </span>
        )
      })}
    </div>
  )
}

/** C: the whole screen flashes on each beat, the accent colour on 1. Visible from across the room. */
function ScreenFlash() {
  const ref = useRef<HTMLDivElement>(null)
  useBeats(({ bar, beat }) => {
    const strong = beat === 0 || bar < 0
    ref.current?.animate(
      [
        { backgroundColor: strong ? 'var(--color-accent)' : 'var(--color-ink)', opacity: strong ? 0.22 : 0.08 },
        { opacity: 0 },
      ],
      { duration: 180, easing: 'ease-out' },
    )
  })
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-40 opacity-0" />
}

/** The variant being tried, and the floating bar that switches it. Mounted once, on the staff's container. */
export function BeatFlashPrototype() {
  const [variant, setVariant] = useState<Variant>(readVariant)
  const go = (step: number) => {
    const next = VARIANTS[(VARIANTS.indexOf(variant) + step + VARIANTS.length) % VARIANTS.length]
    const url = new URL(location.href)
    url.searchParams.set('flash', next)
    history.replaceState(history.state, '', url)
    setVariant(next)
  }
  return (
    <>
      {variant === 'A' && <EdgeGlow />}
      {variant === 'B' && <Count />}
      {variant === 'C' && <ScreenFlash />}
      {import.meta.env.DEV && (
        <div className="fixed bottom-40 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1 text-sm text-white shadow-lg sm:bottom-4">
          <button type="button" className="px-2 py-1" onClick={() => go(-1)} aria-label="Previous flash">‹</button>
          <span className="min-w-36 text-center">
            Flash {variant === 'off' ? '' : `${variant} · `}{NAMES[variant]}
          </span>
          <button type="button" className="px-2 py-1" onClick={() => go(1)} aria-label="Next flash">›</button>
        </div>
      )}
    </>
  )
}
