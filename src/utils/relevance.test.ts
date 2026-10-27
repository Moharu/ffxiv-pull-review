import { describe, expect, it } from "vitest"
import type { FeedbackEntry } from "../types"
import { isFeedbackRelevant, orderFeedback } from "./relevance"

const note = (id: string, timestamp: number): FeedbackEntry => ({ id, timestamp, importance: 3, category: "Mechanics", observation: id, suggestedImprovement: "Improve" })

describe("playback relevance", () => {
  it.each([[56.999, false], [57, true], [60, true], [74.999, true], [75, false]])("a 1:00 note at %s seconds is relevant: %s", (time, expected) => {
    expect(isFeedbackRelevant(60, time)).toBe(expected)
  })
  it("handles the start of a recording and invalid media times", () => {
    expect(isFeedbackRelevant(0, 0)).toBe(true)
    expect(isFeedbackRelevant(0, 15)).toBe(false)
    expect(isFeedbackRelevant(60, NaN)).toBe(false)
    expect(isFeedbackRelevant(Infinity, 60)).toBe(false)
  })
  it("promotes relevant notes stably without mutating data and restores timestamp order", () => {
    const entries = [note("early", 10), note("later", 60), note("tie", 60), note("latest", 100)]
    expect(orderFeedback(entries, new Set(["tie", "later"])).map((entry) => entry.id)).toEqual(["later", "tie", "early", "latest"])
    expect(orderFeedback(entries, new Set()).map((entry) => entry.id)).toEqual(["early", "later", "tie", "latest"])
    expect(entries.map((entry) => entry.id)).toEqual(["early", "later", "tie", "latest"])
  })
})
