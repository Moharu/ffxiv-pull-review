# Project brief

## Outcome

Help a player watch a seven-minute FFXIV raid recording, capture actionable feedback about the POV player, and identify the most important improvements for their next pulls. This is a manual review tool, not a combat-log analyser or automated coach.

The portfolio should demonstrate typed React state, accessible forms, media interaction, local persistence, and a complete delivery workflow. Work in small increments that refresh hooks through practical use.

## MVP boundaries

- One active recording/review. Context: review title, encounter, POV player name, job, and optional pull notes.
- Select a browser-playable local video through a file input and play it with native video controls. Do not upload or commit footage. The user must select the file again after reload; explain this in the interface.
- Add Feedback pauses the player and opens a new-entry row with its current whole-second timestamp locked. Playback can resume without changing the draft's time. Save adds the entry and closes the draft; Cancel discards it. Saved timestamps can be corrected within the loaded video's duration through inline editing. Selecting a feedback timestamp seeks the video.
- Each feedback entry has an ID, timestamp, importance (1–5), category, observation, and suggested improvement.
- Initial categories: Mechanics, Positioning, Rotation, Mitigation, and Other. These are an initial product choice, not a complete assessment rubric.
- Create, edit, and delete feedback; confirm deletion or provide undo. Sort by timestamp, with a stable order for ties.
- Filter feedback by category.
- Each feedback entry has Importance from 1 (Low) to 5 (Critical), defaulting to 3 (Moderate). Show it between Timestamp and Category as a numbered, labelled badge colored green through yellow to red. Creation and editing use the same scale; color is not the only cue. Broader goals can be written in pull notes; there is no separate practice-priority feature.
- Persist context and feedback (including importance) in versioned localStorage. Never persist video bytes or an object URL. Handle invalid data and failed writes visibly without breaking the session.
- Work on narrow and wide screens with semantic controls, labels, visible focus, keyboard operation, and understandable validation.

No backend, accounts, video uploads, AI features, multiple-review library, sharing, custom timeline, rich-text editor, or category management. Export/import and automated feedback are future ideas.

## Main user flow

1. Enter recording context and select the supplied video.
2. Watch and choose Add Feedback at a relevant moment; the player pauses and the draft locks that timestamp.
3. Record an observation and a concrete suggested improvement for the POV player, then Save or Cancel. Playback may resume while drafting.
4. Revisit timestamps, edit notes, and filter categories.
5. Use importance badges to identify the most important feedback; add broader goals to pull notes if useful.
6. Reload: review data returns, and the interface asks the user to reselect the recording.

## Two-week sequence

Treat these as working sessions, with room to adjust to available time.

| Days | Deliverable | React learning focus |
| --- | --- | --- |
| 1–2 | Vite setup, checks, and recording context | Components, props, controlled inputs, useState |
| 3–4 | Local video and timestamp capture | useRef; effect cleanup for object URLs |
| 5–7 | Feedback creation, timestamp seeking, editing and deletion | Typed state, immutable updates, stable keys, lifting state |
| 8–9 | Category filter and feedback importance | Derived values; avoiding redundant state |
| 10–11 | Persistence and recovery | Lazy state initialisation, useEffect for external storage |
| 12–14 | Accessibility, responsive review, deployment and portfolio write-up | End-to-end behaviour and tradeoffs |

Avoid effects for calculations or event-driven state changes. Introduce hooks only when the current issue needs them.

## Definition of done

A reviewer can complete the main flow with the supplied recording, including keyboard-only operation. Data survives reload, deletion and edits persist, category filtering does not lose entries, and feedback importance remains editable. Missing video, empty feedback, invalid timestamps, and storage failures have clear states. Lint and production build pass in GitHub Actions. A Vercel demo and README describe the problem, local-file limitations, architecture decisions, and verification.

Use a small number of behavioural tests for feedback changes, timestamp validation and persistence recovery when those features arrive. Include manual keyboard, responsive and actual-video checks; setup alone does not need component tests.

## GitHub backlog

1. [Set up React, TypeScript, Vite and CI](https://github.com/Moharu/ffxiv-pull-review/issues/1)
2. [Capture recording context](https://github.com/Moharu/ffxiv-pull-review/issues/2)
3. [Play a local recording and capture timestamps](https://github.com/Moharu/ffxiv-pull-review/issues/3)
4. [Add timestamped feedback and seek to moments](https://github.com/Moharu/ffxiv-pull-review/issues/4)
5. [Edit and delete feedback](https://github.com/Moharu/ffxiv-pull-review/issues/5)
6. [Filter feedback and set importance](https://github.com/Moharu/ffxiv-pull-review/issues/6)
7. [Persist review data and recover safely](https://github.com/Moharu/ffxiv-pull-review/issues/7)
8. [Verify accessibility, deploy and document the portfolio](https://github.com/Moharu/ffxiv-pull-review/issues/8)
