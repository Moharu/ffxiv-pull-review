import type { FeedbackEntry, RecordingContext } from "./types"

export const demoVideoUrl = "https://yn21hyny7o36qgrh.public.blob.vercel-storage.com/Demo%20M9S%20vod.mp4"
export const demoContext: RecordingContext = {
  encounter: "Vamp Fatale - M9S",
  playerName: "Moharu Nn",
  playerJob: "Sage",
  pullNotes: "Congratulations on the clear!",
}

// Sample feedback supplied by the recording's owner.
export function createDemoFeedback(): FeedbackEntry[] {
  return [
    {
      id: "demo-rotation", timestamp: 67, importance: 2, category: "Rotation",
      observation: "Dosis reapplication",
      suggestedImprovement: "Don't refresh dot here because the boss will become untargetable",
    },
    {
      id: "demo-mitigation", timestamp: 306, importance: 5, category: "Mitigation",
      observation: "Dangerous Raidwide",
      suggestedImprovement: "Zoe Shield would be ideal here",
    },
  ]
}
