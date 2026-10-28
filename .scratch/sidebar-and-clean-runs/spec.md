# The exercises sidebar, tidied, and clean runs

Asked for on 2026-10-28, before rudiments ticket 06.

## Problem

The sidebar's three tabs (Library, Examples, Rudiments) crowd one row, and a Copy to Library button takes another on Examples and Rudiments. The Rudiments tab is one long flat list of 40. A drummer has nowhere to note the tempos they've played an exercise cleanly at, to see their progress over time.

## Decisions (asked 2026-10-28)

- **The tabs become a dropdown title.** The sidebar's heading reads the list showing ("Rudiments ▾") and opens a menu of the three. Copy to Library is a small icon beside it.
- **The rudiment families fold.** Each family (Rolls, Diddles, Flams, Drags) is a folder with a chevron and a count of the rudiments built so far, folded by default.
- **A clean run is a dated log entry.** "Played it clean" by the tempo logs today's date and the current BPM. The list shows each exercise's best clean BPM; the exercise shows its history, and a wrong entry can be removed.
- **Every exercise gets it:** rudiments, examples and the drummer's own. An own exercise's clean runs go with it on export.

## Stories

1. As a drummer, the sidebar's heading names the list showing, and choosing it lets me switch between Library, Examples and Rudiments, with a dot on the one holding the open exercise.
2. As a drummer on Examples or Rudiments, a small copy icon beside the heading makes an editable copy of the open one.
3. As a drummer, the rudiment families are folders I can open and close, each with how many of its rudiments are built, and they stay as I left them on this device.
4. As a drummer who has just played an exercise cleanly, I tap "Played it clean" and it logs today's date with the BPM.
5. As a drummer, the sidebar shows ✓ and my best clean BPM beside each exercise I've logged.
6. As a drummer, I can see an exercise's clean runs, newest first, and remove one logged by mistake.
7. As a drummer, exporting my exercises keeps their clean runs, and importing them brings them back.

## Tickets

1. The dropdown title and the folding families.
2. Clean runs: logging, the best BPM in the list, the history, export.
3. Icon tabs in place of the heading's menu.
4. Rudiment names wrap rather than being cut short.
