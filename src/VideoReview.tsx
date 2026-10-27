import { useEffect, useId, useRef, useState } from "react"
import type { ChangeEvent, SyntheticEvent } from "react"
import Alert from "./Alert"
import FeedbackList from "./FeedbackList"
import VideoPlayer from "./VideoPlayer"
import { useReviewWorkspace } from "./ReviewWorkspaceContext"
import { isFeedbackRelevant } from "./utils/relevance"
import type { FeedbackCategory, FeedbackEntry, RecordingIdentity } from "./types"
import { getRecordingIdentity, matchesRecording } from "./utils/recording"

import { validateFeedback } from "./utils/feedback"

type VideoReviewProps = {
  remoteSource?: string
  isSuspended?: boolean
  isSettingUp: boolean
  hasReviewData: boolean
  onReadyChange: (ready: boolean) => void
  recording: RecordingIdentity | null
  onRecordingChange: (recording: RecordingIdentity, startNew: boolean) => void
  feedbackEntries: FeedbackEntry[]
  onFeedbackChange: (update: (entries: FeedbackEntry[]) => FeedbackEntry[]) => void
}

function VideoReview({ remoteSource, isSuspended = false, isSettingUp, hasReviewData, onReadyChange, recording, onRecordingChange, feedbackEntries, onFeedbackChange }: VideoReviewProps) {
  const workspace = useReviewWorkspace()
  const [playback, setPlayback] = useState({ time: 0, playing: false })
  const prefix = useId()
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "All">("All")
  const [selectedFeedback, setSelectedFeedback] = useState<{ id: string; request: number } | null>(null)
  const selectionRequest = useRef(0)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [videoError, setVideoError] = useState("")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [confirmNewReview, setConfirmNewReview] = useState(false)
  const [retryVersion, setRetryVersion] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const relevantIds = new Set(workspace?.focused && playback.playing && duration !== null && !videoError && !pendingFile
    ? feedbackEntries.filter((entry) => entry.timestamp <= duration && isFeedbackRelevant(entry.timestamp, playback.time)).map((entry) => entry.id)
    : [])

  useEffect(() => {
    const video = videoRef.current
    if ((!videoFile && !remoteSource) || !video) return

    if (remoteSource) {
      video.muted = true
      video.volume = 0
    }
    const url = remoteSource ?? URL.createObjectURL(videoFile!)
    video.src = url

    return () => {
      video.pause()
      video.removeAttribute("src")
      video.load()
      if (!remoteSource) URL.revokeObjectURL(url)
    }
  }, [videoFile, remoteSource, retryVersion])

  useEffect(() => {
    if (isSuspended) videoRef.current?.pause()
  }, [isSuspended])

  function clearTimestamp() {
    setTimestamp(null)
  }

  function connectRecording(file: File, startNew = false) {
    onReadyChange(false)
    setSelectedFeedback(null)
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

    if (hasReviewData && recording && !matchesRecording(recording, getRecordingIdentity(file))) {
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
    setVideoError(remoteSource
      ? "The demo recording could not be loaded. Check your connection and retry, or return to your own review."
      : "This video could not be played. Its format may be unsupported or the file may be damaged. Select another video file.")
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
    if ((!videoFile && !remoteSource) || duration === null || videoError) return "Select a working recording before editing feedback."
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
    if ((!videoFile && !remoteSource) || duration === null || videoError || pendingFile) return
    onFeedbackChange((previous) => previous.filter((entry) => entry.id !== id))
    if (selectedFeedback?.id === id) setSelectedFeedback(null)
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
    <section className="video-review" aria-labelledby={`${prefix}-video-review-heading`}>
      <div className="playback-pane">
        <div className="playback-title flex items-center justify-between gap-3">
        <h2 id={`${prefix}-video-review-heading`}>{isSettingUp ? "Recording" : "Recording playback"}</h2>
        <span className="session-tag">{remoteSource ? "Demo recording · Audio off" : "Local recording"}</span>
        </div>
        {!remoteSource && <div className="recording-source" data-connected={videoFile ? "true" : undefined}>
        <p id={`${prefix}-video-help`} className="form-hint">
          Your video stays on this device. Select it again after refreshing.
        </p>

        <label htmlFor={`${prefix}-video-upload`}>Select a local video</label>
        <div className="file-picker">
        <input
          ref={fileInputRef}
          id={`${prefix}-video-upload`}
          type="file"
          form={isSettingUp ? "recording-context-form" : undefined}
          required={isSettingUp && !videoFile}
          accept="video/*"
          aria-describedby={`${prefix}-video-help ${prefix}-file-status`}
          onChange={handleFileChange}
        />
        <span className="file-picker-action" aria-hidden="true">Choose file</span>
        <span id={`${prefix}-file-status`} className="file-picker-name">
          {videoFile ? `Selected: ${videoFile.name}` : "No video connected"}
        </span>
        </div>
        {recording && !videoFile && <p className="form-hint">Saved review recording: {recording.name}. Select it again to reconnect.</p>}
        </div>}
        {!videoFile && !remoteSource && <div className="video-placeholder">
          <span aria-hidden="true" className="placeholder-symbol">▷</span>
          <p>Your next pull starts here.</p>
          <span>Select a local recording to begin your review.</span>
        </div>}
        {(videoFile || remoteSource) && (
          <>
            <VideoPlayer
              videoRef={videoRef}
              relevantIds={relevantIds}
              allowFullscreen={!isSettingUp}
              onPlaybackChange={(time, playing) => setPlayback({ time, playing })}
              onStartFeedback={handleStartFeedback}
              canStartFeedback={!isSettingUp && duration !== null && !videoError && !pendingFile && timestamp === null}
              duration={duration}
              ready={duration !== null && videoError === "" && pendingFile === null}
              audioLocked={Boolean(remoteSource)}
              entries={isSettingUp ? [] : feedbackEntries}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onSeek={handleSeek}
              onSelectFeedback={(id) => {
                const entry = feedbackEntries.find((entry) => entry.id === id)
                if (!entry) return
                workspace?.setNotesOpen(true)
                if (categoryFilter !== "All" && categoryFilter !== entry.category) setCategoryFilter("All")
                selectionRequest.current += 1
                setSelectedFeedback({ id, request: selectionRequest.current })
              }}
            />
          </>
        )}
      </div>
      <aside className="notes-drawer" aria-label="Review notes drawer" data-open={!workspace?.focused || workspace.notesOpen}>
        {workspace?.focused && <button type="button" className="notes-drawer-handle notes-toggle"
          aria-label={workspace.notesOpen ? "Hide review notes" : "Show review notes"}
          title={workspace.notesOpen ? "Hide review notes" : "Show review notes"}
          aria-expanded={workspace.notesOpen} aria-controls={`${prefix}-notes-pane`}
          onClick={() => workspace.setNotesOpen(!workspace.notesOpen)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={workspace.notesOpen ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
          </svg>
        </button>}
      <div id={`${prefix}-notes-pane`} className="feedback-pane" tabIndex={0} role="region" aria-label="Feedback workspace"
        aria-hidden={workspace?.focused && !workspace.notesOpen || undefined} inert={workspace?.focused && !workspace.notesOpen || undefined}>
        {pendingFile && (
          <div className="removal-confirmation" role="group" aria-labelledby={`${prefix}-recording-mismatch`}>
            <p id={`${prefix}-recording-mismatch`} role="alert">
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
        {videoError && <Alert>{videoError}</Alert>}
        {remoteSource && videoError && <button type="button" onClick={() => {
          setVideoError("")
          setDuration(null)
          setRetryVersion((previous) => previous + 1)
        }}>Retry demo video</button>}
        {feedbackEntries.length > 0 && ((!videoFile && !remoteSource) || duration === null || videoError || pendingFile) && (
          <p className="form-hint">{remoteSource
            ? "Demo feedback is read-only until the recording is ready."
            : "Feedback is read-only until a recording is connected and ready. Select the matching recording to edit, remove, or seek to notes."}</p>
        )}
        {duration !== null && feedbackEntries.some((entry) => entry.timestamp > duration) && (
          <Alert>Some feedback timestamps exceed this recording's duration. Those moments cannot be sought; edit their timestamps or choose the original recording. Notes have been preserved.</Alert>
        )}
        {!isSettingUp && (videoFile || remoteSource || feedbackEntries.length > 0) && <FeedbackList
          relevantIds={relevantIds}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={(category) => { setCategoryFilter(category); setSelectedFeedback(null) }}
          selectedFeedback={selectedFeedback}
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
        {isSettingUp && <div className="setup-empty"><span className="section-kicker">Feedback</span><p>Set the scene. Then find the moments that matter.</p><span>Your timestamped notes will appear here once you start a review.</span></div>}
      </div>
      </aside>
    </section>
  )
}

export default VideoReview
