# FFXIV Pull Review

A React/TypeScript portfolio project for reviewing the individual player whose POV appears in a raid recording.

Start with the [project brief](docs/project-brief.md). Implementation proceeds one GitHub issue at a time, with explanations and small changes suitable for refreshing React knowledge.

The [development journal](docs/development-journal.md) records decisions, learning, and how AI contributed.

## Local persistence

Saved context and feedback are stored in this browser's localStorage under `ffxiv-pull-review`. Open form drafts and filter choices are not saved. After refreshing, select the recording again; its name, size, and last-modified time are compared to the saved identity. A mismatch requires an explicit choice before reconnecting playback.

Restored notes remain readable and filterable, but adding, editing, removal, and seeking are disabled until a recording is connected and ready.

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
