import { useState } from "react"
import type { SubmitEvent } from "react"
import Alert from "./Alert"
import SaveCancelActions from "./SaveCancelActions"
import ImportanceSelect from "./ImportanceSelect"
import type { Importance } from "./types"
import type { FeedbackCategory, FeedbackEntry } from "./types"
import { feedbackCategories } from "./types"
import { formatTimestamp } from "./utils/timestamps"

type FeedbackFormProps = {
  onCancel: () => void
  timestamp: number
  onAddFeedback: (entry: FeedbackEntry) => string | null
}

function FeedbackForm({ timestamp, onAddFeedback, onCancel }: FeedbackFormProps) {
  const [category, setCategory] = useState<FeedbackCategory>(feedbackCategories[0])
  const [importance, setImportance] = useState<Importance>(3)
  const [observation, setObservation] = useState("")
  const [suggestedImprovement, setSuggestedImprovement] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!observation.trim() || !suggestedImprovement.trim()) {
      setError("Observation and Suggested Improvement are required.")
      return
    }

    const newEntry: FeedbackEntry = {
      id: crypto.randomUUID(),
      timestamp,
      importance,
      category,
      observation: observation.trim(),
      suggestedImprovement: suggestedImprovement.trim(),
    }

    const submissionError = onAddFeedback(newEntry)

    if (submissionError) {
      setError(submissionError)
      return
    }

    // Reset form fields
    setObservation("")
    setSuggestedImprovement("")
    setError("")
  }

  return (
    <>
      <tr className="feedback-row feedback-editor feedback-new-row">
        <td>
          <small>New feedback</small>
          <span className="visually-hidden">Locked timestamp: </span>
          <span>{formatTimestamp(timestamp)}</span>
        </td>
        <td>
          <ImportanceSelect autoFocus id="feedback-importance" form="feedback-form"
            value={importance} onChange={setImportance} />
        </td>
        <td>
          <label className="visually-hidden" htmlFor="feedback-category">Category</label>
          <select id="feedback-category" form="feedback-form" value={category}
            onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>
            {feedbackCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </td>
        <td>
          <label className="visually-hidden" htmlFor="feedback-observation">Observation</label>
          <textarea id="feedback-observation" form="feedback-form" placeholder="What happened?" required
            value={observation} onChange={(event) => setObservation(event.target.value)} />
        </td>
        <td>
          <label className="visually-hidden" htmlFor="feedback-suggested-improvement">Suggested improvement</label>
          <textarea id="feedback-suggested-improvement" form="feedback-form" placeholder="What could improve?" required
            value={suggestedImprovement} onChange={(event) => setSuggestedImprovement(event.target.value)} />
        </td>
        <td>
          <form id="feedback-form" className="feedback-row-actions" aria-label="Add feedback" onSubmit={handleSubmit}>
            <SaveCancelActions onCancel={onCancel} />
          </form>
        </td>
      </tr>
      {error && <tr><td colSpan={6}><Alert>{error}</Alert></td></tr>}
    </>
  )
}

export default FeedbackForm
