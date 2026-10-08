# Spec: Notation spacing

Status: ready-for-agent

Source: the user's question after [ui-polish](../ui-polish/spec.md) (PR #47): a one-bar exercise with a busy ride pattern is cramped on a smaller screen, because a lone bar only gets its share of a 4-bar line. Decided with the user on 2026-10-08. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

When I practise a one- or two-bar groove, the notation draws it at the width of one bar in a full line of four. Most of the line is empty, and the ride or hi-hat notes are squeezed together. The auto-fit from ui-polish makes everything bigger, but it scales the spacing and the noteheads together, so a busy pattern still looks just as tight. On a smaller screen, a four-bar groove with sixteenth hi-hats is also cramped at the minimum bar width.

## Solution

- **An exercise that fits on one line fills that line.** Its bars share the line's width, so one bar spans the whole line, two bars get half each, and so on.
- **A bar is never wider than a cap** of about two and a half times the minimum bar width, so a sparse bar on a big screen isn't stretched thin. Past the cap, the line is left aligned with room to its right, as a short line is today. The auto-fit scale takes the rest.
- **Exercises of more than one line are unchanged.** Every bar has the same width, so beat 1 lines up from line to line, and a short last line keeps that width rather than being stretched (engraving practice: a mostly empty final system isn't justified).
- **Later (ticket 02, needs triage):** the minimum bar width grows with how busy the music is, so a dense groove drops to fewer bars a line sooner on a small screen.

## User Stories

1. As a drummer practising a one- or two-bar groove, I want the bars to spread across the line, so that busy ride and hi-hat patterns have room and read clearly from the kit.
2. As a drummer on a big screen, I want a sparse bar not to be stretched across the whole width, so that four quarter notes don't look lost.
3. As a drummer reading a longer exercise, I want every bar the same width and lined up from line to line, so that I can keep my place while playing.
4. As a drummer, I want a short last line not to be stretched, so that its rhythm is spaced like the lines above it.
5. *(ticket 02)* As a drummer on a small screen, I want a busy groove put on fewer bars a line, so that its notes aren't crushed together.

## Implementation Decisions

### Exercise core (the test seam)

- **`notationFit` also returns the bar width** (in the drawing's units, before scaling), so the whole layout rule lives in the core:
  - available width = `width / scale - 2 × margin - clefWidth` (as now);
  - if the whole exercise fits on one line at the chosen scale (`bars ≤ barsPerLine`), the bar width is `min(available / bars, maxBarWidth)`;
  - otherwise it is `available / barsPerLine`, as `drawExercise` computes it today.
- **`NOTATION_LAYOUT.maxBarWidth`** is new, 475 (2.5 × `minBarWidth`, 190).
- **The scale rule is unchanged**: the largest scale, in steps of 0.05 up to 1.6, that adds no line and fits the height. Filling the line doesn't change how many lines there are, so it doesn't change the scale.

### App

- `drawExercise` takes the bar width from `notationFit` instead of working it out. The first bar still also gets the clef's width, and bars stay left aligned.
- The playhead line, the current-bar shade, the loop band, the hint box (`firstStaff`) and clicks already follow the drawn bar positions, so they need no change. Check them anyway.

## Testing Decisions

- **One seam: the exercise core's public interface (`notationFit`)**, as before. For example:
  - "one bar fills the line: its width is the available width at its scale";
  - "two bars on one line split it";
  - "one bar in a very wide area is capped at 475";
  - "five bars (4 + 1) all get a quarter of the line, so the last line isn't stretched";
  - "the scale picked is the same as before for the existing cases" (the existing `notationFit` tests keep passing).
- **Not tested automatically:** the drawing. Check it in the browser with real mouse events: one bar of sixteenth hi-hats at 1280 px and at 900 px, two bars, five bars, and clicks on a note, a hand and a bar number in a filled bar.

## Out of Scope

- A manual zoom control. Revisit only if filling the line isn't enough.
- Bar widths that vary with each bar's content within a line (engraved-score style). Bars on a line stay equal, for the aligned grid.
- Changing the most bars a line holds (4).
