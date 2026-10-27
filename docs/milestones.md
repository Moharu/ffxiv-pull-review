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

**Status:** Focused Mode remains planned. Its custom-player prerequisite has been reviewed and is being delivered as a separate checkpoint.

**Outcome:** Review footage with the video occupying the entire viewport and feedback tools available as overlays.

### Prerequisite — Custom video UI

Implemented before Focused Mode at the developer’s request:

- Play/pause button and a separate video-surface tap/click target; controls do not toggle playback accidentally.
- Desktop local-volume mute/unmute and an inline slider revealed on hover or keyboard focus; volume controls are hidden on mobile/coarse-pointer devices. Demo audio stays locked off.
- A borderless playback-speed button opens choices from 0.25× through 2× in 0.25 increments. Hover/focus tooltips describe controls; a fullscreen icon is shown disabled until Focused Mode work.
- Application-owned seek slider and playback time. No picture-in-picture or download actions; the video requests inline playback and disables picture-in-picture where supported.
- Individual importance-colored timeline ticks, with solid numbered badges that expand on hover/focus without moving their anchors. All bookmarks open labelled Observation/Suggestion preview cards; badges group when they would overlap.
- Selecting a preview card highlights, scrolls to, and focuses the corresponding note, clearing an incompatible category filter. Opening a preview does not seek or discard an open draft.

Local checks: 116 tests, lint, and production build pass. Real Chromium demo playback, seeking, speed changes, video-surface activation, and bookmark reveal/focus were checked at desktop/tablet/mobile widths. Local volume controls used a metadata fixture; native audio decoding was not asserted. Full accessibility, real-device, and deployed checks remain deferred for this increment.

### Planned scope

- Enter and leave Focused Mode from an active local or demo review.
- Fit the full video frame within the viewport without cropping, including ultrawide footage.
- Show a minimal, translucent context header over the video on pointer movement; hide it after inactivity while keeping keyboard/touch access.
- Put feedback in a collapsible right-hand column.
- During playback, promote and highlight notes from 3 seconds before their timestamp until 15 seconds after it. The start is inclusive and end exclusive: a 1:00 note is active at 0:57 and no longer active at 1:15. Expired notes return to normal order and remain available.
- Present playback and feedback controls as overlays, with a way to view and work with timestamped feedback without leaving the video.
- Show indicators for saved feedback at the corresponding positions on the video progress bar.
- Preserve the current review, playback position, and local/demo isolation when switching modes. Reuse the existing add-and-pause, locked draft timestamp, save/cancel, editing, and deletion behaviour.

### Decisions to settle before implementation

- Use a viewport-filling application mode alone, or also offer the browser Fullscreen API.
- Overlay placement and visibility while watching, typing, or using a touch device.
- How the existing bookmark picker and note focus should work when notes become overlays.
- Overlay treatment for the existing importance colors, expanded badges, and overlapping-note picker.

The custom player now supplies the application-owned seek bar and bookmarks; Focused Mode should reuse them rather than introduce a second media element or duplicate timeline state.

### Completion criteria

- Entering/exiting the mode preserves the active recording, review data, and playback position.
- Overlay controls support the existing feedback workflow while keeping the video visible.
- Progress indicators stay aligned after feedback is added, edited, or deleted and after duration becomes available.
- Controls and markers remain usable with keyboard and touch, and overlay focus/visibility does not strand a draft or action.
- Verify local and demo flows, ultrawide and conventional aspect ratios, and relevant tablet/desktop layouts. Scope the automated and manual checks alongside implementation.

This milestone does not add accounts, video uploads, a backend, or AI-generated review content.
