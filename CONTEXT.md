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

**Bar**:
One measure within an exercise.
_Avoid_: Measure

**Note**:
A single hit at a rhythmic position within a bar. A tied continuation is not a separate note: it extends the earlier note and is not struck.
_Avoid_: Hit, stroke, event

**Loop range**:
The span of bars within an exercise that repeats during practice; the whole exercise by default.

**Practice settings**:
How an exercise is practiced rather than what it contains: BPM, loop range, groove preset and swing amount. Remembered per exercise.

**Device settings**:
How the app is set up on this computer rather than how an exercise is practiced: volumes, the exercise mute, the count-in toggle, vim keys and which exercise was last open. Kept per device and never exported.

**Voice**:
The drum an exercise's notes are played on (snare by default, or bass drum).

### Practice

**Notation view**:
The standard drum-staff rendering of an exercise, with sticking below and the groove layer above; what the user reads from while practicing.
_Avoid_: Score, sheet

**Grid editor**:
Where the user enters and edits an exercise one beat at a time by picking a beat figure for each beat; the notation view mirrors it. The app decides the spelling (notes, rests, dots, ties).
_Avoid_: Sequencer, piano roll

**Beat figure**:
A one-beat rhythm picked from the grid editor's palette (e.g. two eighths, or a triplet with the middle note left out), defined only by where its hits fall on a sixteenth or triplet grid. Each note holds until the next hit or the end of the beat, unless the beat's last note is cut short. It may be tied into from the previous beat. There are 22: every sixteenth-grid pattern plus every triplet pattern a sixteenth grid can't write.
_Avoid_: Cell, pattern

**Click**:
The metronome sound: every quarter note, with beat 1 accented.
_Avoid_: Beep, tick

**Count-in**:
One bar of click played before an exercise starts.

### Sticking

**Sticking**:
The hand (R or L) assigned to each note of an exercise. It belongs to the exercise as printed, not to a playback pass: every loop repeat, and any loop range, plays the printed hands.

**Sticking off**:
A sticking mode in which no hands are shown, for lines where the other hand is busy with the groove (e.g. right hand on the ride, left hand comping).

**Alternate sticking**:
Sticking that strictly alternates hands over the notes actually played, ignoring rests and tied continuations, and carrying on across bar lines.

**Natural sticking**:
Sticking where each hand is bound to a grid position, so the hands keep moving through rests. The grid is chosen per beat (the finest subdivision used in that beat). Straight beats (eighths, sixteenths) always start on the lead hand; a run of back-to-back triplet beats alternates continuously, starting on the lead hand.
_Avoid_: Hand-to-hand

**Lead hand**:
The hand that plays the first grid position under natural sticking, or the first note under alternate sticking; R by default.

**Sticking override**:
A hand the user has set manually on one note, replacing the computed sticking; always the hand opposite the one computed when it was set. Hidden but kept when sticking is off or the voice is bass drum.

### Groove

**Groove layer**:
Extra drum-set voices (e.g. jazz ride pattern and hi-hat on 2 & 4) shown on the same staff above an exercise's notes, and played back with it.
_Avoid_: Overlay, accompaniment, backing

**Groove preset**:
A named, predefined groove layer the user picks from (e.g. "Jazz ride + hi-hat 2 & 4").

**Swing feel**:
Playback where off-beat eighths are delayed into a long-short (triplet-like) feel; the opposite is straight feel.
_Avoid_: Shuffle

**Swing amount**:
How long the first eighth of each beat is, as a share of the beat: 50% is straight, 66.7% (the default) is triplet swing. It is the amount at slow and medium tempos; playback eases it toward straight as the tempo rises. Notated triplets are never swung.
