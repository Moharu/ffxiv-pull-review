export type FeedbackCategory =
  | "Mechanics"
  | "Positioning"
  | "Rotation"
  | "Mitigation"
  | "Other"

export type FeedbackEntry = {
  id: string
  timestamp: number
  category: FeedbackCategory
  observation: string
  suggestedImprovement: string
}
