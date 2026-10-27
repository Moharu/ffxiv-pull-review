import type { FeedbackEntry } from "../types"

type TimelineGroup = { id: string; timestamp: number; entries: FeedbackEntry[] }

// Cluster badges by their actual horizontal space, leaving each note selectable.
export function groupTimelineEntries(entries: FeedbackEntry[], duration: number | null, width: number): TimelineGroup[] {
  if (duration === null || !Number.isFinite(duration) || duration <= 0) return []
  const groups: TimelineGroup[] = []
  const validEntries = entries.filter((entry) => Number.isFinite(entry.timestamp) && entry.timestamp >= 0 && entry.timestamp <= duration)
    .sort((a, b) => a.timestamp - b.timestamp)
  for (const entry of validEntries) {
    const last = groups.at(-1)
    if (last && (entry.timestamp - last.timestamp) / duration * Math.max(1, width) < 44) {
      last.entries.push(entry)
    } else {
      groups.push({ id: entry.id, timestamp: entry.timestamp, entries: [entry] })
    }
  }
  return groups
}
