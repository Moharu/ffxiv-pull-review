import { useCallback, useRef, useState } from "react"
import VideoReview from "./VideoReview"
import { createDemoFeedback, demoContext, demoVideoUrl } from "./demo"

const ignoreReadiness = () => {}
const ignoreRecordingChange = () => {}

function DemoSession() {
  const [entries, setEntries] = useState(createDemoFeedback)
  return (
    <VideoReview
      remoteSource={demoVideoUrl}
      recording={null}
      onRecordingChange={ignoreRecordingChange}
      feedbackEntries={entries}
      onFeedbackChange={setEntries}
      isSettingUp={false}
      onReadyChange={ignoreReadiness}
    />
  )
}

function DemoReview({ onExit }: { onExit: () => void }) {
  const [generation, setGeneration] = useState(0)
  const [confirmReset, setConfirmReset] = useState(false)
  const restoreResetFocus = useRef(false)
  const focusHeading = useCallback((heading: HTMLHeadingElement | null) => heading?.focus(), [])

  return (
    <section className="review-panel" aria-label="Demo review">
      <header className="review-header">
        <div>
          <h2 tabIndex={-1} ref={focusHeading}>{demoContext.encounter} · Demo recording</h2>
          <p>{demoContext.playerName} · {demoContext.playerJob}</p>
          <p className="review-pull-notes">{demoContext.pullNotes}</p>
          <p className="form-hint">Sample feedback supplied by the recording's owner. Demo edits are temporary; your own review stays saved separately.</p>
        </div>
        <div className="feedback-row-actions">
          <button type="button" ref={(button) => {
            if (button && restoreResetFocus.current) {
              button.focus()
              restoreResetFocus.current = false
            }
          }} onClick={() => setConfirmReset(true)}>Reset demo</button>
          <button type="button" onClick={onExit}>Return to my review</button>
        </div>
      </header>
      {confirmReset && (
        <div className="removal-confirmation" role="group" aria-label="Reset demo confirmation">
          <p>Discard demo changes and restore the example notes?</p>
          <button type="button" onClick={() => {
            restoreResetFocus.current = true
            setGeneration((previous) => previous + 1)
            setConfirmReset(false)
          }}>Confirm reset</button>
          <button autoFocus type="button" onClick={() => {
            restoreResetFocus.current = true
            setConfirmReset(false)
          }}>Cancel reset</button>
        </div>
      )}
      <DemoSession key={generation} />
    </section>
  )
}

export default DemoReview
