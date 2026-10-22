import FeedbackForm from "./FeedbackForm"
import FeedbackItem from "./FeedbackItem"
import { useRef, useState } from "react"
import { feedbackCategories } from "./types"
import type { FeedbackCategory, FeedbackEntry } from "./types"

type FeedbackListProps = {
  entries: FeedbackEntry[]
  timestamp: number | null
  onStartFeedback: () => void
  onCancelFeedback: () => void
  onAddFeedback: (entry: FeedbackEntry) => string | null
  duration: number | null
  onUpdate: (entry: FeedbackEntry) => string | null
  onDelete: (id: string) => void
  canSeek: boolean
  onSeek: (seconds: number) => void
}

function FeedbackList({ onStartFeedback, onCancelFeedback, timestamp, onAddFeedback, entries, duration, onUpdate, onDelete, canSeek, onSeek }: FeedbackListProps) {
  const restoreAddFocus = useRef(false)
  const summaryRef = useRef<HTMLParagraphElement | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "All">("All")
  const visibleEntries = entries.filter((entry) => categoryFilter === "All" || entry.category === categoryFilter).sort((a, b) => a.timestamp - b.timestamp)

  function handleDelete(id: string) {
    // Move focus to a stable element before the deleted item unmounts.
    summaryRef.current?.focus()
    onDelete(id)
  }

  return (
    <>
      <div className="feedback-toolbar">
        <div>
      <label htmlFor="feedback-filter">Filter by category</label>
      <select
        id="feedback-filter"
        value={categoryFilter}
        onChange={(event) =>
          setCategoryFilter(event.target.value as FeedbackCategory | "All")
        }
      >
        <option value="All">All categories</option>
        {feedbackCategories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
        </div>
        <button
          ref={(button) => {
            if (button && restoreAddFocus.current && timestamp === null) {
              button.focus()
              restoreAddFocus.current = false
            }
          }}
          type="button"
          disabled={!canSeek || timestamp !== null}
          onClick={onStartFeedback}
        >Add Feedback</button>
      </div>
      {entries.length === 0 && <p>No feedback yet. Choose Add Feedback at a moment you want to review.</p>}
      {entries.length > 0 && visibleEntries.length === 0 && <p>No feedback matches this category.</p>}
      {(timestamp !== null || entries.length > 0) && <div className="feedback-table-scroll" role="region" aria-label="Feedback table" tabIndex={0}>
        <table className="feedback-table">
          <caption className="visually-hidden">Feedback in timestamp order</caption>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Importance</th>
              <th scope="col">Category</th>
              <th scope="col">Observation</th>
              <th scope="col">Suggestion</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timestamp !== null && duration !== null && (
              <FeedbackForm
                timestamp={timestamp}
                onCancel={() => {
                  restoreAddFocus.current = true
                  onCancelFeedback()
                }}
                onAddFeedback={(entry) => {
                  const error = onAddFeedback(entry)
                  if (!error) restoreAddFocus.current = true
                  return error
                }}
              />
            )}
        {visibleEntries.map((entry) => (
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
      </div>}
      <p ref={summaryRef} tabIndex={-1}>
        {categoryFilter === "All"
          ? `${entries.length} feedback ${entries.length === 1 ? "entry" : "entries"}`
          : `Showing ${visibleEntries.length} of ${entries.length} feedback entries`}
      </p>
    </>
  )
}

export default FeedbackList
