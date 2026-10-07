// The mix: how loud each playback layer is, from the device's volumes and the exercise mute.

import type { DeviceSettings } from "./model";
import type { ScheduledEvent } from "./schedule";

export type Layer = ScheduledEvent["kind"];

/** Each layer's level, relative to its usual one: 1 is as usual, 0 is silent. */
export function layerLevels(device: DeviceSettings): Record<Layer, number> {
  return {
    click: device.clickVolume,
    exercise: device.exerciseMuted ? 0 : device.exerciseVolume,
    groove: device.grooveVolume,
  };
}
