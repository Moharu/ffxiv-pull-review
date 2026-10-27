import FeedbackForm from "./FeedbackForm"
import FeedbackItem from "./FeedbackItem"
import { orderFeedback } from "./utils/relevance"
import { useId, useRef, useState } from "react"
import { feedbackCategories } from "./types"
import type { FeedbackCategory, FeedbackEntry } from "./types"

type FeedbackListProps = {
  relevantIds: ReadonlySet<string>
  categoryFilter: FeedbackCategory | "All"
  onCategoryFilterChange: (category: FeedbackCategory | "All") => void
  selectedFeedback: { id: string; request: number } | null
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

function FeedbackList({ relevantIds, categoryFilter, onCategoryFilterChange, selectedFeedback, onStartFeedback, onCancelFeedback, timestamp, onAddFeedback, entries, duration, onUpdate, onDelete, canSeek, onSeek }: FeedbackListProps) {
  const filterId = useId()
  const scrollHelpId = useId()
  const restoreAddFocus = useRef(false)
  const summaryRef = useRef<HTMLParagraphElement | null>(null)
  const [frozenOrder, setFrozenOrder] = useState<string[] | null>(null)
  const interactingIds = useRef(new Set<string>())
  const filteredEntries = entries.filter((entry) => categoryFilter === "All" || entry.category === categoryFilter)
  const positions = new Map((frozenOrder ?? []).map((id, index) => [id, index]))
  const visibleEntries = frozenOrder
    ? [...filteredEntries].sort((a, b) => (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity) || a.timestamp - b.timestamp)
    : orderFeedback(filteredEntries, relevantIds)

  function handleInteraction(id: string, active: boolean) {
    if (active) {
      if (interactingIds.current.size === 0) {
        setFrozenOrder(orderFeedback(entries, relevantIds).map((entry) => entry.id))
      }
      interactingIds.current.add(id)
    } else {
      interactingIds.current.delete(id)
      if (interactingIds.current.size === 0) setFrozenOrder(null)
    }
  }

  function handleDelete(id: string) {
    // Move focus to a stable element before the deleted item unmounts.
    summaryRef.current?.focus()
    handleInteraction(id, false)
    onDelete(id)
  }

  return (
    <>
      <div className="feedback-heading">
        <div>
          <span className="section-kicker">Review notes</span>
          <h2>Feedback</h2>
        </div>
        <span className="session-tag">{entries.length} notes</span>
      </div>
      <div className="feedback-toolbar">
        <div>
      <label htmlFor={filterId}>Filter by category</label>
      <select
        id={filterId}
        value={categoryFilter}
        onChange={(event) => {
          interactingIds.current.clear()
          setFrozenOrder(null)
          onCategoryFilterChange(event.target.value as FeedbackCategory | "All")
        }}
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
      {(timestamp !== null || entries.length > 0) && <div className="feedback-table-scroll" role="region" aria-label="Feedback table" aria-describedby={scrollHelpId} tabIndex={0}>
        <p id={scrollHelpId} className="table-scroll-hint">Feedback is ordered by timestamp. Select a timestamp to seek in the recording.</p>
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
            relevant={relevantIds.has(entry.id)}
            onInteractionChange={(active) => handleInteraction(entry.id, active)}
            focusRequest={selectedFeedback?.id === entry.id ? selectedFeedback.request : undefined}
            duration={duration}
            onUpdate={onUpdate}
            onDelete={handleDelete}
            canSeek={canSeek && duration !== null && entry.timestamp <= duration}
            canModify={canSeek}
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
