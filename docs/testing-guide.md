# Testing guide

Run `npm test` for a single run, or `npm run test:watch` to rerun tests as you edit. For one file, use `npm test -- src/utils/timestamps.test.ts`. Tests live beside the code as `.test.ts` or `.test.tsx` files. Import `describe`, `it`, `expect`, and `vi` from `vitest` as needed; test globals are not enabled.

`vite.config.ts` configures jsdom for a browser-like document. `src/test/setup.ts` installs DOM matchers such as `toBeInTheDocument` and removes rendered components after each test. It does not simulate actual media playback.

## First test

`src/utils/timestamps.test.ts` contains one example. `describe` groups tests, `it` names a behaviour, and `expect(...).toBe(...)` compares the actual result to the expected value. The example protects our decision to accept both `1:35` and `01:35`; both represent 95 seconds.

## Add the remaining tests incrementally

1. **Parser:** Add separate cases for `0:00`, surrounding whitespace, empty input, missing colon, negative minutes, seconds of `60`, and an extremely large minute value. Invalid text should return `null`. Keep format validation separate from video-duration validation.
2. **Feedback bounds:** Create `src/utils/feedback.test.ts`. Build one valid entry and use object spread to change one property per case. Check zero and the exact duration are accepted; negative, beyond-duration, `NaN`, `Infinity`, and missing duration are rejected. Whitespace-only observation or suggestion should also be rejected. Assert an error exists rather than coupling every test to the full wording.
3. **Editing:** Create `src/FeedbackList.test.tsx`. Render a stateful test harness containing `FeedbackList` with a few entries and a known duration. Implement update/delete callbacks in the harness using the same callback contract as the app. Prefer extracting a reusable parent mutation helper if you want to test the app's exact update implementation; do not mistake a harness callback for verification of `VideoReview` itself. Check Save updates the intended row without adding a duplicate, timestamp changes reorder rows, and Cancel retains the original content. Test through accessible buttons/labels and `within(row)`; do not inspect hook state.
4. **Rejected saves:** Give an update callback a deliberate error return. After Save, assert the alert appears and typed text is still present. This can be tested directly on `FeedbackItem`, wrapped in `<table><tbody>...</tbody></table>` because it renders table rows.
5. **Deletion:** In the list harness, open removal confirmation. Cancel must retain the row and restore focus to its remove icon. Confirm must remove only the chosen entry, update the count, and focus the summary. Deleting the final entry should show the empty state. Check `document.activeElement` with `toHaveFocus()` on the intended element.

For interactions, start each test with `const user = userEvent.setup()`, render the component, then `await user.click(...)`, `await user.clear(...)`, and `await user.type(...)`. Query with `screen.getByRole` or `screen.getByLabelText`; use `queryBy...` when asserting absence. The row's Save button submits controls associated through their `form` attributes, so test the real button rather than calling handlers directly.

For component callbacks, `vi.fn(() => null)` represents an accepted update and `vi.fn(() => 'Example error')` a rejection. A callback spy verifies what the child requests; a stateful harness verifies how rendered rows respond to accepted changes.

Start with the parser cases and run that file before moving to component tests. Actual playback, responsive layout, and media-error recovery remain browser checks.
