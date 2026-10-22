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
  autoFocus?: boolean
}

const TextField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  autoFocus,
}: TextFieldProps) => (
  <div>
    <label htmlFor={id}>
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </label>
    <input
      required={required}
      autoFocus={autoFocus}
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
)

type RecordingContextFormProps = {
  videoReady: boolean
  savedContext: RecordingContext | null
  onSaveContext: (context: RecordingContext) => void
}

function RecordingContextForm({ savedContext, onSaveContext, videoReady }: RecordingContextFormProps) {
  const [encounter, setEncounter] = useState(savedContext?.encounter ?? "")
  const [playerName, setPlayerName] = useState(savedContext?.playerName ?? "")
  const [playerJob, setPlayerJob] = useState(savedContext?.playerJob ?? "")
  const [pullNotes, setPullNotes] = useState(savedContext?.pullNotes ?? "")
  const [error, setError] = useState("")
  return (
    <section className="context-card" aria-labelledby="recording-context">
      <h2 id="recording-context">{savedContext ? "Edit recording context" : "Set up your review"}</h2>
      <form id="recording-context-form"
        onSubmit={(event) => {
          event.preventDefault()
          const requiredValues = [encounter, playerName, playerJob]

          if (requiredValues.some((value) => value.trim() === "")) {
            setError("Enter an encounter, player name, and job. Spaces alone don’t count.")
            return
          }

          if (!videoReady) {
            setError("Select a playable recording before starting the review.")
            return
          }
          setError("")
          onSaveContext({
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
          autoFocus
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
      </form>

    </section>
  )
}

export default RecordingContextForm
