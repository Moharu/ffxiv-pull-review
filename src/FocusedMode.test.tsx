import { useReviewWorkspace } from "./ReviewWorkspaceContext"
import ReviewWorkspace from "./ReviewWorkspace"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"

const originalFullscreen = Object.getOwnPropertyDescriptor(document, "fullscreenElement")
const originalExit = Object.getOwnPropertyDescriptor(document, "exitFullscreen")

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(420)
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(4)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
  if (originalFullscreen) Object.defineProperty(document, "fullscreenElement", originalFullscreen)
  else Reflect.deleteProperty(document, "fullscreenElement")
  if (originalExit) Object.defineProperty(document, "exitFullscreen", originalExit)
  else Reflect.deleteProperty(document, "exitFullscreen")
})

async function setup() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole("button", { name: "Try demo recording" }))
  const workspace = screen.getByRole("region", { name: "Demo review" })
  const video = workspace.querySelector("video")!
  fireEvent.loadedMetadata(video)
  const controls = within(workspace).getByRole("group", { name: "Video controls" })
  return { user, workspace, video, controls }
}

function IdleControls() {
  const context = useReviewWorkspace()!
  return <button onClick={() => { void context.toggleFullscreen() }}>Enter test mode</button>
}

describe("focused mode", () => {
  it("keeps the player, playback position, and drafts through collapse and mode changes", async () => {
    const { user, workspace, video, controls } = await setup()
    video.currentTime = 123
    await user.click(within(workspace).getByRole("button", { name: "Add Feedback" }))
    await user.type(within(workspace).getByRole("textbox", { name: "Observation" }), "Keep this draft")
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    expect(workspace).toHaveClass("is-focused")
    expect(workspace.querySelector("video")).toBe(video)
    expect(video.currentTime).toBe(123)
    await user.click(within(workspace).getByRole("button", { name: "Hide review notes" }))
    expect(workspace.querySelector(".feedback-pane")).toHaveAttribute("inert")
    await user.click(within(workspace).getByRole("button", { name: "Show review notes" }))
    expect(within(workspace).getByRole("textbox", { name: "Observation" })).toHaveValue("Keep this draft")
    await user.click(within(workspace).getByRole("button", { name: "Hide review notes" }))
    expect(within(workspace).getByRole("button", { name: "Show review notes" })).toHaveFocus()
    await user.click(within(workspace).getByRole("button", { name: "Show review notes" }))
    await user.click(within(controls).getByRole("button", { name: "Exit fullscreen" }))
    expect(workspace).not.toHaveClass("is-focused")
    expect(workspace.querySelector("video")).toBe(video)
    expect(video.currentTime).toBe(123)
    expect(within(workspace).getByRole("textbox", { name: "Observation" })).toHaveValue("Keep this draft")
  })

  it("opens the drawer by default on every fullscreen entry", async () => {
    const { user, workspace, controls } = await setup()
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    await user.click(within(workspace).getByRole("button", { name: "Hide review notes" }))
    await user.click(within(controls).getByRole("button", { name: "Exit fullscreen" }))
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    expect(workspace.querySelector(".notes-drawer")).toHaveAttribute("data-open", "true")
    expect(workspace.querySelector(".feedback-pane")).not.toHaveAttribute("inert")
  })

  it("reopens collapsed notes when a timeline preview card is selected", async () => {
    const { user, workspace, controls } = await setup()
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    await user.click(within(workspace).getByRole("button", { name: "Hide review notes" }))
    await user.click(within(workspace).getByRole("button", { name: /Show feedback at 1:07/ }))
    const preview = within(workspace).getByRole("group", { name: "Feedback preview" })
    await user.click(within(preview).getByRole("button", { name: /Dosis reapplication/ }))
    expect(workspace.querySelector(".feedback-pane")).not.toHaveAttribute("inert")
    expect(within(workspace).getByRole("cell", { name: "Dosis reapplication" }).closest("tr")).toHaveFocus()
  })

  it("promotes and highlights notes only during focused playback and expires exactly at +15s", async () => {
    const { user, workspace, controls, video } = await setup()
    vi.spyOn(video, "paused", "get").mockReturnValue(false)
    const order = () => [...workspace.querySelectorAll(".feedback-row")].map((row) => row.textContent)
    video.currentTime = 303
    fireEvent.play(video)
    expect(workspace.querySelector("[data-relevant]")).toBeNull()
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    expect(order()[0]).toContain("Dangerous Raidwide")
    expect(workspace.querySelector("[data-relevant]")).toHaveTextContent("Dangerous Raidwide")
    video.currentTime = 320.999
    fireEvent.timeUpdate(video)
    expect(order()[0]).toContain("Dangerous Raidwide")
    video.currentTime = 321
    fireEvent.timeUpdate(video)
    expect(workspace.querySelector("[data-relevant]")).toBeNull()
    expect(order()[0]).toContain("Dosis reapplication")
    video.currentTime = 303
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(workspace.querySelector("[data-relevant]")).toBeNull()
    expect(order()[0]).toContain("Dosis reapplication")
  })

  it("keeps fullscreen exit available when the recording becomes unplayable", async () => {
    const { user, workspace, controls, video } = await setup()
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    Object.defineProperty(video, "error", { configurable: true, value: { code: 2 } })
    fireEvent.error(video)
    expect(within(controls).getByRole("button", { name: "Exit fullscreen" })).toBeEnabled()
    await user.click(within(controls).getByRole("button", { name: "Exit fullscreen" }))
    expect(workspace).not.toHaveClass("is-focused")
  })

  it("updates relevance without moving an editor, then resumes ordering on cancel", async () => {
    const { user, workspace, controls, video } = await setup()
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    await user.click(within(workspace).getByRole("button", { name: /^Edit feedback at 1:07/ }))
    const observation = within(workspace).getByRole("textbox", { name: "Observation" })
    await user.type(observation, " — draft")
    vi.spyOn(video, "paused", "get").mockReturnValue(false)
    video.currentTime = 303
    fireEvent.play(video)
    expect(observation).toHaveFocus()
    expect(workspace.querySelector(".feedback-row")).toHaveClass("feedback-editor")
    expect(workspace.querySelector("[data-relevant]")).toHaveTextContent("Dangerous Raidwide")
    await user.click(within(workspace).getByRole("button", { name: "Cancel" }))
    expect(workspace.querySelector(".feedback-row")).toHaveTextContent("Dangerous Raidwide")
  })

  it("handles native fullscreen exit and falls back cleanly after a denied request", async () => {
    const { user, workspace, controls } = await setup()
    let nativeElement: Element | null = null
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => nativeElement })
    const request = vi.fn(async () => {
      nativeElement = workspace
      fireEvent(document, new Event("fullscreenchange"))
    })
    Object.defineProperty(workspace, "requestFullscreen", { configurable: true, value: request })
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    expect(request).toHaveBeenCalledOnce()
    expect(workspace).toHaveClass("is-focused")
    nativeElement = null
    fireEvent(document, new Event("fullscreenchange"))
    expect(workspace).not.toHaveClass("is-focused")
    request.mockRejectedValueOnce(new DOMException("Denied", "NotAllowedError"))
    await user.click(within(controls).getByRole("button", { name: "Enter fullscreen" }))
    expect(workspace).toHaveClass("is-focused")
    await user.keyboard("{Escape}")
    expect(workspace).not.toHaveClass("is-focused")
  })

  it("hides idle context and reveals it on pointer movement", () => {
    vi.useFakeTimers()
    render(<ReviewWorkspace label="Test workspace"><div className="context-panel"><h2>Context</h2></div><IdleControls /></ReviewWorkspace>)
    fireEvent.click(screen.getByRole("button", { name: "Enter test mode" }))
    const workspace = screen.getByRole("region", { name: "Test workspace" })
    expect(workspace).toHaveAttribute("data-context-visible")
    act(() => vi.advanceTimersByTime(2201))
    expect(workspace).not.toHaveAttribute("data-context-visible")
    fireEvent.pointerMove(workspace)
    expect(workspace).toHaveAttribute("data-context-visible")
  })
})
