import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, SyntheticEvent } from "react"
import Alert from "./Alert"
import FeedbackList from "./FeedbackList"
import type { FeedbackEntry, RecordingIdentity } from "./types"
import { getRecordingIdentity, matchesRecording } from "./utils/recording"

import { formatTimestamp } from "./utils/timestamps"
import { validateFeedback } from "./utils/feedback"

type VideoReviewProps = {
  isSettingUp: boolean
  onReadyChange: (ready: boolean) => void
  recording: RecordingIdentity | null
  onRecordingChange: (recording: RecordingIdentity, startNew: boolean) => void
  feedbackEntries: FeedbackEntry[]
  onFeedbackChange: (update: (entries: FeedbackEntry[]) => FeedbackEntry[]) => void
}

function VideoReview({ isSettingUp, onReadyChange, recording, onRecordingChange, feedbackEntries, onFeedbackChange }: VideoReviewProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [videoError, setVideoError] = useState("")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [confirmNewReview, setConfirmNewReview] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  function connectRecording(file: File, startNew = false) {
    onReadyChange(false)
    setVideoFile(file)
    onRecordingChange(getRecordingIdentity(file), startNew)
    clearTimestamp()
    setDuration(null)
    setVideoError("")
    setPendingFile(null)
    setConfirmNewReview(false)
    fileInputRef.current?.focus()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    // Permit selecting the same file again after cancelling or a load failure.
    event.currentTarget.value = ""
    if (!file) return

    if (recording && !matchesRecording(recording, getRecordingIdentity(file))) {
      videoRef.current?.pause()
      onReadyChange(false)
      setPendingFile(file)
      setConfirmNewReview(false)
      return
    }
    connectRecording(file)
  }

  function handleLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    const seconds = event.currentTarget.duration

    if (Number.isFinite(seconds) && seconds > 0) {
      onReadyChange(true)
      setDuration(seconds)
      setVideoError("")
    } else {
      onReadyChange(false)
      setDuration(null)
      clearTimestamp()
      setVideoError("This recording has no usable duration. Select another video file.")
    }
  }

  function handleVideoError(event: SyntheticEvent<HTMLVideoElement>) {
    // Source cleanup can reset the element without a media error.
    if (!event.currentTarget.error) return

    onReadyChange(false)
    setVideoError("This video could not be played. Its format may be unsupported or the file may be damaged. Select another video file.")
    setDuration(null)
    clearTimestamp()
  }

  function handleStartFeedback() {
    const video = videoRef.current
    if (!video || video.readyState < 1 || video.error || videoError || pendingFile || duration === null) return

    const seconds = Math.floor(video.currentTime)
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration) return

    video.pause()
    setTimestamp(seconds)
  }

  function handleAddFeedback(entry: FeedbackEntry): string | null {
    if (pendingFile) return "Choose which recording to use before saving feedback."
    const error = validateFeedback(entry, duration)
    if (error) return error

    onFeedbackChange((previous) => [...previous, entry])
    setTimestamp(null)
    return null
  }

  function handleUpdateFeedback(updatedEntry: FeedbackEntry): string | null {
    if (!videoFile || duration === null || videoError) return "Select a working recording before editing feedback."
    if (pendingFile) return "Choose which recording to use before saving feedback."
    const error = validateFeedback(updatedEntry, duration)
    if (error) return error
    if (!feedbackEntries.some((entry) => entry.id === updatedEntry.id)) {
      return "This feedback entry is no longer available."
    }

    onFeedbackChange((previous) => previous.map((entry) =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    ))
    return null
  }

  function handleDeleteFeedback(id: string) {
    if (!videoFile || duration === null || videoError || pendingFile) return
    onFeedbackChange((previous) => previous.filter((entry) => entry.id !== id))
  }

  function handleSeek(seconds: number) {
    const video = videoRef.current

    if (
      !video ||
      pendingFile ||
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
      <h2 id="video-review-heading">{isSettingUp ? "Recording" : "Recording playback"}</h2>
      <p id="video-help" className="form-hint">
        Your video stays on this device. Select it again after refreshing.
      </p>
      {!videoFile && <p>Select a recording to begin.</p>}
      <label htmlFor="video-upload">Select a local video</label>
      <input
        ref={fileInputRef}
        id="video-upload"
        type="file"
        form={isSettingUp ? "recording-context-form" : undefined}
        required={isSettingUp && !videoFile}
        accept="video/*"
        aria-describedby="video-help"
        onChange={handleFileChange}
      />
      {recording && <p className="form-hint">Review recording: {recording.name}</p>}
      {pendingFile && (
        <div className="removal-confirmation" role="group" aria-labelledby="recording-mismatch">
          <p id="recording-mismatch" role="alert">
            “{pendingFile.name}” does not match the review recording's filename, size, or last-modified time.
            Matching metadata is a convenience check, not proof of identical contents.
          </p>
          {confirmNewReview ? (
            <>
              <p>Start a new review? This clears all saved context, feedback, and unsaved drafts in this review.</p>
              <button type="button" onClick={() => connectRecording(pendingFile, true)}>Confirm new review</button>
              <button type="button" onClick={() => setConfirmNewReview(false)}>Back</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => {
                onReadyChange(duration !== null && !videoError)
                setPendingFile(null)
                fileInputRef.current?.focus()
              }}>Cancel replacement</button>
              <button type="button" onClick={() => connectRecording(pendingFile)}>Use this recording anyway</button>
              <button type="button" onClick={() => setConfirmNewReview(true)}>Start a new review</button>
            </>
          )}
        </div>
      )}
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
      {feedbackEntries.length > 0 && (!videoFile || duration === null || videoError || pendingFile) && (
        <p className="form-hint">Feedback is read-only until a recording is connected and ready. Select the matching recording to edit, remove, or seek to notes.</p>
      )}
      {duration !== null && feedbackEntries.some((entry) => entry.timestamp > duration) && (
        <Alert>Some feedback timestamps exceed this recording's duration. Those moments cannot be sought; edit their timestamps or choose the original recording. Notes have been preserved.</Alert>
      )}
      {!isSettingUp && (videoFile || feedbackEntries.length > 0) && <FeedbackList
        timestamp={timestamp}
        onStartFeedback={handleStartFeedback}
        onCancelFeedback={clearTimestamp}
        onAddFeedback={handleAddFeedback}
        entries={feedbackEntries}
        duration={duration}
        onUpdate={handleUpdateFeedback}
        onDelete={handleDeleteFeedback}
        canSeek={duration !== null && videoError === "" && pendingFile === null}
        onSeek={handleSeek}
      />}
    </section>
  )
}

export default VideoReview
