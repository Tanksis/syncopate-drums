# 09: Mute the click on the Practice screen, and the Metronome defaults to the beep

**What to build:** The user's request (2026-10-15): "You should be able to mute the metronome on the practice screen. You should also use the metronome sound the practice screen uses as the default sound on the metronome page. Remove cowbell hi-hat and ride bell from sound options." Asked where the mute goes: in the transport. Asked whether the count-in still clicks when muted: yes.

- **Click mute** in the Practice screen's transport: a speaker button beside Count-in in the exercise bar, in the Settings sidebar's Playback group when the bar has no room, and on the phone's transport bar (portrait and sideways). It is the same mute as Mix's Click row.
- **A muted click keeps the count-in:** only the clicks from the first bar on are silenced.
- **Sounds:** Beep and Wood block. Cowbell, Hi-hat and Ride bell go; a stored one falls back to the default.
- **Default sound:** Beep, the Practice screen's click.

**Blocked by:** none

**Status:** done

- [x] The click mute in the exercise bar, the Playback group and the phone's transport bar, in step with Mix's Click row
- [x] Muted, the count-in still clicks and the rest is silent
- [x] Only Beep and Wood block to pick from; a removed sound stored falls back to Beep
- [x] Fresh metronome settings start on Beep
- [x] Checked at 1280 px (sidebars open), 1100 px, a phone and a phone sideways

## Comments

- The mute adds 40 px to the exercise bar, so the BPM slider is narrower (112 → 80 px) and the bar's steps are now 788 / 702 px (measured: Warm needs 785, Studio 780; the slider 86). At 1280 px with both sidebars open the whole transport still shows.
- A metronome already saved on a device keeps its sound: a saved Wood block (the old default) stays Wood block.
