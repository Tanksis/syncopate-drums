# Syncopate!

Syncopate! (repo `syncopate-drums`) is a personal drum practice tool: enter rhythm exercises (e.g. lines from Ted Reed's *Syncopation*), see the sticking, add a groove layer on top, and hear and play along with them against a metronome.

## Language

### Exercises

**Exercise**:
An ordered run of bars practiced as one unit; typically one numbered line from a method book. Known to the user by a free-text name, which need not be unique.
_Avoid_: Line, pattern, piece

**Exercise library**:
All the exercises saved on this device.
_Avoid_: Collection, playlist

**Folder**:
A named group of exercises in the exercise library, made by the user; one level deep. An exercise is in one folder or in none.
_Avoid_: Category, tag, collection

**Example**:
One of the exercises built into the app to show what it does, listed in the sidebar's Examples tab. Never stored and read-only: its practice settings can be changed to try it but aren't kept, and Copy to Library makes an ordinary exercise from it.
_Avoid_: Demo, template, preset

**Rudiment**:
One of the 40 PAS rudiments, built into the app and listed by PAS number in the sidebar's Rudiments tab in the folding families Rolls, Diddles, Flams and Drags. Read-only like an **Example**, written as the fewest bars that bring it back to its starting hand, with every hand stored as a **Sticking override** and always printed. Its **Lead hand** can be changed to practise it from the left; its sticking mode and pattern can't (ADR 0018). Copy to Library makes an ordinary exercise from it.
_Avoid_: Sticking pattern, lick

**Built-in exercise**:
An **Example** or a **Rudiment**: an exercise that comes with the app, read-only and never stored, with Copy to Library to make one's own.
_Avoid_: Preset, template

**Bar**:
One measure within an exercise.
_Avoid_: Measure

**Note**:
A single hit at a rhythmic position within a bar. A tied continuation is not a separate note: it extends the earlier note and is not struck.
_Avoid_: Hit, stroke, event

**Loop range**:
The span of bars within an exercise that repeats during practice; the whole exercise by default.

**Practice settings**:
How an exercise is practiced rather than what it contains: BPM, loop range, pattern, bass drum, hi-hat foot and swing amount. Remembered per exercise.

**Clean run**:
A tempo an exercise was played cleanly at, and the day: logged with "Played it clean" by the tempo, kept one a day at each BPM, and removable. The sidebar's lists show ✓ and the best one beside an exercise. A stored exercise keeps its own, which go with it on export and start afresh on a copy; a **Built-in exercise**'s are kept on the device beside it (ADR 0019).

**Device settings**:
How the app is set up on this computer rather than how an exercise is practiced: volumes and mutes (the Mix), the count-in toggle, the theme and mode, the notation's fit, the beat count and the version of the line it shows (as written or as played), which exercise was last open, which sidebar tab is showing (Library, Rudiments or Examples, by icon), which folders are collapsed and which rudiment families open, whether the grid editor is collapsed, which screen is showing, and the metronome's settings. Kept per device and never exported.

**Mix**:
How loud each playback layer (click, exercise, groove) plays on this device, and which are muted, set in the Mix panel the desktop header's speaker opens on the Practice screen (on the Metronome screen the same speaker opens the metronome's sound and volume; on a phone, the settings' Mix tab). A muted layer plays nothing, so the drummer can practise against any combination; a muted click still plays the count-in. The click's mute is also in the Practice screen's transport.
_Avoid_: Volume (for the section)

**Theme**:
The app's visual style, chosen in Appearance: Warm (the default) or Studio. A theme changes colours, fonts, corners, borders, shadows and a few ornaments, never the layout (ADR 0013). Both come in light and dark. In code it is the `look` (ADR 0013's word), and the code's `theme` is the mode.
_Avoid_: Look (in the app's text), skin

**Mode**:
Whether the app draws light or dark: Auto (follows the device), Light or Dark. In code it is the `theme` device setting.
_Avoid_: Theme (for the mode)

**Snare row**:
One of an exercise's two rhythms over the same bars: the notes played on the snare with the hands, written in the hands part. Sticking gives this row's notes their hands; a kick row note gets K only where no hand plays with it.
_Avoid_: Voice, lane, track

**Kick row**:
The exercise's other rhythm: the notes played on the bass drum with the feet, written in the feet part. A beat's grid (sixteenths or triplets) is shared by both rows.
_Avoid_: Voice, lane, track

### Practice

**Notation view**:
The standard drum-staff rendering of an exercise and its groove layer, with sticking below; what the user reads from while practicing.
_Avoid_: Score, sheet

**As written**:
An exercise's line alone, as it was entered: straight, on the snare and kick rows, with no groove layer and no feet. When the exercise is played differently (swing, a pattern, the bass drum or the hi-hat foot is on), a Written | Played switch lets the notation view show it (ADR 0016).

**As played**:
An exercise as the drummer hears it: swung onto the triplet grid, with the groove layer and the feet. The notation view shows it unless As written is chosen; when nothing changes the line in playback, the two are the same.

**Hands part**:
Everything on the staff played with the hands (snare, ride, hi-hat), written stems up as one rhythm: hits that land together share a stem, and a rest appears only where no hand plays. In a bar where the feet only play with the hands, or never do (a linear fill such as `RLKK`), the feet's notes hang on its stems too (one voice).
_Avoid_: Upper voice

**Feet part**:
Everything on the staff played with the feet (bass drum, hi-hat foot), written stems down below the hands part with its own rests, in a bar where a foot plays without the hands. Otherwise the feet join the hands part.
_Avoid_: Lower voice

**Playhead**:
The line across the staff during playback that marks the position of the latest hit, from any instrument.

**Grid editor**:
Where the user enters and edits an exercise one beat at a time, by turning grid positions on and off and dragging a note's hold; the notation view mirrors it. Entry is the grid only (ADR 0009). The app decides the spelling (notes, rests, dots, ties).
_Avoid_: Sequencer, piano roll

**Beat figure**:
One of the 22 one-beat rhythms the speller knows (e.g. two eighths, or a triplet with the middle note left out), defined only by where its hits fall on a sixteenth or triplet grid; each note holds until the next hit or the end of the beat. Internal to the app since ADR 0009: the drummer never picks one, but a beat whose hits match one is written with its default holds.
_Avoid_: Cell, pattern

**Hold**:
How long a note is written to last, in grid positions: by default until the next hit or the end of the beat, or set by dragging, from one grid position up to the next hit, tied on across beats; over a barline only by the bar's first beat's "Tie over the barline". It changes how the note is written, not how it sounds.
_Avoid_: Length, sustain

**Note mark**:
Something a struck snare note carries besides its rhythm, drawn on the staff and shown in small print on its grid position in the grid editor: a dynamic (an **Accent** or a **Ghost note**), a **Grace note** or a **Roll stroke** (ADR 0017). A tied continuation carries none, and neither does a kick.
_Avoid_: Articulation, ornament

**Accent**:
A note mark: the note is played from the snare's accent band, louder than the normal notes around it, and drawn `>` just above its stem, level across a beam group. A note is accented or a ghost note, never both: each replaces the other.
_Avoid_: Emphasis, stress

**Ghost note**:
A note mark: the snare note's soft dynamic, the other of the **Accent**. It's played from the snare's ghost band, softer than the normal notes and than a grace note, and drawn with parentheses round its notehead (only the snare's, in a chord). It sets the level of every stroke the note plays, a double's second stroke and a buzz too; its grace notes keep the grace level.
_Avoid_: Soft note, dead note

**Grace note**:
A note mark: a **Flam** (one grace note) or a **Drag** (two), each replacing the other. They are played soft from the snare's grace band a short fixed time ahead of the note, by the other hand, and drawn small just before it: a flam's slashed, a drag's two beamed with no slur. The sticking prints their hands small and in lower case before the note's (`lR`, `llR`).
_Avoid_: Ornament, ruff

**Roll stroke**:
A note mark: a **Double** or a **Buzz**, each replacing the other, played by the note's own hand. A double is two strokes, the second halfway through the note's time (its tied continuations too), at the normal level (the ghost level on a ghost note); it's drawn as one thin slash across the stem. A buzz is one stroke from the snare's buzz strokes, drawn as a Z across the stem. Both sit on the stem between its top notehead and its beam or flag.
_Avoid_: Tremolo

**Tool palette**:
The row of tools over the beat cards (at the top of the editor sheet on a phone): Hit, and a tool per note mark. One is held at a time, Hit at first. With Hit held the grid works as always; with a mark held, tapping a snare grid position toggles that mark on its note, adding the hit if the position is empty. Disabled on an example.
_Avoid_: Toolbar, mode switch

**Grid position**:
One place a hit can fall within a beat: one of its four sixteenths, or one of its three triplet eighths when the beat is on the triplet grid. Each beat is on one grid or the other; only the downbeat is on both.
_Avoid_: Cell, step, slot

**Click**:
The exercise's metronome sound: every beat of the bar, with beat 1 accented. The Metronome screen has its own clicks.
_Avoid_: Beep, tick

**Count-in**:
One bar of click, in the exercise's time signature, played before an exercise starts.

**Beat count**:
The large count of the bar's beats (1 2 3 4 in 4/4) in the notation view's top-right corner while an exercise plays: the beat being heard is enlarged, beat 1 is in the accent colour, and **count-in** shows beside it during the count-in. On unless switched off in Appearance, on this device.

### Metronome

**Screen**:
What the app shows: **Practice** (the exercise, its notation and editor) or **Metronome**, switched in the header (ADR 0014). The screen last shown is remembered.
_Avoid_: Mode (that is light or dark)

**Metronome**:
The screen that plays a click on its own, with its own BPM, time signature, subdivision, beat levels and sound, remembered on the device. Not part of any exercise.

**Time signature**:
An exercise's beats per bar, written at the start of its staff: 4/4, 3/4, 2/4, 6/8 or 12/8, and 4/4 for a new exercise. It is part of the exercise, not a practice setting: changing it cuts each bar to its first beats or pads it with rest beats, and can be undone. The metronome has its own, any of 1–16 over 2, 4, 8 or 16, its BPM counting that note value.

**Compound time**:
6/8 and 12/8: two or four beats to the bar, each a dotted quarter of three eighths. The BPM, the click and the beat count follow the dotted quarter. Each beat's eighths are the triplet grid's positions, written without the "3", and nothing is swung (ADR 0015).
_Avoid_: Triple time

**Beat level**:
How a metronome beat plays: Accent, Normal, Soft or Off, set by tapping its beat block. Accent is the loudest, high click; Normal is the same high click, quieter, a lighter accent; Soft is exactly a subdivision click. A changed time signature resets them to beat 1 Accent and the rest Soft.
_Avoid_: Volume (for a single beat)

**Subdivision**:
The rhythm clicked inside each beat, with the same low click as a Soft beat: quarters (none), eighths, an off-beat eighth, dotted eighth and sixteenth, triplets, or a triplet or sixteenth grouping with rests. Picked from small notation pictures.

### Sticking

**Sticking**:
The hand (R or L) assigned to each note of the snare row, with K under each kick that no hand plays with. It belongs to the exercise as printed, not to a playback pass: every loop repeat, and any loop range, plays the printed hands.

**Sticking off**:
A sticking mode in which no hands are shown, for lines where the other hand is busy with the groove (e.g. right hand on the ride, left hand comping).

**Alternate sticking**:
Sticking that strictly alternates hands over the notes actually played, ignoring rests and tied continuations, and carrying on across bar lines.

**Natural sticking**:
Sticking where each hand is bound to a grid position, so the hands keep moving through rests. The grid is chosen per beat (the finest subdivision used in that beat). Straight beats (eighths, sixteenths) always start on the lead hand; a run of back-to-back triplet beats alternates continuously, starting on the lead hand.
_Avoid_: Hand-to-hand

**Lead hand**:
The hand that plays the first grid position under natural sticking, or the first note under alternate sticking; R by default. Lead hand L mirrors every hand, the sticking overrides too, so an exercise can be practised leading with either hand.

**Sticking pattern**:
A short run of R, L, K (kick) and `.` (rest), such as `RLRK`, laid on a grid (sixteenths or triplets) and repeated through a bar or an exercise by a **pattern fill**, which writes the typed hands as the sticking. In the sticking line under the staff, a kick that isn't played with a hand shows K.
_Avoid_: Permutation, rudiment

**Kicks in the gaps**:
Turning every grid position where neither row strikes into a kick, on the grid each beat is already on: a GRID line such as `RLRL RL.L` becomes `RLRL RLKL`.

**Sticking override**:
A hand the user has set manually on one note, replacing the computed sticking; always the hand opposite the one computed when it was set. It is stored as for a right lead, and with **Lead hand** L it is shown and played mirrored (ADR 0018). Hidden but kept when sticking is off. Only the snare row's notes carry one.

### Groove

**Groove layer**:
Extra drum-set instruments (e.g. jazz ride pattern and hi-hat on 2 & 4) written on the same staff as an exercise's notes, in the hands part or the feet part, and played back with it.
_Avoid_: Overlay, accompaniment, backing

**Pattern**:
The part of the groove layer played on the hands, the same in every bar, picked by name from a list grouped by style (Jazz, Rock & pop…) that shows only the patterns fitting the time signature: **Ride** (the jazz ride) and **Hi-hat 8ths**, or none. A pattern has no feet of its own. Picking Ride on a straight exercise also sets Triplet swing, and the hi-hat foot to 2 & 4 if it was off (in 4/4); the picker says so, with an Undo.
_Avoid_: Groove preset (its old name, which also held the feet)

**Bass drum**:
A practice setting under the Groove group's **Feet**: off, or **feathered**, played softly on every beat (each dotted quarter in compound time), with any pattern or none. The kick row's notes are the exercise's own bass drum; this is the groove's.
_Avoid_: Kick (the kick row)

**Hi-hat foot**:
A practice setting under the Groove group's **Feet** that plays the hi-hat pedal in every bar (on 1, on the beats, 2 & 4 or the &s), with any pattern or none (ADR 0010). Only what fits the meter is offered: 2 & 4 only in 4/4, and 1 or the beats in compound time. Under a pattern it is written as part of the groove; with none, as an ostinato under the line (ADR 0012).
_Avoid_: Hi-hat row, chick

**Swing feel**:
Playback where off-beat eighths are delayed into a long-short (triplet-like) feel; the opposite is straight feel.
_Avoid_: Shuffle

**Swing amount**:
How long the first eighth of each beat is, as a share of the beat: 50% is straight (where a new exercise starts), 66.7% is triplet swing (set when Ride is picked on a straight exercise). It is the amount at slow and medium tempos; playback eases it toward straight as the tempo rises. Notated triplets are never swung. It is picked from three presets, **Straight** (50%), **Triplet** (66.7%) and **Dotted** (75%), or as a **Custom** amount anywhere from 50% to 75%; an amount that isn't one of the three is a custom one.
