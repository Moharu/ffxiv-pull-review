import { useState } from "react"
import type { SubmitEvent } from "react"
import Alert from "./Alert"
import type { FeedbackCategory, FeedbackEntry } from "./types"

type FeedbackFormProps = {
  timestamp: number
  onAddFeedback: (entry: FeedbackEntry) => string | null
}

function FeedbackForm({ timestamp, onAddFeedback }: FeedbackFormProps) {
  const [category, setCategory] = useState<FeedbackCategory>("Mechanics")
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

  return <form id="feedback-form" onSubmit={handleSubmit}>
    Captured timestamp: {timestamp}
    <label htmlFor="feedback-category">Category</label>
    <select id="feedback-category" value={category} onChange={e => setCategory(e.target.value as FeedbackCategory)}>
      <option value="Mechanics">Mechanics</option>
      <option value="Positioning">Positioning</option>
      <option value="Rotation">Rotation</option>
      <option value="Mitigation">Mitigation</option>
      <option value="Other">Other</option>
    </select>
    <label htmlFor="feedback-observation">Observation</label>
    <textarea id="feedback-observation" placeholder="Observation" required value={observation} onChange={e => setObservation(e.target.value)} />
    <label htmlFor="feedback-suggested-improvement">Suggested Improvement</label>
    <textarea id="feedback-suggested-improvement" placeholder="Suggested Improvement" required value={suggestedImprovement} onChange={e => setSuggestedImprovement(e.target.value)} />
    {error && <Alert>{error}</Alert>}
    <button type="submit">Add Feedback</button>
  </form>
}

export default FeedbackForm
