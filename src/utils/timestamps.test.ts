import { describe, expect, it } from 'vitest'
import { convertTimestampDraftToSeconds, formatTimestamp } from './timestamps'

describe('convertTimestampDraftToSeconds', () => {
  it.each(['-1:00', '95', `${'9'.repeat(400)}:00`])('rejects invalid or overflowing minutes in %s', (input) => {
    expect(convertTimestampDraftToSeconds(input)).toBeNull()
  })
  it('accepts a minute value with or without a leading zero', () => {
    expect(convertTimestampDraftToSeconds('1:35')).toBe(95)
    expect(convertTimestampDraftToSeconds('01:35')).toBe(95)
  })
  it('returns null for invalid inputs', () => {
    expect(convertTimestampDraftToSeconds('invalid')).toBeNull()
    expect(convertTimestampDraftToSeconds('1:60')).toBeNull()
    expect(convertTimestampDraftToSeconds('1:5')).toBeNull()
    expect(convertTimestampDraftToSeconds('1:5a')).toBeNull()
    expect(convertTimestampDraftToSeconds('1:5.5')).toBeNull()
    expect(convertTimestampDraftToSeconds('')).toBeNull()
  })
  it('returns zero for 0:00', () => {
    expect(convertTimestampDraftToSeconds('0:00')).toBe(0)
  })
  it('accepts surrounding whitespace', () => {
    expect(convertTimestampDraftToSeconds('  1:35  ')).toBe(95)
  })
})

describe('formatTimestamp', () => {
  it.each([[0, '0:00'], [59, '0:59'], [60, '1:00'], [95, '1:35'], [600, '10:00']])(
    'formats %s seconds as %s', (seconds, expected) => {
      expect(formatTimestamp(seconds)).toBe(expected)
    },
  )
})
