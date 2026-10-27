import { describe, expect, it } from "vitest"
import type { FeedbackEntry } from "../types"
import { groupTimelineEntries } from "./timeline"

const note = (id: string, timestamp: number): FeedbackEntry => ({ id, timestamp, importance: 3, category: "Mechanics", observation: id, suggestedImprovement: "Improve" })

describe("timeline grouping", () => {
  it("sorts without mutating entries and includes both recording boundaries", () => {
    const entries = [note("end", 100), note("start", 0), note("middle", 50)]
    expect(groupTimelineEntries(entries, 100, 600).map((group) => group.timestamp)).toEqual([0, 50, 100])
    expect(entries.map((entry) => entry.id)).toEqual(["end", "start", "middle"])
  })

  it("keeps duplicate and nearby notes selectable, grouping according to available width", () => {
    const entries = [note("first", 10), note("duplicate", 10), note("nearby", 18), note("later", 90)]
    expect(groupTimelineEntries(entries, 100, 300).map((group) => group.entries.map((entry) => entry.id)))
      .toEqual([["first", "duplicate", "nearby"], ["later"]])
    expect(groupTimelineEntries(entries, 100, 1000).map((group) => group.entries.map((entry) => entry.id)))
      .toEqual([["first", "duplicate"], ["nearby"], ["later"]])
  })

  it("omits invalid durations and notes outside the loaded recording", () => {
    const entries = [note("negative", -1), note("beyond", 101), note("nan", NaN), note("valid", 50)]
    expect(groupTimelineEntries(entries, null, 600)).toEqual([])
    expect(groupTimelineEntries(entries, 0, 600)).toEqual([])
    expect(groupTimelineEntries(entries, Infinity, 600)).toEqual([])
    expect(groupTimelineEntries(entries, 100, 600).flatMap((group) => group.entries.map((entry) => entry.id))).toEqual(["valid"])
  })
})
