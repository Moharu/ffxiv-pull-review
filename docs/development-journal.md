# Development journal

A short record of decisions, learning, and collaboration with AI. This is a retrospective of our work so far, not a verbatim transcript. Issue status reflects our conversation; checks distinguish automated results from browser testing.

## Project direction

- **Developer input:** Build a two-week portfolio project while returning to React after a break. Work incrementally and explain changes rather than generating the whole application.
- **Initial decision:** Review the individual player whose POV appears in a supplied raid recording. Originally scoped the MVP to one active review, timestamped feedback, reviewed flags, three practice priorities, and local persistence. The second-pass flag was dropped when starting issue #4 (see below).
- **Boundaries:** No backend, accounts, uploads, or AI functionality in the app. AI assists development; the product remains a manual review tool.
- **Tooling:** React, TypeScript, Vite, npm, GitHub Issues and Actions; Vercel deployment planned for the final phase. Eight scoped issues define the work.
- **Collaboration lesson:** The initial scaffold moved faster than the requested teaching pace. We switched to small exercises, code reviews, and targeted implementation when requested.

## Issue #1 — Project setup (closed)

- **Delivered:** React/TypeScript/Vite foundation, static semantic page, Node 24 configuration, lockfile, lint/build scripts, CI workflow, project brief, and setup walkthrough.
- **Decisions:** Keep plain CSS and native HTML. Retain the Vite template's Oxlint configuration. Begin without hooks until changing data requires them.
- **Learning:** Traced `index.html` → `main.tsx` → `App.tsx`; discussed TSX, StrictMode, and the distinction between build checks and browser behaviour. Discussed optional Conventional Commit prefixes.
- **Workflow:** The local folder initially contained an empty, read-only Git placeholder. Initialized Git and added the GitHub origin using the required workspace permissions. Created initial commit `cf9ffbc`; the developer subsequently pushed it and closed the issue.
- **Evidence:** Local lint and production build passed; the developer ran the dev server and edited the page. Do not infer a CI result solely from local checks.

## Issue #2 — Recording context (closed)

- **Developer work:** Built the title input, extracted `RecordingContextForm`, added encounter/player/job/notes state, and implemented submission, validation, and an in-session saved snapshot through guided steps.
- **Shared components:** Started with fields in `App.tsx`, then extracted the coherent form. After repetition became clear, introduced `TextField` with typed props. Its parent owns state; it receives a value and reports a string through a callback. AI converted the remaining repeated fields on request.
- **Validation/accessibility:** Connected labels and IDs, kept notes optional, used native required validation plus trimmed-value checks, and added explained required-field markers. Errors use an alert; successful saves use a status announcement.
- **Developer decisions:** Requested two-space editor settings, delegated CSS implementation, and supplied the exact order of 21 combat jobs for a native dropdown.
- **Styling choice:** Discussed CSS libraries and chose plain CSS for the current scope. Added a responsive card, consistent controls, visible focus, and error/success styling.
- **Learning:** Controlled inputs, typed props and state, callback props, immutable object replacement, and draft versus saved values. Infer simple string state types; explicitly type nullable objects. Use setters rather than mutating state. Saving currently lasts only for the mounted session.
- **Evidence:** Lint and build passed. The developer reported empty-field submission testing and closed the issue after reviewing its learning criterion. Other suggested browser checks should not be treated as independently verified.
- **Delivery:** Commit `0e4d692` (`feat: add recording context form with validation`) pushed to `origin/main`.

## Issue #3 — Video playback and timestamps (closed)

- **Developer work:** Added the local file picker and initial player, implemented the first URL-cleanup effect, and tested playback. Reported successful timestamp capture and formatting during subsequent iterations.
- **Resource lifecycle:** Initially created an object URL during rendering, then moved setup/cleanup into an effect. An intermediate URL-state approach produced a lint warning about synchronous state updates in effects. Replaced it with a video ref: the effect assigns the source, and cleanup pauses playback, resets the source, and revokes the URL.
- **Learning:** State drives rendered information; refs access DOM elements without triggering renders; effects synchronize with external systems and clean up resources. Metadata and error events are handled directly rather than through additional effects.
- **Developer input on layout:** Constrained video width and height to accommodate differing resolutions without cropping. Moved playback above the context form.
- **Timestamp behaviour:** Capture reads `currentTime`; a separate text draft supports corrections bounded by the loaded duration. Apply validates before changing the numeric timestamp. Removal currently uses browser confirmation and returns focus to Capture.
- **Developer input on time format:** Replaced seconds entry with human-readable time, then chose `m:ss` display with both `1:35` and `01:35` accepted. Seconds remain numeric internally; display formatting is derived without state or an effect.
- **Scope clarification:** This timestamp is a draft, not a permanent single-entry limit. Multiple timestamped feedback entries arrive in issue #4. Pencil-triggered inline editing and inline removal confirmation are planned for feedback entries in issues #4–5; they are not implemented yet.
- **Failure states:** Added a local-file/reselection reminder, an empty state, invalid-duration handling, and playback errors that clear timestamp state and disable capture.
- **Refactoring decisions:** At the developer's request, extracted named event handlers and `clearTimestamp()` instead of introducing a reducer. Extracted a shared `Alert` component for the three error locations, retaining the timestamp error ID and shared CSS. Save status remains separate.
- **Evidence:** Local lint, TypeScript/production build, and whitespace checks passed. The developer reported completing browser checks for recording replacement, unplayable-file recovery, timestamp boundaries, and keyboard capture/edit/apply/removal. Earlier parsing checks covered the previous `mm:ss` parser; the later relaxed minute format passed lint/build. These checks do not constitute a complete accessibility audit.
- **Delivery:** Commit `09983f1` (`feat: add local video playback and timestamp capture`) pushed to `origin/main`. The developer confirmed GitHub Actions was green and closed the issue.

## Issue #4 — Timestamped feedback (in progress)

- **Scope decision (2026-10-21):** The developer questioned whether feedback needs a second-pass reviewed flag. Creating a feedback entry already involves reviewing the footage; we decided to drop the second-pass workflow entirely rather than introduce a toggle without a clear need.
- **Changes:** Removed the flag from the planned entry shape, filtering workflow, persistence requirements, and final verification scope. Updated GitHub issues #4–8 and the project brief; issue #6 now covers category filtering and practice priorities. No existing implementation or stored data requires migration.
- **Entry shape:** Stable ID, numeric timestamp in seconds, category, observation, and suggested improvement. Multiple entries and seeking remain in scope.
- **Developer work:** Defined shared types, built a controlled feedback form with category and required observation/improvement fields, connected the form to parent-owned entries through a callback, rendered a sorted list with stable ID keys, and added timestamp seek buttons.
- **State ownership:** `FeedbackForm` owns draft fields; `VideoReview` owns the resulting entries and video ref. Functional state updates append to a new array. Sorting operates on a copy derived during rendering rather than mutating state or adding an effect.
- **Validation and refactoring:** The developer extracted timestamp parsing and added entry timestamp checks. Review identified that silent rejection would still clear the child form. At the developer's request, AI completed finite/nonnegative/in-duration validation and changed the callback to return an error string or `null` for success. Rejected submissions preserve draft text; parsing now lives outside the component.
- **Type maintenance:** The editor flagged `FormEvent` as deprecated. Checked the installed React declarations: `onSubmit` uses `SubmitEventHandler`, and `FormEvent` recommends event-specific alternatives. Updated both named submit handlers to React's `SubmitEvent<HTMLFormElement>` using type-only imports; runtime behaviour is unchanged.
- **Browser evidence:** The developer reported successful creation of multiple notes; whitespace-only validation for each and both text fields; textarea clearing with category retained; correct counts; sorting earlier/later timestamps; stable insertion order for equal timestamps; and seeking while paused or playing with mouse and keyboard.
- **Verification limits:** Local lint and production build passed during implementation. The newly added parent-rejection/error-preservation path still needs a focused behavioural check; browser results above do not independently verify that path. No automated feedback behaviour tests or complete accessibility audit yet.
- **Delivery:** Issue #4 work is not committed yet. Editing/deletion and inline confirmation remain for issue #5; persistence remains for issue #7.

## Issue #5 — Refactor, then edit and delete feedback (planned)

- **Developer input:** `VideoReview.tsx` is acceptable for issue #4, but should be cleaned up before editing and deletion add more responsibilities. Agreed to defer that refactor rather than expand issue #4.
- **Plan:** Extract `TimestampEditor`, `FeedbackList` / `FeedbackItem`, and shared timestamp utilities in small steps. Keep the player ref, feedback entries, and mutation callbacks in `VideoReview`; children manage local editing UI. Consider a playback hook only if the remaining logic warrants one; no reducer is planned.
- **Verification boundary:** Preserve current behaviour during extraction, run lint/build, and repeat create/sort/seek browser checks before adding editing/deletion. Then implement pencil-triggered inline editing and inline Remove/Cancel confirmation with appropriate focus handling. The plan is recorded in GitHub issue #5; the refactor has not started.

## Journal updates at issue completion

Keep each entry brief. Record the developer's choices and AI's contribution honestly, including changed approaches that explain a useful tradeoff. Update status and delivery evidence rather than preserving stale progress notes.

When finishing an issue, suggest an addition or update covering:

- What shipped and which issue it completes.
- One or two decisions, the developer input behind them, and why we chose them.
- React/TypeScript concepts learned or clarified.
- Checks actually run, browser checks reported, and remaining limitations.
- Commit/PR reference when available and any deferred work.

Avoid logging every prompt, claiming unperformed checks, or turning the journal into a second backlog. The project brief remains the scope reference.
