import type { KeyboardEvent, PointerEvent } from 'react'
import { useRef } from 'react'
import { useAppStore } from '@/app/store'
import type { BeatLevel, DialPoint } from '@/core'
import { MAX_BPM, MIN_METRONOME_BPM, clampMetronomeBpm, dialBpm, dialTurn, tempoName } from '@/core'

/** The dial's size and the radius its beat dots sit on, in px. */
const SIZE = 280
const DOT_RADIUS = 117

/** A playing dot's colour takes its level's; Off shows only its outline. */
const PLAYING_DOT: Record<BeatLevel, string> = {
  accent: 'bg-accent',
  normal: 'bg-ink',
  soft: 'bg-edge',
  off: 'bg-card',
}

/**
 * The metronome's tempo on a ring with a dot per beat: the BPM in the middle, with its tempo name.
 * Dragging around the ring changes the BPM (clockwise faster), saved once the drag ends; the arrow
 * keys change it by one. While playing, the beat's dot grows and takes its level's colour.
 */
export function Dial({ beat }: { beat: number | undefined }) {
  const { bpm, levels } = useAppStore((s) => s.device.metronome)
  const setMetronome = useAppStore((s) => s.setMetronome)
  const drag = useRef<{ startBpm: number; turned: number; last: DialPoint } | undefined>(undefined)

  const pointFrom = (e: PointerEvent<HTMLElement>): DialPoint => {
    const box = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - box.left - box.width / 2, y: e.clientY - box.top - box.height / 2 }
  }
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startBpm: bpm, turned: 0, last: pointFrom(e) }
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current) return
    const point = pointFrom(e)
    // Right at the centre the angle jumps about, so a point there doesn't turn the dial.
    if (Math.hypot(point.x, point.y) < 12) return
    current.turned += dialTurn(current.last, point)
    current.last = point
    const next = dialBpm(current.startBpm, current.turned)
    if (next !== useAppStore.getState().device.metronome.bpm) setMetronome({ bpm: next }, { dragging: true })
  }
  const onPointerEnd = () => {
    if (!drag.current) return
    drag.current = undefined
    setMetronome({}, { dragging: false })
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key]
    if (by === undefined) return
    e.preventDefault()
    e.stopPropagation()
    setMetronome({ bpm: clampMetronomeBpm(bpm + by) })
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Tempo"
      aria-valuemin={MIN_METRONOME_BPM}
      aria-valuemax={MAX_BPM}
      aria-valuenow={bpm}
      aria-valuetext={`${bpm} BPM, ${tempoName(bpm)}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
      className="relative shrink-0 cursor-grab touch-none rounded-full select-none active:cursor-grabbing"
      style={{ width: SIZE, height: SIZE }}
    >
      <div className="absolute inset-[18px] rounded-full border-10 border-line" />
      {levels.map((level, i) => {
        const angle = (i / levels.length) * 2 * Math.PI - Math.PI / 2
        const on = beat === i
        const size = on ? 34 : 20
        return (
          <span
            key={i}
            aria-hidden
            className={`absolute rounded-full border-2 transition-all duration-75 ${level === 'off' ? 'border-edge' : 'border-card'} ${
              on ? PLAYING_DOT[level] : level === 'off' ? 'bg-card' : 'bg-edge/40'
            }`}
            style={{
              width: size,
              height: size,
              left: SIZE / 2 + DOT_RADIUS * Math.cos(angle) - size / 2,
              top: SIZE / 2 + DOT_RADIUS * Math.sin(angle) - size / 2,
            }}
          />
        )
      })}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-sans text-[76px]/none font-bold tracking-[-2px] tabular-nums">{bpm}</span>
        <span className="text-[13px] text-mute">BPM · {tempoName(bpm)}</span>
      </div>
    </div>
  )
}
