# Project milestones

The original MVP is complete: issues #1–8 are closed, and the developer confirmed green CI for its final commit, `3382b90`. The milestones below cover subsequent work.

## Milestone 1 — Visual redesign (post-MVP)

**Status:** Implementation complete and reviewed by the developer. Included in the visual redesign delivery commit; post-push CI and deployed verification remain to be confirmed.

**Outcome:** A dark, video-first workspace built with Tailwind CSS 4.

- Charcoal surfaces, violet accents, consistent controls and feedback badges, and descriptive panel titles without step numbers.
- Recording context in a compact header above playback and notes.
- Approximately 70/30 video-to-notes split on wide screens and 60/40 on tablets. At widths of at least 768px and heights of at least 600px, the full video frame stays visible while feedback scrolls independently.
- Feedback cards in the notes panel; narrow or short windows use document flow to preserve access to controls.
- Demo-only audio guardrail: muted at zero volume, with volume changes reset and native audio controls hidden where supported. Local recordings retain normal audio controls.
- Stable Start review alignment, visible timestamp hover feedback, and direct recording switching before context or feedback has been saved. Existing reviews retain mismatch protection.

**Evidence:** 102 automated tests, lint, production build, and whitespace checks pass. Targeted browser checks covered tablet/desktop video bounds, note scrolling, context editing, replacement prompts, setup alignment, badge sizing, and hover feedback. The developer reviewed the direction and refinements positively. A full accessibility recheck was deferred at their request; previous MVP phone/zoom results do not validate the redesigned layout.

See the [development journal](development-journal.md#post-mvp--dark-tailwind-workspace-2026-10-25) for decisions, iterations, and AI contributions.

## Milestone 2 — Focused Mode

**Status:** Planned; implementation has not started.

**Outcome:** Review footage with the video occupying the entire viewport and feedback tools available as overlays.

### Planned scope

- Enter and leave Focused Mode from an active local or demo review.
- Fit the full video frame within the viewport without cropping, including ultrawide footage.
- Present playback and feedback controls as overlays, with a way to view and work with timestamped feedback without leaving the video.
- Show indicators for saved feedback at the corresponding positions on the video progress bar.
- Preserve the current review, playback position, and local/demo isolation when switching modes. Reuse the existing add-and-pause, locked draft timestamp, save/cancel, editing, and deletion behaviour.

### Decisions to settle before implementation

- Use a viewport-filling application mode alone, or also offer the browser Fullscreen API.
- Overlay placement and visibility while watching, typing, or using a touch device.
- Marker interaction: seeking, selecting a note, and handling multiple notes at the same timestamp.
- Whether importance colors should also distinguish timeline indicators.

The browser's native video progress bar cannot be extended with application feedback markers. Plan for an application-owned seek bar and coordinate it with the existing media element; the exact control design remains to be decided.

### Completion criteria

- Entering/exiting the mode preserves the active recording, review data, and playback position.
- Overlay controls support the existing feedback workflow while keeping the video visible.
- Progress indicators stay aligned after feedback is added, edited, or deleted and after duration becomes available.
- Controls and markers remain usable with keyboard and touch, and overlay focus/visibility does not strand a draft or action.
- Verify local and demo flows, ultrawide and conventional aspect ratios, and relevant tablet/desktop layouts. Scope the automated and manual checks alongside implementation.

This milestone does not add accounts, video uploads, a backend, or AI-generated review content.
