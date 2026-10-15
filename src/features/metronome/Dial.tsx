import type { KeyboardEvent, PointerEvent } from 'react'
import { useRef } from 'react'
import { useAppStore } from '@/app/store'
import type { DialPoint } from '@/core'
import { MAX_BPM, MIN_METRONOME_BPM, dialBpm, dialTurn, tempoName } from '@/core'
import { LEVEL_COLOUR } from './BeatBlocks'

/** The dial's size and the radius its beat dots sit on, in px, at full size. */
export const DIAL_SIZE = 280
const SIZE = DIAL_SIZE
const DOT_RADIUS = 117

/** The smallest the tempo's name is drawn, in px on the screen. */
const MIN_LABEL_PX = 11

/** Near the centre a point's angle jumps about, so a point closer than this, in px, doesn't turn the dial. */
const DEAD_CENTRE = 12


/**
 * The metronome's tempo on a ring with a dot per beat: the BPM in the middle, with its tempo name.
 * Dragging around the ring changes the BPM (clockwise faster), saved once the drag ends; the arrow
 * keys change it by one. While playing, the beat's dot grows and takes its level's colour.
 */
export function Dial({ beat, size = SIZE }: { beat: number | undefined; size?: number }) {
  const { bpm, levels } = useAppStore((s) => s.device.metronome)
  const setMetronome = useAppStore((s) => s.setMetronome)
  // `last` is unset until the drag reaches a point outside the dead centre; `moved` once it changed the BPM.
  const drag = useRef<{ startBpm: number; turned: number; last?: DialPoint; moved: boolean } | undefined>(undefined)

  const pointFrom = (e: PointerEvent<HTMLElement>): DialPoint => {
    const box = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - box.left - box.width / 2, y: e.clientY - box.top - box.height / 2 }
  }
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startBpm: bpm, turned: 0, moved: false }
    // The press is where the turn is measured from.
    onPointerMove(e)
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current) return
    const point = pointFrom(e)
    if (Math.hypot(point.x, point.y) < DEAD_CENTRE) return
    if (current.last) current.turned += dialTurn(current.last, point)
    current.last = point
    const next = dialBpm(current.startBpm, current.turned)
    // Past the slowest or fastest the drag starts again from there, so turning back moves at once.
    if (next === MIN_METRONOME_BPM || next === MAX_BPM) {
      current.startBpm = next
      current.turned = 0
    }
    if (next === useAppStore.getState().device.metronome.bpm) return
    current.moved = true
    setMetronome({ bpm: next }, { dragging: true })
  }
  const onPointerEnd = () => {
    const moved = drag.current?.moved
    drag.current = undefined
    // Saves the tempo the drag left, now.
    if (moved) setMetronome({ bpm: useAppStore.getState().device.metronome.bpm })
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key]
    if (by === undefined) return
    e.preventDefault()
    e.stopPropagation()
    setMetronome({ bpm: bpm + by })
  }

  // Drawn at full size and scaled to fit, so the dots, ring and BPM keep their proportions.
  return (
    <div className="shrink-0" style={{ width: size, height: size }}>
      <div className="origin-top-left" style={{ transform: `scale(${size / SIZE})` }}>
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
            const dot = on ? 34 : 20
            return (
              <span
                key={i}
                aria-hidden
                className={`absolute rounded-full border-2 transition-all duration-75 ${level === 'off' ? 'border-edge' : 'border-card'} ${
                  on ? LEVEL_COLOUR[level] : level === 'off' ? 'bg-card' : 'bg-edge/40'
                }`}
                style={{
                  width: dot,
                  height: dot,
                  left: SIZE / 2 + DOT_RADIUS * Math.cos(angle) - dot / 2,
                  top: SIZE / 2 + DOT_RADIUS * Math.sin(angle) - dot / 2,
                }}
              />
            )
          })}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="font-sans text-[76px]/none font-bold tracking-[-2px] tabular-nums">{bpm}</span>
            {/* Kept readable however small the dial is drawn. */}
            <span className="text-mute" style={{ fontSize: Math.max(13, MIN_LABEL_PX / (size / SIZE)) }}>
              BPM · {tempoName(bpm)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
