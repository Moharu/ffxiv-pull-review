import { useState } from "react"

const combatJobs = [
  "Paladin", "Warrior", "Dark Knight", "Gunbreaker",
  "White Mage", "Scholar", "Astrologian", "Sage",
  "Monk", "Dragoon", "Ninja", "Samurai", "Reaper", "Viper",
  "Bard", "Machinist", "Dancer",
  "Black Mage", "Summoner", "Red Mage", "Pictomancer",
]

type RecordingContext = {
  title: string
  encounter: string
  playerName: string
  playerJob: string
  pullNotes: string
}
type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

const TextField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: TextFieldProps) => (
  <div>
    <label htmlFor={id}>
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </label>
    <input
      required={required}
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
)

function RecordingContextForm() {
  const [savedContext, setSavedContext] =
    useState<RecordingContext | null>(null)
  const [title, setTitle] = useState("")
  const [encounter, setEncounter] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [playerJob, setPlayerJob] = useState("")
  const [pullNotes, setPullNotes] = useState("")
  const [error, setError] = useState("")
  return (
    <section className="context-card" aria-labelledby="recording-context">
      <h2 id="recording-context">Recording context</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const requiredValues = [title, encounter, playerName, playerJob]

          if (requiredValues.some((value) => value.trim() === "")) {
            setError("Enter a review title, encounter, player name, and job. Spaces alone don’t count.")
            return
          }

          setError("")
          setSavedContext({
            title: title.trim(),
            encounter: encounter.trim(),
            playerName: playerName.trim(),
            playerJob: playerJob.trim(),
            pullNotes: pullNotes.trim(),
          })
        }}
      >
        <p className="form-hint">Fields marked * are required.</p>
        <TextField
          required
          id="review-title"
          label="Review title"
          placeholder="Enter a title for your review"
          value={title}
          onChange={setTitle}
        />
        <TextField
          required
          id="encounter"
          label="Encounter"
          placeholder="Set the encounter for your review"
          value={encounter}
          onChange={setEncounter}
        />
        <TextField
          required
          id="player-name"
          label="Player name"
          placeholder="Enter your name"
          value={playerName}
          onChange={setPlayerName}
        />
        <div>
          <label htmlFor="player-job">
            Player job<span aria-hidden="true"> *</span>
          </label>
          <select
            required
            id="player-job"
            value={playerJob}
            onChange={(event) => setPlayerJob(event.target.value)}
          >
            <option value="">Select a job</option>
            {combatJobs.map((job) => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pull-notes">Pull notes (optional)</label>
          <textarea
            id="pull-notes"
            placeholder="Enter any notes about the pull"
            value={pullNotes}
            onChange={(event) => setPullNotes(event.target.value)}
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit">Save context</button>
      </form>
      {savedContext && (
        <p role="status">
          Context saved for “{savedContext.title}” in this session.
        </p>
      )}
    </section>
  )
}

export default RecordingContextForm
