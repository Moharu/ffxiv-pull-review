import { useId, useRef, useState } from "react"
import PlayerTooltip from "./PlayerTooltip"

const playbackSpeeds = Array.from({ length: 8 }, (_, index) => (index + 1) * 0.25)

type PlaybackSpeedControlProps = {
  value: number
  disabled: boolean
  onChange: (speed: number) => void
}

function PlaybackSpeedControl({ value, disabled, onChange }: PlaybackSpeedControlProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const id = useId()

  function close() { setOpen(false); triggerRef.current?.focus() }

  return <div className="speed-control"
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close() }
    }}>
    <PlayerTooltip label="Playback speed" suppressed={open}>
      {(descriptionId) => <button ref={triggerRef} type="button" className="speed-trigger" aria-label="Playback speed"
        aria-describedby={descriptionId} aria-expanded={open && !disabled} aria-controls={open && !disabled ? id : undefined}
        disabled={disabled} onClick={() => setOpen(!open)}>{value}×</button>}
    </PlayerTooltip>
    {open && !disabled && <div id={id} className="speed-options" role="group" aria-label="Playback speeds">
      {playbackSpeeds.map((speed) => <button key={speed} type="button" aria-pressed={value === speed} onClick={() => {
        onChange(speed)
        close()
      }}>{speed}×</button>)}
    </div>}
  </div>
}

export default PlaybackSpeedControl
