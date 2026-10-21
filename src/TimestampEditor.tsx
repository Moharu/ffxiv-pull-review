import { useState } from "react"
import type { ChangeEvent, SubmitEvent } from "react"
import Alert from "./Alert"
import { formatTimestamp, convertTimestampDraftToSeconds } from "./utils/timestamps"

type TimestampEditorProps = {
  timestamp: number
  duration: number
  onApply: (seconds: number) => void
  onRemove: () => void
}

function TimestampEditor({ timestamp, duration, onApply, onRemove }: TimestampEditorProps) {
  const [timestampDraft, setTimestampDraft] = useState(() => formatTimestamp(timestamp))
  const [timestampError, setTimestampError] = useState("")

  function handleTimestampSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const seconds = convertTimestampDraftToSeconds(timestampDraft)

    if (seconds === null) {
      setTimestampError("Enter a time in m:ss format, such as 1:35 or 01:35. Seconds must be between 00 and 59.")
      return
    }

    if (seconds > duration) {
      setTimestampError(`Enter a time between 0:00 and ${formatTimestamp(duration)}.`)
      return
    }

    onApply(seconds)
    setTimestampDraft(formatTimestamp(seconds))
    setTimestampError("")
  }

  function handleTimestampDraftChange(event: ChangeEvent<HTMLInputElement>) {
    setTimestampDraft(event.target.value)
    setTimestampError("")
  }

  return (
    <form
      className="timestamp-editor"
      onSubmit={handleTimestampSubmit}
    >
      <label htmlFor="timestamp-input">Timestamp (m:ss)</label>
      <p id="timestamp-help" className="form-hint">
        Adjust the captured time from 0:00 to {formatTimestamp(duration)}. This updates
        the timestamp without seeking the video.
      </p>
      <input
        id="timestamp-input"
        type="text"
        placeholder="1:35"
        required
        value={timestampDraft}
        aria-invalid={timestampError ? true : undefined}
        aria-describedby={timestampError ? "timestamp-help timestamp-error" : "timestamp-help"}
        onChange={handleTimestampDraftChange}
      />
      {timestampError && <Alert id="timestamp-error">{timestampError}</Alert>}
      <div className="timestamp-actions">
        <button type="submit">Apply timestamp</button>
        <button
          type="button"
          className="remove-timestamp"
          onClick={onRemove}
        >
          Remove timestamp
        </button>
      </div>
    </form>
  )
}

export default TimestampEditor
