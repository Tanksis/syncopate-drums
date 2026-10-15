# Spec: Phone and defaults

Status: ready-for-agent

Source: the user's feedback on 2026-10-14, after design-and-looks. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

- **Desktop opens with the editor collapsed.** A first launch opens an example, and an example opens with the editor collapsed (design-and-looks story 16). The user wants it open by default.
- **"Look" is the wrong word.** The user calls it the theme, and wants Warm, not Studio, as the default.
- **Phone settings are jumbled.** Each row lines up differently: menus start at a label column, segmented controls sit at the right, and the Mix sliders start somewhere else again.
- **The phone's ⚙ glyph.** The user doesn't like it. The desktop header already uses a two-sliders icon.
- **Triplets are cramped on a phone.** "Example: triplets" squeezes its notes together while "Example: syncopated eighths" is spread out.
- **The phone editor sheet's header is crowded.** ‹, +, undo, redo, the bar menu and Done leave room for about one bar tab, so choosing a bar is hard.

## Solution

1. The docked editor opens expanded by default, examples included. Its chevron and the saved `editorCollapsed` setting still work as before.
2. The Appearance menu is labelled **Theme**, and **Warm** is the default for a new device. `Mode` stays as is. In code it stays `look` (the stored key and ADR 0013).
3. The phone settings get a cleaner layout (ticket 05, from a mockup).
4. The phone header uses the desktop's two-sliders settings icon, and a matching line icon for the exercises menu.
5. When scaling the notation up, a bar is never squeezed below 80% of its minimum width, so busy music (triplets, sixteenths) on a phone is drawn a little smaller and spread out, as eighths are.
6. The phone editor sheet's header gives the bar tabs most of the row (ticket 06, from a mockup).

## Testing Decisions

- The notation fit is tested at the core's seam (`notationFit`): a triplet exercise on a phone-sized area keeps its bars at least 80% of `tripletBarWidth`, and an eighths exercise still scales to the same size as before.
- The default device settings test changes to Warm.
- Everything else is checked in the browser at 1280 px and 390 × 844.
