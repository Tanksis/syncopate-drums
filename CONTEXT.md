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

**Bar**:
One measure within an exercise.
_Avoid_: Measure

**Note**:
A single hit at a rhythmic position within a bar. A tied continuation is not a separate note: it extends the earlier note and is not struck.
_Avoid_: Hit, stroke, event

**Loop range**:
The span of bars within an exercise that repeats during practice; the whole exercise by default.

**Practice settings**:
How an exercise is practiced rather than what it contains: BPM, loop range, groove preset, swing amount and hi-hat foot. Remembered per exercise.

**Device settings**:
How the app is set up on this computer rather than how an exercise is practiced: volumes and mutes (the Mix), the count-in toggle, the theme and mode, which exercise was last open, which sidebar tab is showing, which folders are collapsed, whether the grid editor is collapsed, which screen is showing, and the metronome's settings. Kept per device and never exported.

**Mix**:
How loud each playback layer (click, exercise, groove) plays on this device, and which are muted, set in the Mix section of Settings. A muted layer plays nothing, so the drummer can practise against any combination.
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

**Grid position**:
One place a hit can fall within a beat: one of its four sixteenths, or one of its three triplet eighths when the beat is on the triplet grid. Each beat is on one grid or the other; only the downbeat is on both.
_Avoid_: Cell, step, slot

**Click**:
The exercise's metronome sound: every quarter note, with beat 1 accented. The Metronome screen has its own clicks.
_Avoid_: Beep, tick

**Count-in**:
One bar of click played before an exercise starts.

### Metronome

**Screen**:
What the app shows: **Practice** (the exercise, its notation and editor) or **Metronome**, switched in the header (ADR 0014). The screen last shown is remembered.
_Avoid_: Mode (that is light or dark)

**Metronome**:
The screen that plays a click on its own, with its own BPM, time signature, subdivision, beat levels and sound, remembered on the device. Not part of any exercise.

**Time signature**:
The metronome's beats per bar over the note value that gets the beat: 1–16 over 2, 4, 8 or 16. The BPM counts that note value. Exercises are always 4/4.

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
The hand that plays the first grid position under natural sticking, or the first note under alternate sticking; R by default.

**Sticking pattern**:
A short run of R, L, K (kick) and `.` (rest), such as `RLRK`, laid on a grid (sixteenths or triplets) and repeated through a bar or an exercise by a **pattern fill**, which writes the typed hands as the sticking. In the sticking line under the staff, a kick that isn't played with a hand shows K.
_Avoid_: Permutation, rudiment

**Kicks in the gaps**:
Turning every grid position where neither row strikes into a kick, on the grid each beat is already on: a GRID line such as `RLRL RL.L` becomes `RLRL RLKL`.

**Sticking override**:
A hand the user has set manually on one note, replacing the computed sticking; always the hand opposite the one computed when it was set. Hidden but kept when sticking is off. Only the snare row's notes carry one.

### Groove

**Groove layer**:
Extra drum-set instruments (e.g. jazz ride pattern and hi-hat on 2 & 4) written on the same staff as an exercise's notes, in the hands part or the feet part, and played back with it.
_Avoid_: Overlay, accompaniment, backing

**Groove preset**:
A named, predefined groove layer the user picks from (e.g. "Jazz ride + hi-hat 2 & 4").

**Hi-hat foot**:
A practice setting that plays the hi-hat pedal as an ostinato in every bar (on 1, quarters, 2 & 4 or off-beats, the &s), alongside any groove preset and replacing the preset's own hi-hat foot (ADR 0010).
_Avoid_: Hi-hat row, chick

**Swing feel**:
Playback where off-beat eighths are delayed into a long-short (triplet-like) feel; the opposite is straight feel.
_Avoid_: Shuffle

**Swing amount**:
How long the first eighth of each beat is, as a share of the beat: 50% is straight (where a new exercise starts), 66.7% is triplet swing (set when a jazz groove is picked on a straight exercise). It is the amount at slow and medium tempos; playback eases it toward straight as the tempo rises. Notated triplets are never swung.
