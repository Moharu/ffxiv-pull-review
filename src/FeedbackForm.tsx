import { useState } from "react"
import type { SubmitEvent } from "react"
import Alert from "./Alert"
import type { FeedbackCategory, FeedbackEntry } from "./types"
import { feedbackCategories } from "./types"
import { formatTimestamp } from "./utils/timestamps"

type FeedbackFormProps = {
  timestamp: number
  onAddFeedback: (entry: FeedbackEntry) => string | null
}

function FeedbackForm({ timestamp, onAddFeedback }: FeedbackFormProps) {
  const [category, setCategory] = useState<FeedbackCategory>(feedbackCategories[0])
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
          <span>{formatTimestamp(timestamp)}</span>
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
            <button type="submit">Add feedback</button>
          </form>
        </td>
      </tr>
      {error && <tr><td colSpan={5}><Alert>{error}</Alert></td></tr>}
    </>
  )
}

export default FeedbackForm
