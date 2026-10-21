import type { FeedbackEntry } from "../types"

export function validateFeedback(entry: FeedbackEntry, duration: number | null): string | null {
  if (
    duration === null || !Number.isFinite(entry.timestamp) ||
    entry.timestamp < 0 || entry.timestamp > duration
  ) {
    return "Choose a valid timestamp within the recording before saving feedback."
  }

  if (!entry.observation.trim() || !entry.suggestedImprovement.trim()) {
    return "Observation and suggested improvement are required."
  }

  return null
}
