import { useState } from "react"
import Alert from "./Alert"
import type { RecordingContext } from "./types"

const combatJobs = [
  "Paladin", "Warrior", "Dark Knight", "Gunbreaker",
  "White Mage", "Scholar", "Astrologian", "Sage",
  "Monk", "Dragoon", "Ninja", "Samurai", "Reaper", "Viper",
  "Bard", "Machinist", "Dancer",
  "Black Mage", "Summoner", "Red Mage", "Pictomancer",
]

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

type RecordingContextFormProps = {
  savedContext: RecordingContext | null
  onSaveContext: (context: RecordingContext) => void
}

function RecordingContextForm({ savedContext, onSaveContext }: RecordingContextFormProps) {
  const [title, setTitle] = useState(savedContext?.title ?? "")
  const [encounter, setEncounter] = useState(savedContext?.encounter ?? "")
  const [playerName, setPlayerName] = useState(savedContext?.playerName ?? "")
  const [playerJob, setPlayerJob] = useState(savedContext?.playerJob ?? "")
  const [pullNotes, setPullNotes] = useState(savedContext?.pullNotes ?? "")
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
          onSaveContext({
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
        {error && <Alert>{error}</Alert>}
        <button type="submit">Save context</button>
      </form>
      {savedContext && (
        <p role="status">
          Context saved for “{savedContext.title}”.
        </p>
      )}
    </section>
  )
}

export default RecordingContextForm
