import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import FeedbackTimeline from "./FeedbackTimeline"
import type { FeedbackEntry } from "./types"

const entry: FeedbackEntry = { id: "active", timestamp: 60, importance: 4, category: "Mechanics", observation: "Active observation", suggestedImprovement: "Active suggestion" }

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

function pointer(type: string, x: number, y = 10) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { clientX: x, clientY: y, pointerType: "mouse", pointerId: 1 })
  return event
}

describe("automatic bookmark previews", () => {
  it("keeps hover alive across the gap and expires it 450ms after leaving", () => {
    vi.useFakeTimers()
    render(<FeedbackTimeline currentTime={0} duration={120} disabled={false} entries={[entry]} onSeek={vi.fn()} onSelectFeedback={vi.fn()} />)
    const axis = screen.getByRole("slider", { name: "Playback position" }).parentElement!
    vi.spyOn(axis, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 600, 28))
    const bookmark = screen.getByRole("button", { name: /Show feedback at 1:00/ }).parentElement!
    fireEvent(axis, pointer("pointermove", 300))
    fireEvent.pointerLeave(axis)
    act(() => vi.advanceTimersByTime(300))
    expect(bookmark).toHaveClass("bookmark-hovered")
    fireEvent.pointerEnter(bookmark)
    act(() => vi.advanceTimersByTime(600))
    expect(bookmark).toHaveClass("bookmark-hovered")
    fireEvent.pointerLeave(bookmark)
    act(() => vi.advanceTimersByTime(451))
    expect(bookmark).not.toHaveClass("bookmark-hovered")
  })

  it("taps a marker to open its preview but scrubs when dragging from the same spot", () => {
    const onSeek = vi.fn()
    render(<FeedbackTimeline currentTime={0} duration={120} disabled={false} entries={[entry]} onSeek={onSeek} onSelectFeedback={vi.fn()} />)
    const slider = screen.getByRole("slider", { name: "Playback position" })
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 600, 28))
    fireEvent(slider, pointer("pointerdown", 300))
    fireEvent(slider, pointer("pointerup", 300))
    expect(screen.getByRole("group", { name: "Feedback preview" })).toBeInTheDocument()
    expect(onSeek).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Close feedback preview" }))
    fireEvent(slider, pointer("pointerdown", 300))
    fireEvent(slider, pointer("pointermove", 400))
    fireEvent(slider, pointer("pointerup", 400))
    expect(onSeek).toHaveBeenLastCalledWith(80)
    expect(screen.queryByRole("group", { name: "Feedback preview" })).not.toBeInTheDocument()
  })

  it("opens relevant previews without focusing them, expires, and permits dismissal until the next window", async () => {
    const user = userEvent.setup()
    const props = { currentTime: 57, duration: 120, disabled: false, entries: [entry], onSeek: vi.fn(), onSelectFeedback: vi.fn() }
    const { rerender } = render(<FeedbackTimeline {...props} relevantIds={new Set([entry.id])} />)
    expect(screen.getByRole("group", { name: "Feedback preview" })).toHaveTextContent("Active observation")
    expect(props.onSelectFeedback).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Close feedback preview" }))
    expect(screen.queryByRole("group", { name: "Feedback preview" })).not.toBeInTheDocument()
    rerender(<FeedbackTimeline {...props} relevantIds={new Set([entry.id])} />)
    expect(screen.queryByRole("group", { name: "Feedback preview" })).not.toBeInTheDocument()
    rerender(<FeedbackTimeline {...props} relevantIds={new Set()} />)
    rerender(<FeedbackTimeline {...props} relevantIds={new Set([entry.id])} />)
    expect(screen.getByRole("group", { name: "Feedback preview" })).toBeInTheDocument()
    rerender(<FeedbackTimeline {...props} relevantIds={new Set()} />)
    expect(screen.queryByRole("group", { name: "Feedback preview" })).not.toBeInTheDocument()
  })
})
