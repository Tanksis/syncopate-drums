// The playback engine: a thin Web Audio layer over the core's `schedule`. A Worker tick every
// 25 ms asks the core for the next 100 ms of events and starts each sound on the audio clock,
// so timing is sample-accurate however late the tick itself runs.

import type { DeviceSettings, Exercise, Instrument, Layer, PlayPosition, Playhead, ScheduledEvent, TimelineEntry } from '@/core'
import { layerLevels, playheadAt, recordEvents, resumePosition, schedule, trimTimeline } from '@/core'

const LOOKAHEAD = 0.1
/** Head start for the first event, so it isn't late before the first tick has run. */
const START_DELAY = 0.05
/**
 * Seconds the drummer hears a sound after the output clock says it played. The playhead is
 * drawn this much later. Zero unless the playhead turns out to drift on the user's laptop.
 */
const HIGHLIGHT_LATENCY = 0

/**
 * The gain each layer feeds into the master at its usual level, scaled by the device volumes. The
 * ride sample is about 11 dB quieter than the snare (roughly K-weighted, over the first 400 ms), so
 * the groove is raised that much to sit level with the snare.
 */
const LAYER_GAIN: Record<Layer, number> = { click: 0.6, exercise: 0.9, groove: 3.5 }

/** Seconds a volume change takes to settle, so a slider drag doesn't crackle. */
const VOLUME_SMOOTHING = 0.02

/**
 * Virtuosity Drums one-shots for each kit piece, played round-robin, at a fixed velocity. The
 * overhead mics barely pick up the bass drum: its samples are about 20 dB (vl2) and 31 dB (vl1)
 * quieter than the snare's (RMS over the first 400 ms). So the kick is raised 20 dB to sit level
 * with the snare, and the feathered kick, already raised with the groove layer, sits about 10 dB
 * under it: soft, but heard. Raised that much, the kick's room tail (two seconds, only about 17 dB
 * down at 300 ms) booms into the next hits, so it is faded out after `hold` seconds.
 */
const SAMPLES: Record<Exclude<Instrument, 'click'>, { files: string[]; velocity: number; hold?: number }> = {
  snare: { files: ['oh_snare_center_vl18', 'oh_snare_center_vl21', 'oh_snare_center_vl24'], velocity: 1 },
  kick: { files: ['oh_kick_snoff_vl2_rr1', 'oh_kick_snoff_vl2_rr2'], velocity: 10, hold: 0.06 },
  kickFeathered: { files: ['oh_kick_snoff_vl1_rr1', 'oh_kick_snoff_vl1_rr2'], velocity: 2.8 },
  ride: { files: ['oh_ride_ride_vl2_rr1', 'oh_ride_ride_vl2_rr2'], velocity: 0.85 },
  rideBell: { files: ['oh_ride_bell_vl2_rr1'], velocity: 0.85 },
  hihatClosed: { files: ['oh_hh_closed_vl2_rr1', 'oh_hh_closed_vl3_rr1'], velocity: 0.8 },
  hihatPedal: { files: ['oh_hh_pedal_vl2_rr1', 'oh_hh_pedal_vl2_rr2'], velocity: 0.9 },
}

/** What the engine reads on every tick, so edits and tempo changes apply while playing. */
export interface PlaybackInput {
  exercise: Exercise
  device: DeviceSettings
}

interface Audio {
  ctx: AudioContext
  layers: Record<Layer, GainNode>
  buffers: Map<string, AudioBuffer>
}

let audio: Audio | undefined
let loading: Promise<void> | undefined
let worker: Worker | undefined
/** Bumped by every start and stop, so a start still loading samples knows it was cancelled. */
let generation = 0
/** The first position not yet scheduled, and the audio-clock time it falls at. */
let cursor: { position: PlayPosition | 'start'; time: number } | undefined
let read: (() => PlaybackInput) | undefined
const sources = new Set<AudioScheduledSourceNode>()
/** Every event scheduled and not yet long past, on the audio clock, for the playhead. */
let timeline: TimelineEntry[] = []
const roundRobin = new Map<Instrument, number>()
/** The gain each layer was last set to. */
const gainTargets: Record<Layer, number> = { ...LAYER_GAIN }

/**
 * Starts playback from the count-in, or from `from` to resume after a pause. Call it from a user
 * gesture (a click or key press), so the browser lets audio start. Resolves once the first sounds
 * are scheduled.
 */
export async function startPlayback(input: () => PlaybackInput, from: PlayPosition | 'start' = 'start'): Promise<void> {
  stopPlayback()
  const mine = generation
  const { ctx } = (audio ??= createAudio())
  loading ??= loadSamples(audio).catch((error) => {
    loading = undefined // let the next start try again
    throw error
  })
  await Promise.all([ctx.resume(), loading])
  if (mine !== generation) return
  read = input
  cursor = { position: from, time: ctx.currentTime + START_DELAY }
  worker ??= createTicker()
  worker.postMessage('start')
  tick()
}

/** Stops playback at once, cancelling every sound already scheduled. */
export function stopPlayback(): void {
  generation++
  worker?.postMessage('stop')
  cursor = undefined
  timeline = []
  for (const source of sources) {
    source.onended = null
    source.stop()
    source.disconnect()
  }
  sources.clear()
}

/**
 * Stops playback like `stopPlayback`, and returns where to resume: the first sound not yet heard.
 * Undefined if nothing had been scheduled yet.
 */
export function pausePlayback(): PlayPosition | undefined {
  const position = audio && cursor ? resumePosition(timeline, heardTime(audio.ctx)) ?? cursor.position : undefined
  stopPlayback()
  return position === 'start' ? undefined : position
}

/**
 * Where playback is now, by what the drummer hears rather than what is scheduled: the position
 * and the latest hit on the staff. Undefined when stopped, and during the head start before the first sound.
 */
export function playhead(): Playhead | undefined {
  if (!audio || !cursor) return undefined
  return playheadAt(timeline, heardTime(audio.ctx))
}

/** The audio-clock time of the sound reaching the speakers now. */
function heardTime(ctx: AudioContext): number {
  const { contextTime, performanceTime } = ctx.getOutputTimestamp()
  // Some browsers report no output timestamp until the output has started.
  const output = contextTime && performanceTime
    ? contextTime + (performance.now() - performanceTime) / 1000
    : ctx.currentTime - (ctx.baseLatency || 0) - (ctx.outputLatency || 0)
  return output - HIGHLIGHT_LATENCY
}

function createAudio(): Audio {
  playThroughSilentSwitch()
  const ctx = new AudioContext({ latencyHint: 'interactive' })
  const master = ctx.createGain()
  master.connect(ctx.destination)
  const layers = Object.fromEntries(
    Object.entries(LAYER_GAIN).map(([layer, value]) => {
      const gain = ctx.createGain()
      gain.gain.value = value
      gain.connect(master)
      return [layer, gain]
    }),
  ) as Record<Layer, GainNode>
  return { ctx, layers, buffers: new Map() }
}

/**
 * On iOS, Web Audio is muted by the silent switch unless the page's audio session is "playback",
 * like a music app. Set before the audio context starts; browsers without the API skip it.
 */
function playThroughSilentSwitch(): void {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) session.type = 'playback'
}

async function loadSamples({ ctx, buffers }: Audio): Promise<void> {
  const files = Object.values(SAMPLES).flatMap((s) => s.files)
  await Promise.all(
    files.map(async (file) => {
      const response = await fetch(`${import.meta.env.BASE_URL}samples/${file}.flac`)
      if (!response.ok) throw new Error(`Could not load the ${file} sample (${response.status})`)
      buffers.set(file, trimOnset(ctx, await ctx.decodeAudioData(await response.arrayBuffer())))
    }),
  )
}

/** Cuts the silence before a sample's onset, so it sounds exactly when it is started. */
function trimOnset(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c))
  let peak = 0
  for (const data of channels) for (const v of data) peak = Math.max(peak, Math.abs(v))
  const threshold = peak * 0.01
  let onset = 0
  while (onset < buffer.length && channels.every((data) => Math.abs(data[onset]) <= threshold)) onset++
  // Keep about a millisecond before the threshold crossing, so the attack isn't clipped.
  const start = Math.max(0, onset - Math.round(buffer.sampleRate * 0.001))
  const trimmed = ctx.createBuffer(buffer.numberOfChannels, buffer.length - start, buffer.sampleRate)
  channels.forEach((data, c) => trimmed.copyToChannel(data.subarray(start), c))
  return trimmed
}

function createTicker(): Worker {
  const ticker = new Worker(new URL('./ticker.worker.ts', import.meta.url), { type: 'module' })
  ticker.onmessage = tick
  return ticker
}

/** Schedules everything between the cursor and the lookahead horizon. */
function tick(): void {
  if (!audio || !cursor || !read) return
  const { exercise, device } = read()
  const now = audio.ctx.currentTime
  setLevels(audio, device)
  // After a stall longer than the lookahead, carry on from now rather than play the missed
  // events all at once: the music pauses for the stall but stays in time afterwards.
  if (cursor.time < now) cursor = { ...cursor, time: now + START_DELAY }
  const horizon = now + LOOKAHEAD
  const result = schedule(exercise, exercise.practice, device, cursor.position, horizon - cursor.time)
  timeline = trimTimeline(timeline, heardTime(audio.ctx))
  for (const event of result.events) play(audio, cursor.time + event.time, event)
  timeline = recordEvents(timeline, result.events, cursor.time)
  cursor = { position: result.next, time: cursor.time + result.nextTime }
}

/** Sets each layer's gain from the device volumes, so slider moves apply while playing. */
function setLevels({ ctx, layers }: Audio, device: DeviceSettings): void {
  const levels = layerLevels(device)
  for (const layer of Object.keys(layers) as Layer[]) {
    const target = LAYER_GAIN[layer] * levels[layer]
    if (gainTargets[layer] === target) continue
    gainTargets[layer] = target
    layers[layer].gain.setTargetAtTime(target, ctx.currentTime, VOLUME_SMOOTHING / 3)
  }
}

function play(audio: Audio, when: number, event: ScheduledEvent): void {
  const source = event.instrument === 'click' ? click(audio, when, event.accent) : sample(audio, when, event)
  sources.add(source)
  source.onended = () => {
    sources.delete(source)
    source.disconnect()
  }
}

/** Seconds a held sample takes to fade by about 9 dB (one time constant), and when it is cut off. */
const FADE = 0.04
const FADE_END = 0.25

/** A short synthesized beep: higher and louder on beat 1. */
function click({ ctx, layers }: Audio, when: number, accent: boolean): AudioScheduledSourceNode {
  const osc = ctx.createOscillator()
  const envelope = ctx.createGain()
  osc.frequency.value = accent ? 1800 : 1200
  envelope.gain.setValueAtTime(0.0001, when)
  envelope.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, when + 0.001)
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.04)
  osc.connect(envelope).connect(layers.click)
  osc.start(when)
  osc.stop(when + 0.05)
  return osc
}

function sample({ ctx, layers, buffers }: Audio, when: number, event: ScheduledEvent): AudioScheduledSourceNode {
  const { files, velocity, hold } = SAMPLES[event.instrument as Exclude<Instrument, 'click'>]
  const turn = ((roundRobin.get(event.instrument) ?? -1) + 1) % files.length
  roundRobin.set(event.instrument, turn)
  const source = ctx.createBufferSource()
  source.buffer = buffers.get(files[turn])!
  const gain = ctx.createGain()
  gain.gain.value = velocity * (event.velocity ?? 1)
  source.connect(gain).connect(layers[event.kind])
  source.start(when)
  if (hold !== undefined) {
    gain.gain.setTargetAtTime(0, when + hold, FADE)
    source.stop(when + hold + FADE_END)
  }
  return source
}
