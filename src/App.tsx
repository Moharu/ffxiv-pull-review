import RecordingContextForm from './RecordingContextForm'
import VideoReview from './VideoReview'

function App() {
  return (
    <main>
      <p className="eyebrow">FFXIV Pull Review</p>
      <h1>Turn a pull into a practice plan.</h1>
      <p>
        Review your raid POV, record feedback at key moments, and choose
        priorities for your next pulls.
      </p>
      <VideoReview />
      <RecordingContextForm />
    </main>
  )
}

export default App
