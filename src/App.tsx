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
    <main className="app-shell mx-auto flex min-h-dvh w-full flex-col">
      <header className="app-header flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="brand-mark grid size-10 place-items-center rounded-xl border border-violet-400/30 bg-violet-400/10 text-violet-200">◈</span>
          <div>
            <p className="eyebrow">FFXIV <span className="text-violet-300">/</span> Pull Review</p>
            <h1 className="text-xs text-zinc-400">Turn a pull into actionable feedback.</h1>
          </div>
        </div>
        <div className="demo-entry flex items-center gap-3">
          <span className="hidden text-xs text-zinc-400 lg:inline">Your perspective. A better next pull.</span>
          <button type="button" hidden={isDemo} ref={(button) => {
            if (button && restoreDemoFocus.current) {
              button.focus()
              restoreDemoFocus.current = false
            }
          }} onClick={() => setIsDemo(true)}>Try demo recording <span aria-hidden="true">↗</span></button>
          {isDemo && <span className="session-tag">Demo workspace</span>}
        </div>
      </header>
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
        <div className="context-panel">
          <div className="section-kicker">Recording context</div>
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
        </div>
        <VideoReview
          hasReviewData={review.context !== null || review.feedbackEntries.length > 0}
          isSuspended={isDemo}
          recording={review.recording}
          onRecordingChange={handleRecordingChange}
          feedbackEntries={review.feedbackEntries}
          onFeedbackChange={handleFeedbackChange}
          isSettingUp={isSettingUp}
          onReadyChange={setVideoReady}
        />
      </section>
    </main>
  )
}

export default App
