# FFXIV Pull Review

A React/TypeScript portfolio project for reviewing the individual player whose POV appears in a raid recording.

Start with the [project brief](docs/project-brief.md). Implementation proceeds one GitHub issue at a time, with explanations and small changes suitable for refreshing React knowledge.

The [development journal](docs/development-journal.md) records decisions, learning, and how AI contributed.

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
