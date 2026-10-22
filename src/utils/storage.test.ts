import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyReview, isSavedReview, loadReview, REVIEW_STORAGE_KEY, saveReview } from './storage'
import type { SavedReview } from '../types'

const review: SavedReview = {
  version: 2,
  recording: { name: 'raid.mp4', size: 100, lastModified: 123456 },
  context: { encounter: 'Raid', playerName: 'Player', playerJob: 'Paladin', pullNotes: '' },
  feedbackEntries: [{ id: 'note-1', timestamp: 10, importance: 4, category: 'Mechanics', observation: 'Late movement', suggestedImprovement: 'Move earlier' }],
}

afterEach(() => vi.restoreAllMocks())

describe('review storage', () => {
  it('migrates version 1 by dropping title while preserving context, identity, and notes', () => {
    const legacy = { ...review, version: 1, context: { ...review.context, title: 'Old title' } }
    const raw = JSON.stringify(legacy)
    localStorage.setItem(REVIEW_STORAGE_KEY, raw)
    const loaded = loadReview()
    expect(loaded).toEqual({ review, error: null })
    // Reading/migration itself is side-effect free; the App effect performs the write.
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe(raw)
    expect(saveReview(loaded.review)).toBeNull()
    expect(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!)).toEqual(review)
  })

  it('migrates an empty version-1 review', () => {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({ ...createEmptyReview(), version: 1 }))
    expect(loadReview()).toEqual({ review: createEmptyReview(), error: null })
  })

  it('preserves invalid legacy data instead of treating migration as recovery', () => {
    const raw = JSON.stringify({ ...review, version: 1, context: { ...review.context, title: 'Old title' },
      feedbackEntries: [{ ...review.feedbackEntries[0], importance: 9 }] })
    localStorage.setItem(REVIEW_STORAGE_KEY, raw)
    expect(loadReview().error).toEqual(expect.any(String))
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe(raw)
  })

  it('returns a fresh empty review when nothing has been stored', () => {
    expect(loadReview()).toEqual({ review: createEmptyReview(), error: null })
  })

  it('round trips context, recording identity, and feedback including importance', () => {
    expect(saveReview(review)).toBeNull()
    expect(loadReview()).toEqual({ review, error: null })
  })

  it.each(['not json', JSON.stringify({ ...review, version: 99 }), JSON.stringify({ version: 1 })])(
    'keeps malformed or unsupported data untouched: %s', (raw) => {
      localStorage.setItem(REVIEW_STORAGE_KEY, raw)
      expect(loadReview().error).toEqual(expect.any(String))
      expect(loadReview().review).toEqual(createEmptyReview())
      expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe(raw)
    },
  )

  it.each([
    { ...review, recording: { ...review.recording, size: -1 } },
    { ...review, recording: null },
    { ...review, context: { ...review.context, encounter: '   ' } },
    { ...review, feedbackEntries: [review.feedbackEntries[0], review.feedbackEntries[0]] },
    ...[0, 6, 2.5, '3', null].map((importance) => ({ ...review, feedbackEntries: [{ ...review.feedbackEntries[0], importance }] })),
    ...[-1, 1.5, '10', null].map((timestamp) => ({ ...review, feedbackEntries: [{ ...review.feedbackEntries[0], timestamp }] })),
    { ...review, feedbackEntries: [{ ...review.feedbackEntries[0], category: 'Unknown' }] },
    { ...review, feedbackEntries: [{ ...review.feedbackEntries[0], observation: '   ' }] },
  ])('rejects invalid fields and duplicate IDs', (invalid) => {
    expect(isSavedReview(invalid)).toBe(false)
  })

  it('reports blocked reads without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    expect(loadReview().error).toEqual(expect.any(String))
  })

  it('reports failed writes without replacing previous storage or changing memory', () => {
    localStorage.setItem(REVIEW_STORAGE_KEY, 'previous value')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
    expect(saveReview(review)).toEqual(expect.any(String))
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe('previous value')
    expect(review.feedbackEntries[0].importance).toBe(4)
  })

  it('only serializes the intended fields, ignoring accidental extra runtime properties', () => {
    expect(saveReview({ ...review, videoUrl: 'blob:temporary', file: new File(['x'], 'raid.mp4') } as SavedReview)).toBeNull()
    expect(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!)).toEqual(review)
  })
})
