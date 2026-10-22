import { describe, expect, it } from "vitest"
import { getRecordingIdentity, matchesRecording } from "./recording"

const identity = { name: "raid.mp4", size: 100, lastModified: 123456 }

describe("recording metadata", () => {
  it("extracts only serializable file metadata", () => {
    const file = new File(["video"], "raid.mp4", { lastModified: 123456 })
    expect(getRecordingIdentity(file)).toEqual({
      name: "raid.mp4", size: 5, lastModified: 123456,
    })
  })

  it("matches separately created identities with equal metadata", () => {
    expect(matchesRecording(identity, { ...identity })).toBe(true)
  })

  it.each([
    { ...identity, name: "renamed.mp4" },
    { ...identity, size: 101 },
    { ...identity, lastModified: 123457 },
  ])("rejects a difference in any identity field: %j", (selected) => {
    expect(matchesRecording(identity, selected)).toBe(false)
  })
})
