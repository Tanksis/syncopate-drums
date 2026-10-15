// The mix: how loud each playback layer is, from the device's volumes and each layer's mute.

import type { DeviceSettings } from './model'
import type { ScheduledEvent } from './schedule'

export type Layer = ScheduledEvent['kind']

/**
 * Each layer's level, relative to its usual one: 1 is as usual, 0 is silent. A muted click keeps
 * its level, as the count-in still plays on it: `clickHeard` silences the rest.
 */
export function layerLevels(device: DeviceSettings): Record<Layer, number> {
  return {
    click: device.clickVolume,
    exercise: device.exerciseMuted ? 0 : device.exerciseVolume,
    groove: device.grooveMuted ? 0 : device.grooveVolume,
  }
}

/** Whether an exercise's click sounds: with the click muted, only the count-in's do. */
export function clickHeard(event: ScheduledEvent, device: DeviceSettings): boolean {
  return !device.clickMuted || event.position.bar < 0
}
