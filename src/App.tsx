import RecordingContextForm from './RecordingContextForm'
import VideoReview from './VideoReview'
import DemoReview from './DemoReview'
import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from './Alert'
import { loadReview, saveReview } from './utils/storage'
import type { FeedbackEntry, RecordingContext, RecordingIdentity, SavedReview } from './types'

function App() {
  const focusReviewHeading = useCallback((heading: HTMLHeadingElement | null) => heading?.focus(), [])
  const [initialLoad] = useState(loadReview)
  const [isDemo, setIsDemo] = useState(false)
  const restoreDemoFocus = useRef(false)
  const [review, setReview] = useState<SavedReview>(initialLoad.review)
  const [storageEnabled, setStorageEnabled] = useState(initialLoad.error === null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(
    initialLoad.review.context === null && initialLoad.review.feedbackEntries.length === 0,
  )
  const [videoReady, setVideoReady] = useState(false)
  const [reviewGeneration, setReviewGeneration] = useState(0)

  useEffect(() => {
    if (!storageEnabled) return
    // Synchronize with external browser storage and expose any write failure.
    // This state reports the result of external I/O, rather than deriving UI data.
    // oxlint-disable-next-line react/set-state-in-effect
    setWriteError(saveReview(review))
  }, [review, storageEnabled])

  function handleReplaceStoredReview() {
    const error = saveReview(review)
    setWriteError(error)
    if (!error) {
      setStorageEnabled(true)
      setConfirmReplace(false)
    }
  }

  function handleRecordingChange(recording: RecordingIdentity, startNew: boolean) {
    setReview((previous) => startNew
      ? { version: 2, recording, context: null, feedbackEntries: [] }
      : { ...previous, recording })
    if (startNew) {
      setReviewGeneration((previous) => previous + 1)
      setIsSettingUp(true)
    }
  }

  function handleSaveContext(context: RecordingContext) {
    if (!videoReady) return
    setReview((previous) => ({ ...previous, context }))
    setIsSettingUp(false)
  }

  function handleFeedbackChange(update: (entries: FeedbackEntry[]) => FeedbackEntry[]) {
    setReview((previous) => ({
      ...previous,
      feedbackEntries: update(previous.feedbackEntries),
    }))
  }

  return (
    <main>
      <p className="eyebrow">FFXIV Pull Review</p>
      <h1>Turn a pull into actionable feedback.</h1>
      <p>
        Review your raid POV, record feedback at key moments, and identify
        the most important improvements for your next pulls.
      </p>
      <div className="demo-entry">
        <button type="button" hidden={isDemo} ref={(button) => {
          if (button && restoreDemoFocus.current) {
            button.focus()
            restoreDemoFocus.current = false
          }
        }} onClick={() => {
          setIsDemo(true)
        }}>Try demo recording</button>
        {!isDemo && <p className="form-hint">No recording handy? Explore the app with a hosted M9S demo.</p>}
      </div>
      {isDemo && <DemoReview onExit={() => {
        setIsDemo(false)
        restoreDemoFocus.current = true
      }} />}
      {!storageEnabled && (
        <section aria-label="Storage recovery">
          <Alert>{initialLoad.error} Automatic saving is paused. You can continue working in this session.</Alert>
          {confirmReplace ? (
            <>
              <p>Replace the unreadable stored data with your current working review? The previous stored data will be lost.</p>
              <button type="button" onClick={handleReplaceStoredReview}>Confirm replacement</button>
              <button type="button" onClick={() => setConfirmReplace(false)}>Cancel replacement</button>
            </>
          ) : <button type="button" onClick={() => setConfirmReplace(true)}>Replace stored data</button>}
        </section>
      )}
      {writeError && (
        <div>
          <Alert>{writeError}</Alert>
          {storageEnabled && <button type="button" onClick={() => setWriteError(saveReview(review))}>Retry save</button>}
        </div>
      )}
      <section hidden={isDemo} className="review-panel" aria-label="Raid review">
        {isSettingUp ? (
          <RecordingContextForm
            key={reviewGeneration}
            savedContext={review.context}
            onSaveContext={handleSaveContext}
            videoReady={videoReady}
          />
        ) : (
          <header className="review-header">
            <div>
              <h2 tabIndex={-1} ref={focusReviewHeading}>
                {review.context?.encounter ?? 'Restored review'}
              </h2>
              {review.context && <p>{review.context.playerName} · {review.context.playerJob}</p>}
              {review.recording && <p className="form-hint">{review.recording.name}</p>}
              {review.context?.pullNotes && <p className="review-pull-notes">{review.context.pullNotes}</p>}
            </div>
            <button type="button" onClick={() => setIsSettingUp(true)}>Edit context</button>
          </header>
        )}
        <VideoReview
          isSuspended={isDemo}
          recording={review.recording}
          onRecordingChange={handleRecordingChange}
          feedbackEntries={review.feedbackEntries}
          onFeedbackChange={handleFeedbackChange}
          isSettingUp={isSettingUp}
          onReadyChange={setVideoReady}
        />
        {isSettingUp && (
          <div className="setup-actions">
            {!videoReady && <p className="form-hint">Select a playable recording before starting the review.</p>}
            <button form="recording-context-form" type="submit" disabled={!videoReady}>
              {review.context ? 'Save context' : 'Start review'}
            </button>
            {(review.context || review.feedbackEntries.length > 0) && (
              <button type="button" onClick={() => setIsSettingUp(false)}>Cancel context changes</button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
