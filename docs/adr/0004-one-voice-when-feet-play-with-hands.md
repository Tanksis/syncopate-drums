# 4. Notation: one voice when the feet only play with the hands

Date: 2026-10-07

Status: accepted (refines [ADR 0002](0002-hands-up-feet-down.md))

After ADR 0002 shipped, the jazz groove's hi-hat foot on 2 and 4 was drawn as its own stems-down voice of flagged eighths under the ride. The user compared it with Groove Scribe and asked for proper drum notation. What the references say:

- Weinberg's PAS *Guidelines for Drumset Notation* (Percussive Notes, June 1994) recommends one or two voices, "depending on the musical context and the voicing that will provide the clearest intentions". Beats (an ostinato under a freer figure) are best in two voices, fills in one. Don't change between one and two voices within a bar, but changing between bars is fine. In two voices the upper part's stems go up and the lower part's go down, and each voice has its rests (a rest common to both may be written once). The hi-hat foot sits on the first space below the staff.
- Groove Scribe always writes the whole kit as one voice, stems up (`kickStemsUp = true` in `groove_writer.js`).
- Engravers who default to one voice note that it saves the feet part's rests and shows how the limbs line up. Two voices pay off when the feet play a rhythm of their own.

So each bar picks its voicing:

- **One voice** when the feet play in the bar and every foot hit lands with a hand hit (the jazz hi-hat foot on 2 and 4, a feathered bass drum on the beat, a kick on the hi-hat's eighths). The feet's noteheads join the hands' chords, stems up, and there is no feet part in that bar.
- **Two voices** otherwise: hands stems up, feet stems down, as ADR 0002 says. Each voice rests where it is silent if it has a note in the bar or holds the exercise. A groove note holds until its part's next note or the end of its beat. It no longer stops at another limb's next hit, which drew the hi-hat foot as an eighth.

## Consequences

- A bass drum exercise can be written in one voice in some bars and two in others. Within a bar the voicing never changes.
- The exercise's notes keep their ids wherever they are written, so sticking, overrides, the cursor highlight and clicks follow them into the hands voice.
