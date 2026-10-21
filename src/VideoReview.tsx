import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, SubmitEvent, SyntheticEvent } from "react"
import Alert from "./Alert"
import FeedbackForm from "./FeedbackForm"
import type { FeedbackEntry } from "./types"

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

function convertTimestampDraftToSeconds(draft: string): number | null {
  const match = /^(\d+):([0-5]\d)$/.exec(draft.trim())

  if (!match) return null

  const seconds = Number(match[1]) * 60 + Number(match[2])

  if (!Number.isFinite(seconds)) return null

  return seconds
}

function VideoReview() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [timestampDraft, setTimestampDraft] = useState("")
  const [timestampError, setTimestampError] = useState("")
  const [videoError, setVideoError] = useState("")
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const captureButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!videoFile || !video) return

    const url = URL.createObjectURL(videoFile)
    video.src = url

    return () => {
      video.pause()
      video.removeAttribute("src")
      video.load()
      URL.revokeObjectURL(url)
    }
  }, [videoFile])

  function clearTimestamp() {
    setTimestamp(null)
    setTimestampDraft("")
    setTimestampError("")
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setVideoFile(event.target.files?.[0] ?? null)
    clearTimestamp()
    setDuration(null)
    setVideoError("")
  }

  function handleLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    const seconds = event.currentTarget.duration

    if (Number.isFinite(seconds) && seconds > 0) {
      setDuration(seconds)
      setVideoError("")
    } else {
      setDuration(null)
      clearTimestamp()
      setVideoError("This recording has no usable duration. Select another video file.")
    }
  }

  function handleVideoError(event: SyntheticEvent<HTMLVideoElement>) {
    // Source cleanup can reset the element without a media error.
    if (!event.currentTarget.error) return

    setVideoError("This video could not be played. Its format may be unsupported or the file may be damaged. Select another video file.")
    setDuration(null)
    clearTimestamp()
  }

  function handleCaptureTimestamp() {
    const video = videoRef.current
    if (!video || video.readyState < 1 || video.error || videoError) return

    setTimestamp(video.currentTime)
    setTimestampDraft(formatTimestamp(video.currentTime))
    setTimestampError("")
  }

  function handleTimestampSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (duration === null) return

    const seconds = convertTimestampDraftToSeconds(timestampDraft)

    if (seconds === null) {
      setTimestampError("Enter a time in m:ss format, such as 1:35 or 01:35. Seconds must be between 00 and 59.")
      return
    }

    if (seconds > duration) {
      setTimestampError(`Enter a time between 0:00 and ${formatTimestamp(duration)}.`)
      return
    }

    setTimestamp(seconds)
    setTimestampDraft(formatTimestamp(seconds))
    setTimestampError("")
  }

  function handleTimestampDraftChange(event: ChangeEvent<HTMLInputElement>) {
    setTimestampDraft(event.target.value)
    setTimestampError("")
  }

  function handleRemoveTimestamp() {
    if (!window.confirm("Remove the captured timestamp?")) return

    clearTimestamp()
    captureButtonRef.current?.focus()
  }

  function handleAddFeedback(entry: FeedbackEntry): string | null {
    if (
      duration === null ||
      !Number.isFinite(entry.timestamp) ||
      entry.timestamp < 0 ||
      entry.timestamp > duration
    ) {
      return "Capture a valid timestamp within the recording before adding feedback."
    }

    setFeedbackEntries((previous) => [...previous, entry])
    return null
  }

  const sortedFeedbackEntries = [...feedbackEntries].sort(
    (a, b) => a.timestamp - b.timestamp
  )

  function handleSeek(seconds: number) {
    const video = videoRef.current

    if (
      !video ||
      video.error ||
      duration === null ||
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      seconds > duration
    ) return

    video.currentTime = seconds
  }

  return (
    <section className="video-review" aria-labelledby="video-review-heading">
      <h2 id="video-review-heading">Recording playback</h2>
      <p id="video-help" className="form-hint">
        Your video stays on this device. Select it again after refreshing.
      </p>
      {!videoFile && <p>Select a recording to begin.</p>}
      <label htmlFor="video-upload">Select a local video</label>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        aria-describedby="video-help"
        onChange={handleFileChange}
      />
      {videoFile && (
        <>
          <video
            ref={videoRef}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleVideoError}
          />
          {duration !== null && (
            <p>Recording duration: {formatTimestamp(duration)}</p>
          )}
          <button
            ref={captureButtonRef}
            type="button"
            disabled={duration === null || videoError !== ""}
            onClick={handleCaptureTimestamp}
          >
            Capture timestamp
          </button>
        </>
      )}
      {videoError && <Alert>{videoError}</Alert>}
      <p role="status">
        {timestamp !== null && `Captured time: ${formatTimestamp(timestamp)}`}
      </p>
      {timestamp !== null && duration !== null && (
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
              onClick={handleRemoveTimestamp}
            >
              Remove timestamp
            </button>
          </div>
        </form>
      )}
      {timestamp !== null && duration !== null && (
        <FeedbackForm
          timestamp={timestamp}
          onAddFeedback={handleAddFeedback}
        />
      )}
      <p>Feedback entries: {feedbackEntries.length}</p>
      <ul>
        {sortedFeedbackEntries.map((entry) => (
          <li key={entry.id}>
            <p>
              <button
                type="button"
                onClick={() => handleSeek(entry.timestamp)}
                disabled={duration === null || videoError !== ""}
                aria-label={`Seek to ${formatTimestamp(entry.timestamp)}`}
              >
                {formatTimestamp(entry.timestamp)}
              </button>
              <span> · {entry.category}</span>
            </p>
            <p><strong>Observation:</strong> {entry.observation}</p>
            <p><strong>Suggested improvement:</strong> {entry.suggestedImprovement}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default VideoReview
