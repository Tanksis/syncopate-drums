// The playback engine: a thin Web Audio layer over the core's `schedule` and `metronomeSchedule`.
// A Worker tick every 25 ms asks the core for the next 100 ms of events and starts each sound on
// the audio clock, so timing is sample-accurate however late the tick itself runs. It plays one
// source at a time, the exercise or the metronome: starting one stops the other.

import type {
  BeatLevel,
  DeviceSettings,
  Exercise,
  Instrument,
  Layer,
  MetronomeSettings,
  MetronomeSound,
  PlayPosition,
  Playhead,
  ScheduleResult,
  ScheduledEvent,
  TimelineEntry,
} from '@/core'
import { layerLevels, metronomeClickGain, metronomeSchedule, playheadAt, recordEvents, resumePosition, schedule, trimTimeline } from '@/core'

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

/**
 * What the engine plays, read on every tick so edits, tempo and settings changes apply while
 * playing: the open exercise with the device's mix, or the metronome with its own settings.
 */
export type PlaybackSource =
  | { kind: 'exercise'; exercise: Exercise; device: DeviceSettings }
  | { kind: 'metronome'; metronome: MetronomeSettings }

/** The metronome plays on the click layer alone, at its usual level: its own volumes set how loud. */
const METRONOME_LAYERS: Record<Layer, number> = { click: 1, exercise: 0, groove: 0 }

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
let read: (() => PlaybackSource) | undefined
const sources = new Set<AudioScheduledSourceNode>()
/** Every event scheduled and not yet long past, on the audio clock, for the playhead. */
let timeline: TimelineEntry[] = []
const roundRobin = new Map<Instrument, number>()
/** The gain each layer was last set to. */
const gainTargets: Record<Layer, number> = { ...LAYER_GAIN }

/**
 * Starts playing a source, stopping whatever was playing: an exercise from the count-in, or from
 * `from` to resume after a pause; the metronome from its first beat. Call it from a user gesture
 * (a click or key press), so the browser lets audio start. Resolves once the first sounds are
 * scheduled.
 */
export async function startPlayback(input: () => PlaybackSource, from: PlayPosition | 'start' = 'start'): Promise<void> {
  stopPlayback()
  const mine = generation
  const { ctx } = await readyAudio()
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
 * Plays one accented click of the metronome's sound, so a sound picked while nothing plays is
 * heard at once. While anything plays it does nothing: the metronome's next click is the sound. Call it
 * from a user gesture.
 */
export async function previewMetronomeSound(metronome: MetronomeSettings): Promise<void> {
  const current = await readyAudio()
  if (cursor) return
  setLevels(current, METRONOME_LAYERS)
  CLICK_SOUNDS[metronome.sound](current, current.ctx.currentTime + START_DELAY, 'high', metronomeClickGain('accent', metronome))
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
 * and the latest hit on the staff. For the metronome, `metronomeBeat` of the position is the beat
 * to light. Undefined when stopped, and during the head start before the first sound.
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

/**
 * Whether playback is meant to be running but the system has stopped the audio: on iOS, leaving
 * the app interrupts the page's audio context.
 */
export function audioInterrupted(): boolean {
  return cursor !== undefined && audio !== undefined && audio.ctx.state !== 'running'
}

/**
 * The audio context, running, with the samples loaded: made on first use. A context that isn't
 * running once it has been started was stopped by the system (on iOS, by leaving the app), and
 * its resume() may wait for good, so a fresh one is made, here in the Play gesture, keeping the
 * samples.
 */
async function readyAudio(): Promise<Audio> {
  if (audio && audio.ctx.state !== 'running') {
    audio.ctx.close().catch(() => {})
    audio = { ...createAudio(), buffers: audio.buffers }
  }
  const ready = (audio ??= createAudio())
  loading ??= loadSamples(ready).catch((error) => {
    loading = undefined // let the next start try again
    throw error
  })
  await Promise.all([ready.ctx.resume(), loading])
  return ready
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
  const source = read()
  const now = audio.ctx.currentTime
  setLevels(audio, source.kind === 'exercise' ? layerLevels(source.device) : METRONOME_LAYERS)
  // After a stall longer than the lookahead, carry on from now rather than play the missed
  // events all at once: the music pauses for the stall but stays in time afterwards.
  if (cursor.time < now) cursor = { ...cursor, time: now + START_DELAY }
  const horizon = now + LOOKAHEAD
  const result = scheduleSource(source, cursor.position, horizon - cursor.time)
  timeline = trimTimeline(timeline, heardTime(audio.ctx))
  for (const event of result.events) play(audio, cursor.time + event.time, event, source)
  timeline = recordEvents(timeline, result.events, cursor.time)
  cursor = { position: result.next, time: cursor.time + result.nextTime }
}

/** The source's events for one window: the exercise's schedule or the metronome's. */
function scheduleSource(source: PlaybackSource, from: PlayPosition | 'start', window: number): ScheduleResult {
  if (source.kind === 'metronome') return metronomeSchedule(source.metronome, from, window)
  return schedule(source.exercise, source.exercise.practice, source.device, from, window)
}

/** Sets each layer's gain to its level, so slider moves apply while playing. */
function setLevels({ ctx, layers }: Audio, levels: Record<Layer, number>): void {
  for (const layer of Object.keys(layers) as Layer[]) {
    const target = LAYER_GAIN[layer] * levels[layer]
    if (gainTargets[layer] === target) continue
    gainTargets[layer] = target
    layers[layer].gain.setTargetAtTime(target, ctx.currentTime, VOLUME_SMOOTHING / 3)
  }
}

function play(audio: Audio, when: number, event: ScheduledEvent, playing: PlaybackSource): void {
  for (const node of startSounds(audio, when, event, playing)) {
    sources.add(node)
    node.onended = () => {
      sources.delete(node)
      node.disconnect()
    }
  }
}

/** Starts an event's sounds, returning their nodes: none for an Off beat. */
function startSounds(audio: Audio, when: number, event: ScheduledEvent, playing: PlaybackSource): AudioScheduledSourceNode[] {
  if (event.instrument !== 'click') {
    const { velocity } = SAMPLES[event.instrument]
    return [sample(audio, when, event.instrument, velocity * (event.velocity ?? 1), audio.layers[event.kind])]
  }
  if (playing.kind === 'exercise') return beep(audio, when, event.accent ? 'high' : 'mid', event.accent ? 0.9 : 0.55)
  const level = event.level ?? 'normal'
  const gain = metronomeClickGain(level, playing.metronome)
  if (gain <= 0) return []
  return CLICK_SOUNDS[playing.metronome.sound](audio, when, CLICK_PITCH[level], gain)
}

/** A click's pitch: Accent highest (on the synthesized sounds), subdivision clicks lowest. */
type Pitch = 'high' | 'mid' | 'low'

const CLICK_PITCH: Record<BeatLevel | 'subdivision', Pitch> = {
  accent: 'high',
  normal: 'mid',
  soft: 'mid',
  off: 'mid',
  subdivision: 'low',
}

/**
 * One of the metronome's sounds: plays a click at a pitch and a gain (1 is an accent at the beats'
 * usual volume) into the click layer.
 */
type ClickSound = (audio: Audio, when: number, pitch: Pitch, gain: number) => AudioScheduledSourceNode[]

/**
 * The kit's samples sit level with the snare once the groove layer raises them over the
 * exercise's; on the click layer they are raised the same, so an accent sits with the beep's.
 */
const SAMPLE_CLICK_GAIN = LAYER_GAIN.groove / LAYER_GAIN.exercise

const CLICK_SOUNDS: Record<MetronomeSound, ClickSound> = {
  beep: (audio, when, pitch, gain) => beep(audio, when, pitch, 0.9 * gain),
  woodBlock,
  cowbell,
  hihat: (audio, when, pitch, gain) => [sampleClick(audio, when, 'hihatClosed', pitch, gain)],
  rideBell: (audio, when, pitch, gain) => [sampleClick(audio, when, 'rideBell', pitch, gain)],
}

/** How fast a sampled click plays: subdivision clicks a little slower, so lower; the beats as recorded. */
const SAMPLE_RATE: Record<Pitch, number> = { high: 1, mid: 1, low: 0.85 }

/** A metronome click on one of the kit's samples, into the click layer. */
function sampleClick(
  audio: Audio,
  when: number,
  instrument: 'hihatClosed' | 'rideBell',
  pitch: Pitch,
  gain: number,
): AudioScheduledSourceNode {
  const level = SAMPLES[instrument].velocity * SAMPLE_CLICK_GAIN * gain
  return sample(audio, when, instrument, level, audio.layers.click, SAMPLE_RATE[pitch])
}

/** Seconds a held sample takes to fade by about 9 dB (one time constant), and when it is cut off. */
const FADE = 0.04
const FADE_END = 0.25

/** A short synthesized beep: the exercise's click, and the metronome's Beep. */
function beep({ ctx, layers }: Audio, when: number, pitch: Pitch, peak: number): AudioScheduledSourceNode[] {
  const osc = ctx.createOscillator()
  osc.frequency.value = { high: 1800, mid: 1200, low: 900 }[pitch]
  osc.connect(strike(ctx, when, peak, 0.04)).connect(layers.click)
  osc.start(when)
  osc.stop(when + 0.05)
  return [osc]
}

/** A wood block: a sine that drops a little in pitch as it starts, with a short hollow decay. */
function woodBlock({ ctx, layers }: Audio, when: number, pitch: Pitch, gain: number): AudioScheduledSourceNode[] {
  const frequency = { high: 1250, mid: 950, low: 760 }[pitch]
  const osc = ctx.createOscillator()
  osc.frequency.setValueAtTime(frequency * 1.06, when)
  osc.frequency.exponentialRampToValueAtTime(frequency, when + 0.015)
  osc.connect(strike(ctx, when, 0.9 * gain, 0.07)).connect(layers.click)
  osc.start(when)
  osc.stop(when + 0.08)
  return [osc]
}

/** A cowbell, after the TR-808's: two detuned square waves through a band-pass, ringing a little longer. */
function cowbell({ ctx, layers }: Audio, when: number, pitch: Pitch, gain: number): AudioScheduledSourceNode[] {
  const scale = { high: 1.12, mid: 1, low: 0.84 }[pitch]
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 2640 * scale
  band.Q.value = 1
  band.connect(strike(ctx, when, 0.9 * gain, 0.25)).connect(layers.click)
  return [540, 800].map((frequency) => {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = frequency * scale
    osc.connect(band)
    osc.start(when)
    osc.stop(when + 0.27)
    return osc
  })
}

/** A struck envelope: up to `peak` in a millisecond, then an exponential fall to silence by `decay` seconds. */
function strike(ctx: AudioContext, when: number, peak: number, decay: number): GainNode {
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0.0001, when)
  envelope.gain.exponentialRampToValueAtTime(peak, when + 0.001)
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + decay)
  return envelope
}

function sample(
  { ctx, buffers }: Audio,
  when: number,
  instrument: Exclude<Instrument, 'click'>,
  level: number,
  layer: GainNode,
  playbackRate = 1,
): AudioScheduledSourceNode {
  const { files, hold } = SAMPLES[instrument]
  const turn = ((roundRobin.get(instrument) ?? -1) + 1) % files.length
  roundRobin.set(instrument, turn)
  const source = ctx.createBufferSource()
  source.buffer = buffers.get(files[turn])!
  source.playbackRate.value = playbackRate
  const gain = ctx.createGain()
  gain.gain.value = level
  source.connect(gain).connect(layer)
  source.start(when)
  if (hold !== undefined) {
    gain.gain.setTargetAtTime(0, when + hold, FADE)
    source.stop(when + hold + FADE_END)
  }
  return source
}
