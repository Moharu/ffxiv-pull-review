import { createRef } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import VideoPlayer from "./VideoPlayer"
import type { FeedbackEntry } from "./types"

const note = (id: string, timestamp: number, importance: FeedbackEntry["importance"] = 3): FeedbackEntry => ({
  id, timestamp, importance, category: "Mechanics", observation: id, suggestedImprovement: "Improve",
})

function setup(options: { audioLocked?: boolean; ready?: boolean; entries?: FeedbackEntry[] } = {}) {
  const videoRef = createRef<HTMLVideoElement>()
  const onSeek = vi.fn()
  const onSelectFeedback = vi.fn()
  render(<VideoPlayer videoRef={videoRef} duration={120} ready={options.ready ?? true} audioLocked={options.audioLocked ?? false}
    entries={options.entries ?? []} onLoadedMetadata={vi.fn()} onError={vi.fn()} onSeek={onSeek} onSelectFeedback={onSelectFeedback} />)
  return { user: userEvent.setup(), video: videoRef.current!, onSeek, onSelectFeedback }
}

afterEach(() => vi.restoreAllMocks())

describe("custom video controls", () => {
  it("plays and pauses from the controls or video surface, following real media events", async () => {
    const { user, video } = setup()
    let paused = true
    vi.spyOn(video, "paused", "get").mockImplementation(() => paused)
    const play = vi.spyOn(video, "play").mockImplementation(async () => { paused = false; fireEvent.play(video) })
    const pause = vi.spyOn(video, "pause").mockImplementation(() => { paused = true; fireEvent.pause(video) })
    expect(video).not.toHaveAttribute("controls")
    expect(video).toHaveAttribute("disablepictureinpicture")
    expect(video).toHaveAttribute("playsinline")
    await user.click(screen.getByRole("button", { name: "Play" }))
    expect(play).toHaveBeenCalledOnce()
    await user.click(screen.getByRole("button", { name: "Pause video" }))
    expect(pause).toHaveBeenCalledOnce()
    await user.click(screen.getByRole("button", { name: "Play video" }))
    expect(play).toHaveBeenCalledTimes(2)
    fireEvent.ended(video)
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled()
  })

  it("reports a rejected playback request and disables controls until media is ready", async () => {
    const { user, video } = setup()
    vi.spyOn(video, "play").mockRejectedValue(new DOMException("Blocked", "NotAllowedError"))
    await user.click(screen.getByRole("button", { name: "Play" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Playback could not start")
  })

  it("disables playback, seeking, and speed selection while media is unavailable", () => {
    setup({ ready: false })
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Play video" })).toBeDisabled()
    expect(screen.getByRole("slider", { name: "Playback position" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Playback speed" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Enter fullscreen" })).toBeDisabled()
  })

  it("synchronizes playback time, seeks, and offers the eight quarter-step speeds", async () => {
    const { user, video, onSeek } = setup()
    video.currentTime = 65
    fireEvent.timeUpdate(video)
    expect(screen.getByLabelText("Playback time")).toHaveTextContent("1:05 / 2:00")
    fireEvent.change(screen.getByRole("slider", { name: "Playback position" }), { target: { value: "90" } })
    expect(onSeek).toHaveBeenCalledWith(90)
    const speed = screen.getByRole("button", { name: "Playback speed" })
    await user.click(speed)
    const options = screen.getByRole("group", { name: "Playback speeds" })
    expect(within(options).getAllByRole("button").map((option) => option.textContent))
      .toEqual(["0.25×", "0.5×", "0.75×", "1×", "1.25×", "1.5×", "1.75×", "2×"])
    await user.click(within(options).getByRole("button", { name: "1.75×" }))
    expect(video.playbackRate).toBe(1.75)
    fireEvent.rateChange(video)
    expect(speed).toHaveTextContent("1.75×")
    expect(speed).toHaveFocus()
    expect(speed).toHaveAttribute("aria-expanded", "false")
  })

  it("describes player controls and dismisses the speed options with Escape", async () => {
    const { user } = setup()
    const speed = screen.getByRole("button", { name: "Playback speed" })
    expect(speed).toHaveAccessibleDescription("Playback speed")
    expect(screen.getByRole("button", { name: "Play" })).toHaveAccessibleDescription("Play")
    const fullscreen = screen.getByRole("button", { name: "Enter fullscreen" })
    expect(fullscreen).toBeDisabled()
    expect(fullscreen).toHaveAccessibleDescription("Enter fullscreen")
    await user.click(speed)
    await user.tab()
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("group", { name: "Playback speeds" })).not.toBeInTheDocument()
    expect(speed).toHaveFocus()
  })

  it("mutes, unmutes, and restores an audible volume after sliding to zero", async () => {
    const { user, video } = setup()
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: "0.4" } })
    fireEvent.volumeChange(video)
    expect(video.volume).toBe(0.4)
    await user.click(screen.getByRole("button", { name: "Mute" }))
    fireEvent.volumeChange(video)
    expect(video.muted).toBe(true)
    await user.click(screen.getByRole("button", { name: "Unmute" }))
    fireEvent.volumeChange(video)
    expect(video.muted).toBe(false)
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: "0" } })
    fireEvent.volumeChange(video)
    await user.click(screen.getByRole("button", { name: "Unmute" }))
    expect(video.volume).toBe(0.4)
    expect(video.muted).toBe(false)
  })

  it("keeps demo audio disabled and does not offer a volume slider", () => {
    const { video } = setup({ audioLocked: true })
    video.muted = false
    video.volume = 0.8
    fireEvent.volumeChange(video)
    expect(video.muted).toBe(true)
    expect(video.volume).toBe(0)
    expect(screen.getByRole("button", { name: "Demo audio is disabled" })).toBeDisabled()
    expect(screen.queryByRole("slider", { name: "Volume" })).not.toBeInTheDocument()
  })

  it("expands a bookmark when its progress-bar marker is hovered without seeking", () => {
    const { onSeek, onSelectFeedback } = setup({ entries: [note("hover", 60)] })
    const slider = screen.getByRole("slider", { name: "Playback position" })
    const axis = slider.parentElement!
    vi.spyOn(axis, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 600, 28))
    const move = new Event("pointermove", { bubbles: true })
    Object.assign(move, { clientX: 300, clientY: 10, pointerType: "mouse" })
    fireEvent(axis, move)
    const bookmark = screen.getByRole("button", { name: /Show feedback at 1:00/ }).parentElement!
    expect(bookmark).toHaveClass("bookmark-hovered")
    expect(onSeek).not.toHaveBeenCalled()
    expect(onSelectFeedback).not.toHaveBeenCalled()
    fireEvent.pointerLeave(axis)
    expect(bookmark).toHaveClass("bookmark-hovered")
  })

  it("closes a single-note preview with Escape or its close action", async () => {
    const { user } = setup({ entries: [note("single", 10)] })
    const bookmark = screen.getByRole("button", { name: /Show feedback at 0:10/ })
    await user.click(bookmark)
    expect(bookmark).toHaveAttribute("aria-expanded", "true")
    await user.click(screen.getByRole("button", { name: "Close feedback preview" }))
    expect(bookmark).toHaveFocus()
    expect(screen.queryByRole("group", { name: "Feedback preview" })).not.toBeInTheDocument()
    await user.click(bookmark)
    await user.tab()
    await user.keyboard("{Escape}")
    expect(bookmark).toHaveFocus()
    expect(bookmark).toHaveAttribute("aria-expanded", "false")
  })

  it("selects individual bookmarks without seeking and exposes every overlapping note", async () => {
    const { user, onSelectFeedback, onSeek } = setup({ entries: [note("first", 10, 2), note("same time", 10, 5), note("later", 100)] })
    await user.click(screen.getByRole("button", { name: /Show feedback at 1:40/ }))
    expect(onSelectFeedback).not.toHaveBeenCalled()
    const preview = screen.getByRole("group", { name: "Feedback preview" })
    expect(within(preview).getByText("1 Review Note")).toBeInTheDocument()
    expect(within(preview).getByText("Observation")).toBeInTheDocument()
    expect(within(preview).getByText("Suggestion")).toBeInTheDocument()
    expect(within(preview).getByText("Improve")).toBeInTheDocument()
    await user.click(within(preview).getByRole("button", { name: /later/ }))
    expect(onSelectFeedback).toHaveBeenLastCalledWith("later")
    expect(onSeek).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: /Choose from 2 feedback notes/ }))
    const picker = screen.getByRole("group", { name: "Choose feedback note" })
    expect(within(picker).getByText("2 Review Notes")).toBeInTheDocument()
    await user.click(within(picker).getByRole("button", { name: /same time/ }))
    expect(onSelectFeedback).toHaveBeenLastCalledWith("same time")
    expect(screen.queryByRole("group", { name: "Choose feedback note" })).not.toBeInTheDocument()
  })
})
