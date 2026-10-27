import { createContext, useContext } from "react"

export type ReviewWorkspaceState = {
  focused: boolean
  notesOpen: boolean
  setNotesOpen: (open: boolean) => void
  toggleFullscreen: () => Promise<void>
  showContext: () => void
}

export const ReviewWorkspaceContext = createContext<ReviewWorkspaceState | null>(null)
export const useReviewWorkspace = () => useContext(ReviewWorkspaceContext)
