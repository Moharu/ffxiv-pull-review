export const feedbackCategories = [
  "Mechanics",
  "Positioning",
  "Rotation",
  "Mitigation",
  "Other",
] as const

export type FeedbackCategory = (typeof feedbackCategories)[number]

export const importanceLevels = [1, 2, 3, 4, 5] as const
export type Importance = (typeof importanceLevels)[number]
export const importanceLabels: Record<Importance, string> = {
  1: "Low",
  2: "Minor",
  3: "Moderate",
  4: "High",
  5: "Critical",
}

export type FeedbackEntry = {
  id: string
  timestamp: number
  importance: Importance
  category: FeedbackCategory
  observation: string
  suggestedImprovement: string
}

export type RecordingContext = {
  encounter: string
  playerName: string
  playerJob: string
  pullNotes: string
}

export type RecordingIdentity = {
  name: string
  size: number
  lastModified: number
}

export type SavedReview = {
  version: 2
  recording: RecordingIdentity | null
  context: RecordingContext | null
  feedbackEntries: FeedbackEntry[]
}
