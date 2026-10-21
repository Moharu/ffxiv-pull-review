export const feedbackCategories = [
  "Mechanics",
  "Positioning",
  "Rotation",
  "Mitigation",
  "Other",
] as const

export type FeedbackCategory = (typeof feedbackCategories)[number]

export type FeedbackEntry = {
  id: string
  timestamp: number
  category: FeedbackCategory
  observation: string
  suggestedImprovement: string
}
