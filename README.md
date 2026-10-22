# FFXIV Pull Review

A React/TypeScript portfolio project for reviewing the individual player whose POV appears in a raid recording.

Start with the [project brief](docs/project-brief.md). Implementation proceeds one GitHub issue at a time, with explanations and small changes suitable for refreshing React knowledge.

The [development journal](docs/development-journal.md) records decisions, learning, and how AI contributed.

## Local persistence

Start with encounter, POV player, job, optional pull notes, and a playable video. Start review opens playback/feedback beneath a compact context header in the same panel. Edit context supports Save/Cancel without discarding notes or the connected recording.

Saved context and feedback are stored in this browser's localStorage under `ffxiv-pull-review`. Open form drafts and filter choices are not saved. After refreshing, select the recording again; its name, size, and last-modified time are compared to the saved identity. A mismatch requires an explicit choice before reconnecting playback.

Restored notes remain readable and filterable, but adding, editing, removal, and seeking are disabled until a recording is connected and ready.

The current saved format is version 2. Version-1 reviews migrate automatically: the former Review Title field is removed while the remaining context, recording metadata, and feedback are preserved.

## Demo recording

Choose **Try demo recording** to explore the hosted M9S video without a local file. It loads only after opting in, with metadata preloading and no autoplay. The demo features Moharu Nn (Sage) in Vamp Fatale - M9S, with two feedback notes supplied by the recording’s owner at 1:07 and 5:06. Demo changes are temporary and never written over your saved review. **Reset demo** restores the starter notes; **Return to my review** restores your local session, including its selected video and unfinished inputs.

The public source URL and starter notes live in `src/demo.ts`. The video is hosted on Vercel Blob; no Blob token or upload SDK is needed in the frontend. If hosting fails, retry or return to local review. Hobby transfer caps can temporarily make the public video unavailable.

Data belongs to this browser and site address; localhost and production have separate storage. Clearing site data removes the saved review. Storage failures show a message while preserving the in-memory session. Invalid or unsupported saved data is left untouched until you confirm replacing it with the current working review. Video bytes and temporary playback URLs are never stored.

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

Build runs TypeScript checks and creates the production bundle. GitHub Actions runs these same checks. Vercel deployment is a later project task.

Tests use Vitest, React Testing Library, user-event, and jsdom. Run `npm run test:watch` for feedback while editing. See the [testing guide](docs/testing-guide.md) for the first test and the remaining exercises.

## Working agreement

- Implement one issue at a time; explain the React concepts introduced.
- Prefer native HTML, plain CSS, and built-in React features before dependencies.
- Keep supplied footage out of Git. Video selection is local; no upload is involved.
- Each issue should leave a small, reviewable result and a short manual verification path.
- At each issue completion, suggest a brief development-journal update covering decisions, developer input, learning, and verification.
