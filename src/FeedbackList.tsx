import FeedbackForm from "./FeedbackForm"
import FeedbackItem from "./FeedbackItem"
import { useRef } from "react"
import type { FeedbackEntry } from "./types"

type FeedbackListProps = {
  entries: FeedbackEntry[]
  timestamp: number | null
  onAddFeedback: (entry: FeedbackEntry) => string | null
  duration: number | null
  onUpdate: (entry: FeedbackEntry) => string | null
  onDelete: (id: string) => void
  canSeek: boolean
  onSeek: (seconds: number) => void
}

function FeedbackList({ timestamp, onAddFeedback, entries, duration, onUpdate, onDelete, canSeek, onSeek }: FeedbackListProps) {
  const summaryRef = useRef<HTMLParagraphElement | null>(null)
  const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp)

  function handleDelete(id: string) {
    // Move focus to a stable element before the deleted item unmounts.
    summaryRef.current?.focus()
    onDelete(id)
  }

  return (
    <>
      <p ref={summaryRef} tabIndex={-1}>Feedback entries: {entries.length}</p>
      {entries.length === 0 && <p>No feedback yet. Capture a timestamp and add a note to begin.</p>}
      <div className="feedback-table-scroll" role="region" aria-label="Feedback table" tabIndex={0}>
        <table className="feedback-table">
          <caption className="visually-hidden">Feedback in timestamp order</caption>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Category</th>
              <th scope="col">Observation</th>
              <th scope="col">Suggestion</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timestamp !== null && duration !== null && (
              <FeedbackForm timestamp={timestamp} onAddFeedback={onAddFeedback} />
            )}
        {sortedEntries.map((entry) => (
          <FeedbackItem
            key={entry.id}
            entry={entry}
            duration={duration}
            onUpdate={onUpdate}
            onDelete={handleDelete}
            canSeek={canSeek}
            onSeek={onSeek}
          />
        ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default FeedbackList
