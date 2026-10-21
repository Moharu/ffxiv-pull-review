import { describe, expect, it } from 'vitest'
import { validateFeedback } from './feedback'

const validFeedbackEntry = {
  id: '1',
  timestamp: 0,
  category: 'Mechanics' as const,
  observation: 'This is a valid observation.',
  suggestedImprovement: 'This is a valid suggested improvement.',
}

const testDuration = 20

describe('validateFeedback', () => {
  it('returns null for valid feedback', () => {
    expect(validateFeedback(validFeedbackEntry, testDuration)).toBeNull()
  })
  it('returns null for timestamp equal to duration', () => {
    const entryAtDuration = { ...validFeedbackEntry, timestamp: testDuration }
    expect(validateFeedback(entryAtDuration, testDuration)).toBeNull()
  })
  it('returns an error message for negative timestamp', () => {
    const invalidEntry = { ...validFeedbackEntry, timestamp: -1 }
    expect(validateFeedback(invalidEntry, testDuration)).toEqual(expect.any(String))
  })
  it('returns an error message for timestamp beyond duration', () => {
    const invalidEntry = { ...validFeedbackEntry, timestamp: testDuration + 1 }
    expect(validateFeedback(invalidEntry, testDuration)).toEqual(expect.any(String))
  })
  it('returns an error message for non-finite timestamp', () => {
    const invalidEntry = { ...validFeedbackEntry, timestamp: Infinity }
    expect(validateFeedback(invalidEntry, testDuration)).toEqual(expect.any(String))
  })
  it('returns an error message for NaN timestamp', () => {
    const invalidEntry = { ...validFeedbackEntry, timestamp: NaN }
    expect(validateFeedback(invalidEntry, testDuration)).toEqual(expect.any(String))
  })
  it('returns an error message for empty observation', () => {
    const invalidEntry = { ...validFeedbackEntry, observation: '   ' }
    expect(validateFeedback(invalidEntry, testDuration)).toEqual(expect.any(String))
  })
  it('returns an error message for empty suggested improvement', () => {
    const invalidEntry = { ...validFeedbackEntry, suggestedImprovement: '   ' }
    expect(validateFeedback(invalidEntry, testDuration)).toEqual(expect.any(String))
  })
  it('returns an error message for null duration', () => {
    expect(validateFeedback(validFeedbackEntry, null)).toEqual(expect.any(String))
  })
})
