import { useEffect, useId, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { importanceLabels } from "./types"
import type { FeedbackEntry } from "./types"
import { formatTimestamp } from "./utils/timestamps"
import { groupTimelineEntries } from "./utils/timeline"

type FeedbackTimelineProps = {
  currentTime: number
  duration: number | null
  disabled: boolean
  entries: FeedbackEntry[]
  onSeek: (seconds: number) => void
  onSelectFeedback: (id: string) => void
}

function FeedbackTimeline({ currentTime, duration, disabled, entries, onSeek, onSelectFeedback }: FeedbackTimelineProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(600)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const prefix = useId()

  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  const groups = groupTimelineEntries(entries, duration, width)
  const progress = duration ? Math.min(100, Math.max(0, currentTime / duration * 100)) : 0

  return (
    <div className="feedback-timeline">
      <div ref={trackRef} className="timeline-axis" style={{ "--track-width": `${width}px` } as CSSProperties}
        onPointerMove={(event) => {
          if (event.pointerType === "touch" || !duration) return
          const bounds = event.currentTarget.getBoundingClientRect()
          const x = event.clientX - bounds.left
          const y = event.clientY - bounds.top
          // Keep the real range input above the markers for dragging. Hit-test
          // their visual positions here so it does not block marker hover.
          const hovered = y >= 0 && y <= bounds.height
            ? groups.find((group) => group.entries.some((entry) => Math.abs(entry.timestamp / duration * bounds.width - x) <= 7))
            : undefined
          setHoveredGroup(hovered?.id ?? null)
        }}
        onPointerLeave={() => setHoveredGroup(null)}>

        <div className="timeline-rail" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        <input type="range" className="seek-slider" aria-label="Playback position" title="Seek recording"
          aria-valuetext={`${formatTimestamp(currentTime)} of ${formatTimestamp(duration ?? 0)}`}
          min={0} max={duration ?? 1} step={0.1} value={Math.min(currentTime, duration ?? 0)}
          disabled={disabled} onChange={(event) => onSeek(Number(event.target.value))} />
        <div className="timeline-bookmarks">
          {groups.flatMap((group) => group.entries).map((entry) => (
            <span key={entry.id} className={`timeline-segment importance-${entry.importance}`} aria-hidden="true"
              style={{ left: `${duration ? entry.timestamp / duration * 100 : 0}%` }} />
          ))}
          {groups.map((group) => {
            const primary = group.entries.reduce((highest, entry) => entry.importance > highest.importance ? entry : highest)
            const position = duration ? group.timestamp / duration * 100 : 0
            const isGroup = group.entries.length > 1
            const expanded = openGroup === group.id
            return (
              <div key={group.id} className={`timeline-bookmark importance-${primary.importance} ${position > 50 ? "bookmark-near-end" : ""} ${hoveredGroup === group.id ? "bookmark-hovered" : ""}`}
                style={{ left: `${position}%`, "--bookmark-left": `${width * position / 100}px` } as CSSProperties}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenGroup(null)
                }}>
                <button type="button" className="bookmark-button" disabled={disabled}
                  aria-label={isGroup
                    ? `Choose from ${group.entries.length} feedback notes near ${formatTimestamp(group.timestamp)}`
                    : `Show feedback at ${formatTimestamp(primary.timestamp)}: ${primary.importance} · ${importanceLabels[primary.importance]} · ${primary.category} — ${primary.observation}`}
                  aria-expanded={expanded}
                  aria-controls={expanded ? `${prefix}-${group.id}` : undefined}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") { setOpenGroup(null); event.stopPropagation() }
                  }}
                  onClick={() => setOpenGroup(expanded ? null : group.id)}>
                  <span>{primary.importance}</span>
                  {isGroup && <span className="bookmark-count">+{group.entries.length - 1}</span>}
                  <span className="bookmark-description">{isGroup ? `${group.entries.length} notes` : `${importanceLabels[primary.importance]} · ${primary.category}`}</span>
                </button>
                {expanded && (
                  <div id={`${prefix}-${group.id}`} className="bookmark-picker" role="group" aria-label={isGroup ? "Choose feedback note" : "Feedback preview"}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setOpenGroup(null)
                        event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(".bookmark-button")?.focus()
                        event.stopPropagation()
                      }
                    }}>
                    <div className="bookmark-picker-heading">
                      <span>{`${group.entries.length} Review ${group.entries.length === 1 ? "Note" : "Notes"}`}</span>
                      <button type="button" className="bookmark-close" aria-label="Close feedback preview" onClick={(event) => {
                        setOpenGroup(null)
                        event.currentTarget.closest(".timeline-bookmark")?.querySelector<HTMLButtonElement>(".bookmark-button")?.focus()
                      }}>×</button>
                    </div>
                    {group.entries.map((entry) => <button key={entry.id} type="button" className="bookmark-card" onClick={() => {
                      setOpenGroup(null)
                      onSelectFeedback(entry.id)
                    }}>
                      <span className="bookmark-card-meta">
                        <span className={`importance-badge importance-${entry.importance}`}>{entry.importance} · {importanceLabels[entry.importance]}</span>
                        <span>{formatTimestamp(entry.timestamp)} · {entry.category}</span>
                      </span>
                      <span className="bookmark-card-field"><strong>Observation</strong><span>{entry.observation}</span></span>
                      <span className="bookmark-card-field"><strong>Suggestion</strong><span>{entry.suggestedImprovement}</span></span>
                      <span className="bookmark-card-action">View in review notes <span aria-hidden="true">↗</span></span>
                    </button>)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FeedbackTimeline
