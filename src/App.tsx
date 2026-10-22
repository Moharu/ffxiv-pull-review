import RecordingContextForm from './RecordingContextForm'
import VideoReview from './VideoReview'
import { useEffect, useState } from 'react'
import Alert from './Alert'
import { loadReview, saveReview } from './utils/storage'
import type { FeedbackEntry, RecordingContext, RecordingIdentity, SavedReview } from './types'

function App() {
  const [initialLoad] = useState(loadReview)
  const [review, setReview] = useState<SavedReview>(initialLoad.review)
  const [storageEnabled, setStorageEnabled] = useState(initialLoad.error === null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
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
      ? { version: 1, recording, context: null, feedbackEntries: [] }
      : { ...previous, recording })
    if (startNew) setReviewGeneration((previous) => previous + 1)
  }

  function handleSaveContext(context: RecordingContext) {
    setReview((previous) => ({ ...previous, context }))
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
      <VideoReview
        recording={review.recording}
        onRecordingChange={handleRecordingChange}
        feedbackEntries={review.feedbackEntries}
        onFeedbackChange={handleFeedbackChange}
      />
      <RecordingContextForm key={reviewGeneration} savedContext={review.context} onSaveContext={handleSaveContext} />
    </main>
  )
}

export default App
