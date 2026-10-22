import { useRef, useState } from "react"
import type { SubmitEvent } from "react"
import Alert from "./Alert"
import SaveCancelActions from "./SaveCancelActions"
import ImportanceSelect from "./ImportanceSelect"
import { importanceLabels } from "./types"
import type { FeedbackCategory, FeedbackEntry } from "./types"
import { feedbackCategories } from "./types"
import { convertTimestampDraftToSeconds, formatTimestamp } from "./utils/timestamps"

type FeedbackItemProps = {
  entry: FeedbackEntry
  duration: number | null
  onUpdate: (entry: FeedbackEntry) => string | null
  onDelete: (id: string) => void
  canSeek: boolean
  onSeek: (seconds: number) => void
}

function FeedbackItem({ entry, duration, onUpdate, onDelete, canSeek, onSeek }: FeedbackItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [timeDraft, setTimeDraft] = useState("")
  const [draft, setDraft] = useState(entry)
  const [error, setError] = useState("")
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false)
  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const restoreEditFocus = useRef(false)
  const removeButtonRef = useRef<HTMLButtonElement | null>(null)
  const prefix = `feedback-${entry.id}`

  function handleEdit() {
    setDraft(entry)
    setTimeDraft(formatTimestamp(entry.timestamp))
    setError("")
    setIsEditing(true)
  }

  function closeEditor() {
    setIsEditing(false)
    setError("")
    restoreEditFocus.current = true
  }

  function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedTime = convertTimestampDraftToSeconds(timeDraft)
    if (parsedTime === null) {
      setError("Enter a timestamp in m:ss format, such as 1:35. Seconds must be between 00 and 59.")
      return
    }

    const submissionError = onUpdate({
      ...draft,
      id: entry.id,
      timestamp: parsedTime,
      observation: draft.observation.trim(),
      suggestedImprovement: draft.suggestedImprovement.trim(),
    })
    if (submissionError) {
      setError(submissionError)
      return
    }
    closeEditor()
  }

  return (
    <>
      <tr className={isEditing ? "feedback-row feedback-editor" : "feedback-row"}>
        <td>
          {isEditing ? (
            <>
              <label className="visually-hidden" htmlFor={`${prefix}-time`}>Timestamp (m:ss)</label>
              <input autoFocus id={`${prefix}-time`} form={`${prefix}-editor`} required
                value={timeDraft} onChange={(event) => setTimeDraft(event.target.value)} />
              {duration !== null && <small>0:00–{formatTimestamp(duration)}</small>}
            </>
          ) : (
            <button type="button" onClick={() => onSeek(entry.timestamp)} disabled={!canSeek}
              aria-label={`Seek to ${formatTimestamp(entry.timestamp)}`}>
              {formatTimestamp(entry.timestamp)}
            </button>
          )}
        </td>
        <td>
          {isEditing ? (
            <>
              <ImportanceSelect id={`${prefix}-importance`} form={`${prefix}-editor`}
                value={draft.importance} onChange={(importance) => setDraft({ ...draft, importance })} />
            </>
          ) : (
            <span className={`importance-badge importance-${entry.importance}`}>
              {entry.importance} · {importanceLabels[entry.importance]}
            </span>
          )}
        </td>
        <td>
          {isEditing ? (
            <>
              <label className="visually-hidden" htmlFor={`${prefix}-category`}>Category</label>
              <select id={`${prefix}-category`} form={`${prefix}-editor`} value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as FeedbackCategory })}>
                {feedbackCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </>
          ) : entry.category}
        </td>
        <td>
          {isEditing ? (
            <>
              <label className="visually-hidden" htmlFor={`${prefix}-observation`}>Observation</label>
              <textarea id={`${prefix}-observation`} form={`${prefix}-editor`} required
                value={draft.observation}
                onChange={(event) => setDraft({ ...draft, observation: event.target.value })} />
            </>
          ) : entry.observation}
        </td>
        <td>
          {isEditing ? (
            <>
              <label className="visually-hidden" htmlFor={`${prefix}-improvement`}>Suggested improvement</label>
              <textarea id={`${prefix}-improvement`} form={`${prefix}-editor`} required
                value={draft.suggestedImprovement}
                onChange={(event) => setDraft({ ...draft, suggestedImprovement: event.target.value })} />
            </>
          ) : entry.suggestedImprovement}
        </td>
        <td>
          {isEditing ? (
            <form id={`${prefix}-editor`} className="feedback-row-actions" onSubmit={handleSave}
              aria-label={`Edit feedback at ${formatTimestamp(entry.timestamp)}: ${entry.observation}`}>
              <SaveCancelActions onCancel={closeEditor} />
            </form>
          ) : (
            <div className="feedback-row-actions">
              <button
                ref={(button) => {
                  editButtonRef.current = button
                  if (button && restoreEditFocus.current) {
                    button.focus()
                    restoreEditFocus.current = false
                  }
                }}
                type="button" className="feedback-icon" aria-label={`Edit feedback at ${formatTimestamp(entry.timestamp)}: ${entry.observation}`}
                disabled={isConfirmingRemoval} onClick={handleEdit}>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" />
                </svg>
              </button>
              <button ref={removeButtonRef} type="button" className="feedback-icon feedback-icon-remove"
                aria-label={`Remove feedback at ${formatTimestamp(entry.timestamp)}: ${entry.observation}`}
                aria-expanded={isConfirmingRemoval}
                aria-controls={isConfirmingRemoval ? `${prefix}-removal` : undefined}
                onClick={() => setIsConfirmingRemoval(true)}>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          )}
        </td>
      </tr>
      {isEditing && error && (
        <tr><td colSpan={6}><Alert>{error}</Alert></td></tr>
      )}
      {isConfirmingRemoval && (
        <tr>
          <td colSpan={6}>
            <div id={`${prefix}-removal`} className="removal-confirmation" role="group"
              aria-labelledby={`${prefix}-removal-label`}>
              <p id={`${prefix}-removal-label`}>Remove feedback at {formatTimestamp(entry.timestamp)}? This cannot be undone.</p>
              <div className="feedback-row-actions">
                <button type="button" className="remove-timestamp" onClick={() => onDelete(entry.id)}>Remove</button>
                <button autoFocus type="button" onClick={() => {
                  setIsConfirmingRemoval(false)
                  removeButtonRef.current?.focus()
                }}>Cancel</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default FeedbackItem
