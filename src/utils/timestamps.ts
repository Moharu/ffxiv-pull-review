export function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

export function convertTimestampDraftToSeconds(draft: string): number | null {
  const match = /^(\d+):([0-5]\d)$/.exec(draft.trim())

  if (!match) return null

  const seconds = Number(match[1]) * 60 + Number(match[2])

  if (!Number.isFinite(seconds)) return null

  return seconds
}
