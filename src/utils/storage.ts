import { feedbackCategories, importanceLevels } from "../types"
import type { SavedReview } from "../types"

export const REVIEW_STORAGE_KEY = "ffxiv-pull-review"

export function createEmptyReview(): SavedReview {
  return { version: 1, recording: null, context: null, feedbackEntries: [] }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== ""
}

export function isSavedReview(value: unknown): value is SavedReview {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.feedbackEntries)) return false
  const { context, recording, feedbackEntries } = value

  if (context !== null && (
    !isObject(context) ||
    ![context.title, context.encounter, context.playerName, context.playerJob].every(isNonemptyString) ||
    typeof context.pullNotes !== "string"
  )) return false

  if (recording !== null && (
    !isObject(recording) || !isNonemptyString(recording.name) ||
    !Number.isSafeInteger(recording.size) || (recording.size as number) < 0 ||
    !Number.isSafeInteger(recording.lastModified) || (recording.lastModified as number) < 0
  )) return false

  const ids = new Set<string>()
  for (const entry of feedbackEntries) {
    if (!isObject(entry) || !isNonemptyString(entry.id) || ids.has(entry.id) ||
      !Number.isSafeInteger(entry.timestamp) || (entry.timestamp as number) < 0 ||
      !importanceLevels.some((level) => level === entry.importance) ||
      !feedbackCategories.some((category) => category === entry.category) ||
      !isNonemptyString(entry.observation) || !isNonemptyString(entry.suggestedImprovement)
    ) return false
    ids.add(entry.id)
  }
  // Notes need a recording identity, but its actual duration is checked after reselection.
  return feedbackEntries.length === 0 || recording !== null
}

type LoadResult = {
  review: SavedReview
  error: string | null
}

export function loadReview(): LoadResult {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY)
    if (raw === null) return { review: createEmptyReview(), error: null }
    const parsed: unknown = JSON.parse(raw)
    if (!isSavedReview(parsed)) {
      return { review: createEmptyReview(), error: "Saved review data is invalid or uses an unsupported version. It has not been overwritten." }
    }
    return { review: parsed, error: null }
  } catch {
    return { review: createEmptyReview(), error: "The saved review could not be read. Browser storage may be unavailable or the data may be damaged. It has not been overwritten." }
  }
}

export function saveReview(review: SavedReview): string | null {
  try {
    // Explicitly whitelist persisted fields: never serialize a File or temporary URL.
    const saved: SavedReview = {
      version: 1,
      recording: review.recording === null ? null : {
        name: review.recording.name,
        size: review.recording.size,
        lastModified: review.recording.lastModified,
      },
      context: review.context === null ? null : {
        title: review.context.title, encounter: review.context.encounter,
        playerName: review.context.playerName, playerJob: review.context.playerJob,
        pullNotes: review.context.pullNotes,
      },
      feedbackEntries: review.feedbackEntries.map((entry) => ({
        id: entry.id, timestamp: entry.timestamp, importance: entry.importance,
        category: entry.category, observation: entry.observation,
        suggestedImprovement: entry.suggestedImprovement,
      })),
    }
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(saved))
    return null
  } catch {
    return "Changes could not be saved to this browser. Storage may be full or unavailable. Your current review is still available in this session; retry before refreshing."
  }
}
