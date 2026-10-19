# Spec: Written | Played

Status: ready-for-agent

Source: the as-written prototype's verdict (branch `prototype/as-written`, never merged), recorded in [ADR 0016](../../docs/adr/0016-written-or-played-one-staff-at-a-time.md). On 2026-10-19 the user chose a fixed-height **Written | Played** switch for the desktop and the phone. The choice is remembered on the device and starts on Played, and the sticking is printed in both versions.

Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

A drummer enters a line from a book (Syncopation, p. 34) as written: straight eighths and quarters on the snare. Then they practise it swung, with the jazz ride and the hi-hat on 2 & 4. The notation now shows it as played: on the triplet grid, under the ride, with the feet. That is right for hearing it, but the line as on the page is gone. To read it as written, the drummer has to turn the swing and the pattern off, then set them again.

## Solution

- When an exercise is played differently from how it is written, a **Written | Played** switch shows at the top left of the notation card: by the play button on the desktop, and in the same corner on the phone.
- **Played** is today's notation. **Written** shows the exercise alone, straight, with no pattern and no feet, as it was entered.
- Each line is laid out to fit either version: the taller one's height and the wider one's bar width. Switching never moves a bar, a line or the scroll.
- The choice is a device setting. It holds across exercises and reloads, and starts on Played.
- The playhead, the cursor, a click on a note or a bar number, the loop band and the sticking all work in either version.

## User Stories

1. As a drummer, when swing, a pattern, the bass drum or the hi-hat foot is on, I see a Written | Played switch at the top left of the notation, on the desktop and on the phone.
2. As a drummer, an exercise played as written (straight, no pattern, no feet) shows no switch, and its notation is unchanged.
3. As a drummer, Written shows my line as I entered it: straight, on the snare and kick rows, with no groove layer and no feet.
4. As a drummer, switching between Written and Played moves nothing on the page: not the bars, not the lines, not the scroll position. This holds on the desktop with Notation on Fit or not, and on the phone.
5. As a drummer, my choice is remembered on this device. When I open another exercise or reload, it shows the same version. A new device starts on Played.
6. As a drummer, the sticking is printed under my notes in either version.
7. As a drummer, in either version I can click a note to move the cursor to its beat, click a bar number to loop it, and see the cursor's beat and the loop band.
8. As a drummer playing in Written, the playhead marks the moment I'm hearing. On a written note, it's on that note. On a hit the written line doesn't have (the ride, a foot), it's between the written notes around it, in proportion to the time.
9. As a drummer, when I turn the pattern, swing and feet off, the switch goes away and the notation is the line as played (which is as written). When I turn them back on, it shows the version I last chose.

## Implementation Decisions

### Exercise core (the test seam)

- **`playedAsWritten(practice, timeSignature)`**: true when nothing changes the line in playback. That means no pattern, no bass drum, no hi-hat foot, and swing off (`swingOn` false; in compound time swing never applies). The switch shows when this is false.
- **The written parts** are `staffParts(bars, 'off', { compound })`: the speller's straight output, with no groove layer and no feet. No new speller code.
- **The line's layout covers both versions.** `notationFit` is given the larger of the two versions' `minBarWidthFor` and the larger line height, so both lay out the same. The line height is the renderer's: stave spacing, the stems-up space, the sticking row and the feet's triplet room. So the renderer measures both versions and passes the larger.
- **The playhead between written notes.** A pure function places a hit's tick within a bar from the bar's anchors, the (tick, x) of each written event's start plus the bar's end. A tick on an anchor gets its x; a tick between two anchors is interpolated linearly. Unit-tested in the core with plain numbers.

### Device setting

- `DeviceSettings.notationShows: 'played' | 'written'`, default `'played'`. Read through `deviceSettingsFrom`, so stored settings without it start on Played. It is never exported, like every device setting.

### Renderer (`src/features/notation/staff.ts`)

- `drawExercise` takes which version to draw. It computes the parts of both, works out each version's line height and minimum bar width, lays the lines out to the larger of each, and draws one version.
- `Drawing.playheadMark` keeps its shape. In Written, the line's x comes from the written anchors (above), at the written staff's own top and bottom.
- The sticking is drawn in both versions, keyed by note id, which the written and played parts share for the exercise's notes.

### UI

- The switch is the shared `Segmented` control, small, labelled "Show the line", with the options Written and Played. It sits at the top left of the notation card, clear of the desktop's play button and in the padding the beat count already keeps. Placing it moves nothing.
- On the desktop it sits right of the play button's gutter. On the phone it sits at the top left of the notation view.

## Testing Decisions

- Core, Vitest: `playedAsWritten` across pattern, bass drum, hi-hat foot, swing, and compound time; the playhead interpolation (on an anchor, between anchors, before the first, at the bar's end); `deviceSettingsFrom` defaulting `notationShows`.
- The fixed height is checked in the browser, not in unit tests. In Played and in Written, every bar number's position on screen is the same before and after switching. Check this on jazz comping and rock beat, at 1440 × 900 (Fit on and off) and 390 × 844, with real mouse clicks. The prototype's `protoB.mjs` and `proto.mjs` show the measurement.

## Out of Scope

- The book's *interpretations*: the line on the snare under a ride, its long notes on the kick, and fill-ins.
- Showing both versions at once.
- A per-exercise or per-folder choice.
- A keyboard shortcut for the switch.

## Further Notes

- `CONTEXT.md` gains **As written** and **As played** (under Practice), and Device settings lists the notation's version.
- A prototype gap not to carry over: in its Written view (variant E), a hit with no written note had no playhead. Story 8 covers it; variant B's interpolation is the model.
