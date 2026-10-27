import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { ReviewWorkspaceContext } from "./ReviewWorkspaceContext"

function ReviewWorkspace({ children, label, hidden = false }: { children: ReactNode; label: string; hidden?: boolean }) {
  const containerRef = useRef<HTMLElement | null>(null)
  const nativeSession = useRef(false)
  const transitioning = useRef(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [focused, setFocused] = useState(false)
  const [notesOpen, setNotesOpen] = useState(true)
  const [headerVisible, setHeaderVisible] = useState(true)

  function revealContext() {
    setHeaderVisible(true)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setHeaderVisible(false), 2200)
  }

  function updateNotesOpen(open: boolean) {
    if (!open && containerRef.current?.querySelector(".feedback-pane")?.contains(document.activeElement)) {
      containerRef.current.querySelector<HTMLElement>(".notes-toggle")?.focus({ preventScroll: true })
    }
    setNotesOpen(open)
  }

  function restoreFocus() {
    const target = triggerRef.current?.isConnected ? triggerRef.current : containerRef.current?.querySelector<HTMLElement>(".fullscreen-control")
    target?.focus({ preventScroll: true })
  }

  async function toggleFullscreen() {
    const container = containerRef.current
    if (!container || transitioning.current) return
    transitioning.current = true
    try {
      if (focused) {
        if (document.fullscreenElement === container && document.exitFullscreen) {
          try { await document.exitFullscreen() } catch { return }
        }
        nativeSession.current = false
        setFocused(false)
        restoreFocus()
        return
      }
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setNotesOpen(true)
      setFocused(true)
      revealContext()
      if (container.requestFullscreen && document.fullscreenEnabled !== false) {
        try {
          await container.requestFullscreen()
          nativeSession.current = document.fullscreenElement === container
        } catch {
          // The same workspace remains usable as a viewport-filling fallback.
        }
      }
    } finally {
      transitioning.current = false
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === containerRef.current) {
        nativeSession.current = true
      } else if (nativeSession.current) {
        nativeSession.current = false
        setFocused(false)
        restoreFocus()
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!focused) return
    const previousOverflow = document.body.style.overflow
    const outside: { element: HTMLElement; inert: boolean }[] = []
    for (let node = containerRef.current; node && node !== document.body; node = node.parentElement) {
      for (const sibling of node.parentElement?.children ?? []) {
        if (sibling instanceof HTMLElement && sibling !== node) {
          outside.push({ element: sibling, inert: sibling.hasAttribute("inert") })
          sibling.setAttribute("inert", "")
        }
      }
    }
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
      outside.forEach(({ element, inert }) => { element.toggleAttribute("inert", inert) })
    }
  }, [focused])

  return <ReviewWorkspaceContext value={{ focused, notesOpen, setNotesOpen: updateNotesOpen, toggleFullscreen, showContext: () => {
    revealContext()
    containerRef.current?.querySelector<HTMLElement>(".context-panel h2")?.focus({ preventScroll: true })
  } }}>
    <section ref={containerRef} hidden={hidden} aria-label={label}
      className={`review-panel${focused ? " is-focused" : ""}${notesOpen ? "" : " notes-collapsed"}`}
      data-context-visible={headerVisible || undefined}
      onPointerMove={() => { if (focused) revealContext() }}
      onPointerDown={(event) => { if (focused && event.pointerType === "touch") revealContext() }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && focused && !document.fullscreenElement) {
          event.preventDefault()
          setFocused(false)
          restoreFocus()
        }
      }}>
      {children}
    </section>
  </ReviewWorkspaceContext>
}

export default ReviewWorkspace
