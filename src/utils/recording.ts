import type { RecordingIdentity } from "../types"

export function getRecordingIdentity(file: File): RecordingIdentity {
  return {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
  }
}

// Metadata provides a likely match, not proof that the file contents are equal.
export function matchesRecording(
  saved: RecordingIdentity,
  selected: RecordingIdentity,
): boolean {
  return saved.name === selected.name &&
    saved.size === selected.size &&
    saved.lastModified === selected.lastModified
}
