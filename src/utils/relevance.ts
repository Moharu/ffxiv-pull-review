import type { FeedbackEntry } from "../types"

export function isFeedbackRelevant(timestamp: number, currentTime: number): boolean {
  return Number.isFinite(timestamp) && Number.isFinite(currentTime)
    && currentTime >= timestamp - 3 && currentTime < timestamp + 15
}

export function orderFeedback(entries: FeedbackEntry[], relevantIds: ReadonlySet<string>): FeedbackEntry[] {
  return [...entries].sort((a, b) => Number(relevantIds.has(b.id)) - Number(relevantIds.has(a.id)) || a.timestamp - b.timestamp)
}
