import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, SyntheticEvent } from "react"
import Alert from "./Alert"
import FeedbackList from "./FeedbackList"
import type { FeedbackEntry } from "./types"

import { formatTimestamp } from "./utils/timestamps"
import { validateFeedback } from "./utils/feedback"

function VideoReview() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [videoError, setVideoError] = useState("")
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)

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

  function handleStartFeedback() {
    const video = videoRef.current
    if (!video || video.readyState < 1 || video.error || videoError || duration === null) return

    const seconds = Math.floor(video.currentTime)
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration) return

    video.pause()
    setTimestamp(seconds)
  }

  function handleAddFeedback(entry: FeedbackEntry): string | null {
    const error = validateFeedback(entry, duration)
    if (error) return error

    setFeedbackEntries((previous) => [...previous, entry])
    setTimestamp(null)
    return null
  }

  function handleUpdateFeedback(updatedEntry: FeedbackEntry): string | null {
    const error = validateFeedback(updatedEntry, duration)
    if (error) return error
    if (!feedbackEntries.some((entry) => entry.id === updatedEntry.id)) {
      return "This feedback entry is no longer available."
    }

    setFeedbackEntries((previous) => previous.map((entry) =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    ))
    return null
  }

  function handleDeleteFeedback(id: string) {
    setFeedbackEntries((previous) => previous.filter((entry) => entry.id !== id))
  }

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
        </>
      )}
      {videoError && <Alert>{videoError}</Alert>}
      {videoFile && <FeedbackList
        timestamp={timestamp}
        onStartFeedback={handleStartFeedback}
        onCancelFeedback={clearTimestamp}
        onAddFeedback={handleAddFeedback}
        entries={feedbackEntries}
        duration={duration}
        onUpdate={handleUpdateFeedback}
        onDelete={handleDeleteFeedback}
        canSeek={duration !== null && videoError === ""}
        onSeek={handleSeek}
      />}
    </section>
  )
}

export default VideoReview
