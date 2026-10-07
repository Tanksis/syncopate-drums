// PROTOTYPE, throwaway: three editor-panel layouts with a snare lane and a kick lane, switchable
// with `?variant=A|B|C`. The snare lane is the real exercise (clicks toggle hits, right-click
// switches the beat's grid); the kick lane is in-memory only and resets on reload. No drag-to-hold.
import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { PrototypeSwitcher } from '@/components/PrototypeSwitcher'
import type { BeatView } from '@/core'
import { editorBeatViews, inLoopRange } from '@/core'

export const PROTOTYPE_VARIANTS: [string, string][] = [
  ['A', 'Lanes, Groove Scribe style'],
  ['B', 'Beat cards, hands up / feet down'],
  ['C', 'One lane, click cycles drums'],
]

type Kick = Set<string>
const kickKey = (bar: number, beat: number, pos: number, triplet: boolean) => `${bar}.${beat}.${triplet ? 't' : 's'}${pos}`

function countLabels(beat: number, triplet: boolean): string[] {
  return triplet ? [`${beat + 1}`, 'trip', 'let'] : [`${beat + 1}`, 'e', '&', 'a']
}

/** What every variant needs: the real snare beats, the stub kick, and the actions on both. */
function usePanel() {
  const editor = useAppStore((s) => s.editor)
  const dispatch = useAppStore((s) => s.dispatch)
  const [kick, setKick] = useState<Kick>(new Set())
  const views = editorBeatViews(editor)
  return {
    views,
    cursor: editor.cursor,
    loopRange: editor.exercise.practice.loopRange,
    toggleSnare: (bar: number, beat: number, position: number) => dispatch({ type: 'toggleGridPosition', bar, beat, position }),
    switchGrid: (bar: number, beat: number, view: BeatView) => dispatch({ type: 'setBeatGrid', bar, beat, triplet: !view.triplet }),
    moveTo: (bar: number, beat: number) => dispatch({ type: 'moveTo', bar, beat }),
    deleteBar: (bar: number) => dispatch({ type: 'deleteBar', bar }),
    hasKick: (bar: number, beat: number, pos: number, triplet: boolean) => kick.has(kickKey(bar, beat, pos, triplet)),
    toggleKick: (bar: number, beat: number, pos: number, triplet: boolean) =>
      setKick((k) => {
        const next = new Set(k)
        const key = kickKey(bar, beat, pos, triplet)
        if (!next.delete(key)) next.add(key)
        return next
      }),
  }
}
type Panel = ReturnType<typeof usePanel>

export function EditorPanelPrototype({ variant }: { variant: string }) {
  const panel = usePanel()
  return (
    <>
      <p className="text-[11px] text-mute">
        Prototype: the kick lane isn't saved and doesn't play. No drag-to-hold here.
      </p>
      {variant === 'B' ? <VariantB {...panel} /> : variant === 'C' ? <VariantC {...panel} /> : <VariantA {...panel} />}
      <PrototypeSwitcher variants={PROTOTYPE_VARIANTS} current={variant} />
    </>
  )
}

/** A segmented 16ths | triplets switch for one beat. */
function GridSwitch({ triplet, onSwitch, small }: { triplet: boolean; onSwitch: () => void; small?: boolean }) {
  const seg = (on: boolean, label: string) => (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={keepFocus}
      onClick={(e) => {
        e.stopPropagation()
        if (!on) onSwitch()
      }}
      className={`cursor-pointer px-1.5 ${small ? 'text-[10px]' : 'text-[11px]'} ${on ? 'bg-accent text-white' : 'text-mute hover:text-accent'}`}
    >
      {label}
    </button>
  )
  return (
    <span className="inline-flex overflow-hidden rounded border border-line bg-card leading-5">
      {seg(!triplet, '16ths')}
      {seg(triplet, 'trip')}
    </span>
  )
}

function BarHeader({ bar, looped, onDelete }: { bar: number; looped: boolean; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`font-semibold ${looped ? 'text-loop-ink' : 'text-ink'}`}>Bar {bar + 1}</span>
      <button
        type="button"
        tabIndex={-1}
        title={`Delete bar ${bar + 1}`}
        onMouseDown={keepFocus}
        onClick={onDelete}
        className="ml-auto cursor-pointer rounded px-1.5 text-mute hover:bg-line hover:text-danger"
      >
        ✕ delete
      </button>
    </div>
  )
}

/** A big square step cell: a filled disc when on, a faint outline when off, a ghost on hover. */
function Cell({ on, hold, onClick, tone }: { on: boolean; hold?: boolean; onClick: () => void; tone: 'snare' | 'kick' }) {
  const fill = tone === 'snare' ? 'bg-ink' : 'bg-orange-600'
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={keepFocus}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="group/cell flex h-10 min-w-8 flex-1 cursor-pointer items-center justify-center rounded border border-line bg-card hover:border-accent"
    >
      {on ? (
        <span className={`size-4 rounded-full ${fill}`} />
      ) : hold ? (
        <span className={`h-1.5 w-full ${fill} opacity-60`} />
      ) : (
        <span className={`size-4 rounded-full opacity-0 group-hover/cell:opacity-30 ${fill}`} />
      )}
    </button>
  )
}

/** A: one bar block per bar, a row per drum (Snare, Kick) like Groove Scribe; 1 or 2 bars a row by width. */
function VariantA(p: Panel) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(560px,1fr))] gap-3" onContextMenu={(e) => e.preventDefault()}>
      {p.views.map((beats, b) => {
        const looped = inLoopRange(p.loopRange, b)
        return (
          <div key={b} className={`flex flex-col gap-1 rounded-lg border p-2 ${looped ? 'border-loop-line bg-loop/40' : 'border-line bg-card'}`}>
            <BarHeader bar={b} looped={looped} onDelete={() => p.deleteBar(b)} />
            <div className="grid grid-cols-[3rem_repeat(4,1fr)] gap-x-2 gap-y-1">
              <span />
              {beats.map((view, beat) => (
                <div key={beat} className="flex justify-center">
                  <GridSwitch small triplet={view.triplet} onSwitch={() => p.switchGrid(b, beat, view)} />
                </div>
              ))}
              {(['snare', 'kick'] as const).map((lane) => (
                <Lane key={lane} lane={lane} b={b} beats={beats} p={p} />
              ))}
              <span />
              {beats.map((view, beat) => (
                <div key={beat} className="flex gap-0.5">
                  {countLabels(beat, view.triplet).map((label, i) => (
                    <span key={i} className={`flex-1 text-center font-mono text-[11px] ${i === 0 ? 'font-bold text-ink' : 'text-mute'}`}>
                      {label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Lane({ lane, b, beats, p }: { lane: 'snare' | 'kick'; b: number; beats: BeatView[]; p: Panel }) {
  return (
    <>
      <span className="self-center text-xs font-semibold text-mute">{lane === 'snare' ? 'Snare' : 'Kick'}</span>
      {beats.map((view, beat) => {
        const current = p.cursor.bar === b && p.cursor.beat === beat
        return (
          <div
            key={beat}
            onClick={() => p.moveTo(b, beat)}
            onContextMenu={() => p.switchGrid(b, beat, view)}
            className={`flex gap-0.5 rounded-md p-0.5 ${current && lane === 'snare' ? 'outline-2 outline-accent' : ''}`}
          >
            {view.positions.map((position, i) =>
              lane === 'snare' ? (
                <Cell key={i} tone="snare" on={position === 'hit'} hold={position === 'hold'} onClick={() => p.toggleSnare(b, beat, i)} />
              ) : (
                <Cell key={i} tone="kick" on={p.hasKick(b, beat, i, view.triplet)} onClick={() => p.toggleKick(b, beat, i, view.triplet)} />
              ),
            )}
          </div>
        )
      })}
    </>
  )
}

/** B: each beat a card with the snare row on top and the kick row below (as the staff writes them), the count between. One bar a row. */
function VariantB(p: Panel) {
  return (
    <div className="flex flex-col gap-3" onContextMenu={(e) => e.preventDefault()}>
      {p.views.map((beats, b) => {
        const looped = inLoopRange(p.loopRange, b)
        return (
          <div key={b} className="flex flex-col gap-1">
            <BarHeader bar={b} looped={looped} onDelete={() => p.deleteBar(b)} />
            <div className="grid grid-cols-4 gap-2">
              {beats.map((view, beat) => {
                const current = p.cursor.bar === b && p.cursor.beat === beat
                return (
                  <div
                    key={beat}
                    onClick={() => p.moveTo(b, beat)}
                    onContextMenu={() => p.switchGrid(b, beat, view)}
                    className={`flex flex-col gap-1 rounded-xl border p-2 ${looped ? 'bg-loop/40' : 'bg-card'} ${
                      current ? 'border-accent ring-2 ring-accent' : 'border-line'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg/none font-bold">{beat + 1}</span>
                      <span className="ml-auto">
                        <GridSwitch small triplet={view.triplet} onSwitch={() => p.switchGrid(b, beat, view)} />
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {view.positions.map((position, i) => (
                        <Cell key={i} tone="snare" on={position === 'hit'} hold={position === 'hold'} onClick={() => p.toggleSnare(b, beat, i)} />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {countLabels(beat, view.triplet).map((label, i) => (
                        <span key={i} className={`flex-1 text-center font-mono text-[11px] ${i === 0 ? 'font-bold' : 'text-mute'}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {view.positions.map((_, i) => (
                        <Cell key={i} tone="kick" on={p.hasKick(b, beat, i, view.triplet)} onClick={() => p.toggleKick(b, beat, i, view.triplet)} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <p className="text-[11px] text-mute">Top row snare (hands), bottom row kick (feet).</p>
    </div>
  )
}

/** C: one row of cells per beat; a click cycles empty → snare → kick → both. Compact, 2+ bars a row. */
function VariantC(p: Panel) {
  const cycle = (b: number, beat: number, i: number, view: BeatView) => {
    const snare = view.positions[i] === 'hit'
    const kick = p.hasKick(b, beat, i, view.triplet)
    // empty → S → K → S+K → empty
    if (!snare && !kick) p.toggleSnare(b, beat, i)
    else if (snare && !kick) {
      p.toggleSnare(b, beat, i)
      p.toggleKick(b, beat, i, view.triplet)
    } else if (!snare && kick) p.toggleSnare(b, beat, i)
    else {
      p.toggleSnare(b, beat, i)
      p.toggleKick(b, beat, i, view.triplet)
    }
  }
  return (
    <div className="flex flex-wrap gap-3" onContextMenu={(e) => e.preventDefault()}>
      {p.views.map((beats, b) => {
        const looped = inLoopRange(p.loopRange, b)
        return (
          <div key={b} className={`flex items-end gap-1 rounded-lg border px-2 py-1.5 ${looped ? 'border-loop-line bg-loop/40' : 'border-line bg-card'}`}>
            <span className="mr-1 self-center font-mono text-xs text-mute">{b + 1}</span>
            {beats.map((view, beat) => {
              const current = p.cursor.bar === b && p.cursor.beat === beat
              return (
                <div
                  key={beat}
                  onClick={() => p.moveTo(b, beat)}
                  onContextMenu={() => p.switchGrid(b, beat, view)}
                  className={`flex flex-col items-stretch gap-0.5 rounded-md p-1 ${current ? 'bg-sky-100 outline-2 outline-accent' : ''}`}
                >
                  <div className="flex gap-0.5">
                    {view.positions.map((position, i) => {
                      const snare = position === 'hit'
                      const kick = p.hasKick(b, beat, i, view.triplet)
                      return (
                        <button
                          key={i}
                          type="button"
                          tabIndex={-1}
                          onMouseDown={keepFocus}
                          onClick={(e) => {
                            e.stopPropagation()
                            cycle(b, beat, i, view)
                          }}
                          className="flex h-14 w-9 cursor-pointer flex-col items-center justify-between rounded border border-line bg-card py-1.5 hover:border-accent"
                        >
                          <span className={`size-3.5 rounded-full ${snare ? 'bg-ink' : position === 'hold' ? 'h-1 w-full bg-ink/50' : ''}`} />
                          <span className={`size-3.5 rounded-full ${kick ? 'bg-orange-600' : ''}`} />
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-0.5">
                    {countLabels(beat, view.triplet).map((label, i) => (
                      <span key={i} className={`w-9 text-center font-mono text-[11px] ${i === 0 ? 'font-bold' : 'text-mute'}`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
            <button
              type="button"
              tabIndex={-1}
              title={`Delete bar ${b + 1}`}
              onMouseDown={keepFocus}
              onClick={() => p.deleteBar(b)}
              className="ml-1 cursor-pointer self-start text-xs text-mute hover:text-danger"
            >
              ✕
            </button>
          </div>
        )
      })}
      <p className="w-full text-[11px] text-mute">Click cycles: empty → snare (top dot) → kick (bottom dot) → both → empty. Right-click a beat switches 16ths / triplets.</p>
    </div>
  )
}
