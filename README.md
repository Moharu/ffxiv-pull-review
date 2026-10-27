# FFXIV Pull Review

Review an FFXIV raid recording from one player's point of view and leave actionable feedback at specific moments. Built with React, TypeScript, and Vite as a scoped portfolio project while refreshing React hooks.

**[Open the live app](https://ffxiv-pull-review.vercel.app/)** and choose **Try demo recording** to explore without supplying footage.

## Learning through AI-assisted development

This was my first frontend project developed with AI assistance. As an experienced developer returning after a break, I used it to refresh React and explore how an AI coding collaborator could support both implementation and learning.

I worked with Codex one GitHub issue at a time, asking for small steps and explanations before moving on. Early work included writing controlled inputs and tests myself, getting feedback, and asking questions about typed state, immutable updates, effects, refs, and accessible queries. As the project progressed, I delegated more implementation, styling, refactoring, and test coverage while continuing to make product decisions and test the resulting behaviour.

AI contributed substantial code as well as guidance. My role included defining the use case, challenging proposed features, changing workflows that felt cumbersome, supplying domain knowledge and demo content, and checking the app in the browser and on a real phone. Understanding changes was part of the work: discussions about component boundaries, repeated state resets, timestamp precision, and accessibility led to concrete revisions.

The **[development journal](docs/development-journal.md)** is the companion to the finished app. It records important decision points, my input, AI contributions, concepts discussed, and verification evidence—including changes of direction and checks we did not perform. For example, it traces the move from a separate timestamp-capture flow to Add Feedback locking the playback time, and the replacement of practice priorities with per-entry importance. It is a curated account of the collaboration rather than a complete prompt transcript.

## What you can do

- Set encounter, POV player/job, and pull notes alongside a local recording.
- Watch with custom play/pause, seeking, playback-speed, and local-volume controls; Add Feedback pauses and locks the current timestamp.
- Use importance-colored timeline bookmarks to reveal and focus feedback notes, including notes hidden by the category filter.
- Save observations and suggested improvements with a category and importance from 1–5.
- Seek from notes, edit entries inline, confirm deletion, and filter by category.
- Restore your saved review after refreshing and reconnect the recording through metadata matching.

There are no accounts, backend, user-video uploads, or AI-generated feedback. One local review is saved per browser/site; the hosted demo is a separate temporary session.

## Reviewing your own recording

Start with encounter, POV player, job, optional pull notes, and a playable video. Start review opens playback/feedback beneath a compact context header in the same panel. Edit context supports Save/Cancel without discarding notes or the connected recording.

Saved context and feedback are stored in this browser's localStorage under `ffxiv-pull-review`. Open form drafts and filter choices are not saved. After refreshing, select the recording again; its name, size, and last-modified time are compared to the saved identity. A mismatch requires an explicit choice before reconnecting playback.

Restored notes remain readable and filterable, but adding, editing, removal, and seeking are disabled until a recording is connected and ready.

The current saved format is version 2. Version-1 reviews migrate automatically: the former Review Title field is removed while the remaining context, recording metadata, and feedback are preserved.

## Demo recording

Choose **Try demo recording** to explore the hosted M9S video without a local file. It loads only after opting in, with metadata preloading and no autoplay. Demo audio is muted and volume changes are reset to zero; local recordings retain their normal audio controls. The custom demo volume button is disabled; desktop local recordings have mute/unmute and an inline volume slider revealed on hover or keyboard focus. The demo features Moharu Nn (Sage) in Vamp Fatale - M9S, with two feedback notes supplied by the recording’s owner at 1:07 and 5:06. Demo changes are temporary and never written over your saved review. **Reset demo** restores the starter notes; **Return to my review** restores your local session, including its selected video and unfinished inputs.

The public source URL and starter notes live in `src/demo.ts`. The video is hosted on Vercel Blob; no Blob token or upload SDK is needed in the frontend. If hosting fails, retry or return to local review. The demo depends on the availability of its public host.

## Storage and limitations

Data belongs to this browser and site address; localhost and production have separate storage. Clearing site data removes the saved review. Storage failures show a message while preserving the in-memory session. Invalid or unsupported saved data is left untouched until you confirm replacing it with the current working review. Video bytes and temporary playback URLs are never stored. Metadata matching is a convenience check, not proof that two files have identical contents.

The current dark workspace uses Tailwind CSS. On tablet and desktop windows at least 768px wide and 600px tall, a compact context header sits above a video/notes split (roughly 70/30 on wide screens and 60/40 on tablets). Feedback scrolls independently while the whole video stays visible. Narrower workspaces present feedback as cards; short windows fall back to normal page flow so controls remain reachable. The redesigned layout has browser-emulation checks; the earlier real-phone results apply to the original MVP styling. There is no review library, export/import, or sharing yet.

## Development

Use Node.js 24 LTS and npm. After setup:

```sh
npm ci
npm run dev
```

Before submitting a change:

```sh
npm run lint
npm test
npm run build
```

Build runs TypeScript checks and creates the production bundle. GitHub Actions runs these same checks. The live app is deployed on Vercel.

Tests use Vitest, React Testing Library, user-event, and jsdom. Run `npm run test:watch` for feedback while editing. See the [testing guide](docs/testing-guide.md) for the first test and the remaining exercises.

## Architecture and decisions

`App` owns the persisted review and coordinates setup, readiness, and the isolated demo. `VideoReview` owns the selected file, media element reference, playback readiness, recording-replacement flow, category filter, and bookmark selection. `VideoPlayer` synchronizes its custom controls with media events; `FeedbackTimeline` positions and groups feedback bookmarks. `FeedbackList`, `FeedbackItem`, and `FeedbackForm` handle filtering and table interactions. Shared types and utility functions centralize categories, importance, timestamp handling, validation, recording identity, and storage.

Controlled inputs keep drafts separate from saved data. Functional state updates preserve unrelated fields. Refs access the native video element; effects synchronize localStorage and clean up temporary object URLs. Filtered/sorted entries are derived during rendering. Native HTML supplies controls and semantics. Tailwind CSS 4 is integrated through its Vite plugin; shared component styles use `@apply`, with CSS media queries for the bounded playback workspace.

## Verification

The latest post-MVP implementation checkpoint passed 116 tests, lint, and the production build. Tests cover timestamp and feedback validation, edits/deletion, persistence migration/recovery, recording matching, and demo isolation. jsdom media stubs test event handling; real playback was checked separately in Chromium against the deployed demo.

For the original MVP, deployed setup/demo/edit states passed axe scans at 375, 768, and 1440 pixels. The developer reported successful real-phone use and browser zoom checks at 200% and 400%, with visible keyboard focus and no clipping or page-wide horizontal scrolling. Screen-reader testing was not performed. These checks cover selected flows and do not establish complete accessibility conformance. See the [verification report](docs/accessibility-check.md) for evidence and limits.

## Project process

The [project brief](docs/project-brief.md) records scope and the issue sequence. The [development journal](docs/development-journal.md) follows the implementation and learning behind those issues, documenting how developer decisions and AI assistance shaped the result.

## Post-MVP milestones

The **visual redesign** is complete locally: a dark Tailwind workspace with a compact context header and side-by-side video/feedback. Local checks are complete; post-push CI and deployed verification remain to be confirmed.

Custom playback controls and feedback timeline bookmarks are implemented locally as a prerequisite. Hover or focus a solid importance-colored bookmark to expand its importance/category inside one continuous balloon. Every bookmark opens a preview with labelled Observation and Suggestion; selecting a preview card reveals and focuses the note without seeking. Overlapping badges share a panel so every note remains selectable. The progress slider handles seeking.

Next is **Focused Mode**: viewport-filling video and overlay feedback controls, reusing this player and timeline. Focused Mode itself is planned, not implemented. See [milestones and scope](docs/milestones.md) for details and open decisions.

## Working agreement

- Implement one issue at a time; explain the React concepts introduced.
- Prefer native HTML and built-in React features; use Tailwind CSS for the visual system.
- Keep supplied footage out of Git. Video selection is local; no upload is involved.
- Each issue should leave a small, reviewable result and a short manual verification path.
- At each issue completion, suggest a brief development-journal update covering decisions, developer input, learning, and verification.
