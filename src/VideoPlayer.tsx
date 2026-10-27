import { useRef, useState } from "react"
import type { RefObject, SyntheticEvent } from "react"
import Alert from "./Alert"
import FeedbackTimeline from "./FeedbackTimeline"
import PlaybackSpeedControl from "./PlaybackSpeedControl"
import PlayerTooltip from "./PlayerTooltip"
import type { FeedbackEntry } from "./types"
import { formatTimestamp } from "./utils/timestamps"

type VideoPlayerProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  duration: number | null
  ready: boolean
  audioLocked: boolean
  entries: FeedbackEntry[]
  onLoadedMetadata: (event: SyntheticEvent<HTMLVideoElement>) => void
  onError: (event: SyntheticEvent<HTMLVideoElement>) => void
  onSeek: (seconds: number) => void
  onSelectFeedback: (id: string) => void
}

function VideoPlayer({ videoRef, duration, ready, audioLocked, entries, onLoadedMetadata, onError, onSeek, onSelectFeedback }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(audioLocked)
  const [speed, setSpeed] = useState(1)
  const [waiting, setWaiting] = useState(false)
  const [playError, setPlayError] = useState("")
  const lastVolume = useRef(1)

  async function togglePlayback() {
    const video = videoRef.current
    if (!video || !ready) return
    setPlayError("")
    if (!video.paused) { video.pause(); return }
    try {
      await video.play()
    } catch (error) {
      // A source change or pause can interrupt a pending play request normally.
      if (error instanceof DOMException && error.name === "AbortError") return
      setPlayError("Playback could not start. Try Play again or select another recording.")
    }
  }

  function syncVolume(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    if (audioLocked) {
      if (!video.muted) video.muted = true
      if (video.volume !== 0) video.volume = 0
    }
    if (video.volume > 0) lastVolume.current = video.volume
    setMuted(video.muted)
    setVolume(video.volume)
  }

  const silent = audioLocked || muted || volume === 0

  return (
    <div className="custom-player">
      <div className="video-stage" onContextMenu={(event) => event.preventDefault()}>
        <video ref={videoRef} playsInline disablePictureInPicture disableRemotePlayback controlsList="nodownload noremoteplayback"
          muted={audioLocked} preload="metadata"
          onLoadedMetadata={(event) => { setCurrentTime(event.currentTarget.currentTime); onLoadedMetadata(event) }}
          onError={(event) => { setPlaying(false); setWaiting(false); onError(event) }}
          onPlay={() => { setPlaying(true); setPlayError("") }}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setWaiting(false) }}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onRateChange={(event) => setSpeed(event.currentTarget.playbackRate)}
          onVolumeChange={syncVolume}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => setWaiting(false)}
          onCanPlay={() => setWaiting(false)}
          onEmptied={() => { setCurrentTime(0); setPlaying(false); setWaiting(false); setPlayError("") }}
        />
        <button type="button" className="video-tap-target" aria-label={playing ? "Pause video" : "Play video"}
          disabled={!ready} onClick={togglePlayback}>
          {!playing && <span className="stage-play" aria-hidden="true">▷</span>}
        </button>
        {waiting && playing && <span className="player-buffering" role="status">Buffering…</span>}
      </div>
      <div className="player-controls" role="group" aria-label="Video controls">
        <FeedbackTimeline currentTime={currentTime} duration={duration} disabled={!ready} entries={entries}
          onSeek={(seconds) => { onSeek(seconds); setCurrentTime(seconds) }} onSelectFeedback={onSelectFeedback} />
        <div className="player-control-row">
          <PlayerTooltip label={playing ? "Pause" : "Play"}>
          {(descriptionId) => <button type="button" className="player-icon" aria-label={playing ? "Pause" : "Play"}
            aria-describedby={descriptionId} disabled={!ready} onClick={togglePlayback}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              {playing ? <path d="M6 4h4v16H6zm8 0h4v16h-4z" /> : <path d="m7 4 14 8-14 8z" />}
            </svg>
          </button>}
          </PlayerTooltip>
          <output className="player-time" aria-label="Playback time" aria-live="off">{formatTimestamp(currentTime)} <span>/ {formatTimestamp(duration ?? 0)}</span></output>
          <div className="volume-control">
            <PlayerTooltip label={audioLocked ? "Demo audio is disabled" : silent ? "Unmute" : "Mute"}>
            {(descriptionId) => <button type="button" className="player-icon" aria-label={audioLocked ? "Demo audio is disabled" : silent ? "Unmute" : "Mute"}
              aria-describedby={descriptionId}
              disabled={audioLocked || !ready} onClick={() => {
                const video = videoRef.current
                if (!video) return
                if (silent) { video.volume = lastVolume.current; video.muted = false }
                else video.muted = true
              }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m11 4-6 5H2v6h3l6 5z" />
                {silent ? <path d="m16 9 6 6m0-6-6 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
              </svg>
            </button>}
            </PlayerTooltip>
            {!audioLocked && <div className="volume-slider"><input type="range" aria-label="Volume" title="Volume" min={0} max={1} step={0.05}
              disabled={!ready} value={silent ? 0 : volume} onChange={(event) => {
                const video = videoRef.current
                if (!video) return
                video.volume = Number(event.target.value)
                video.muted = video.volume === 0
              }} /></div>}
          </div>
          <PlaybackSpeedControl value={speed} disabled={!ready} onChange={(value) => {
            const video = videoRef.current
            if (video) video.playbackRate = value
          }} />
          <PlayerTooltip label="Fullscreen — coming soon">
            {(descriptionId) => <button type="button" className="player-icon" aria-label="Fullscreen — coming soon"
              aria-describedby={descriptionId} disabled>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
              </svg>
            </button>}
          </PlayerTooltip>
        </div>
        {playError && <Alert>{playError}</Alert>}
      </div>
    </div>
  )
}

export default VideoPlayer
