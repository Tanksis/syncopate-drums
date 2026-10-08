# 8. Examples are built in and read-only

Date: 2026-10-08

Status: proposed (reverses "examples are ordinary exercises" in the [first-run-examples spec](../../.scratch/first-run-examples/spec.md))

Ticket 02 of first-run-examples stored the four example exercises in the library at a device's first launch, as ordinary exercises. The user found that they crowd the one exercise list. They can also be deleted for good, which needed an `examplesAdded` flag and an "Add examples" button to bring them back. The user asked for the examples in their own tab, and chose to make them built in and read-only rather than ordinary exercises filed in a tab.

So the examples are part of the app, not the library:

- They're never stored. Each has a fixed id the app recognises, so the last-open exercise can be an example.
- Their notes, sticking and name can't be edited. Practice settings (BPM, loop, groove, swing) can be changed to try an example, but the changes aren't kept.
- **Copy to Library** (and Duplicate) makes an ordinary exercise from one, which is then the drummer's own.

## Consequences

- The `examplesAdded` device setting and the launch rule that added the examples go. First-run-examples ticket 03 (the Add examples button) is dropped.
- Examples stored by ticket 02's build are deleted at launch if they are still exactly as added, since the built-in ones replace them. One the drummer changed is theirs and stays.
- Changing an example in a later version of the app changes it for everyone, with no migration, because nothing about it is stored.
- The editor needs a read-only state, and every edit command is either allowed for an example or refused.
