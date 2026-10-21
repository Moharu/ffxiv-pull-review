import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VideoReview from './VideoReview'

beforeEach(() => {
  // jsdom does not decode video. Supply only the browser APIs needed by this flow.
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(60)
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(1)
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL() { return 'blob:test-recording' }
    static revokeObjectURL() {}
  })
})

afterEach(() => {
  // Unmount while the media stubs still exist so effect cleanup can use them.
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function setupRecording() {
  const user = userEvent.setup()
  const { container } = render(<VideoReview />)
  await user.upload(screen.getByLabelText('Select a local video'),
    new File(['sample'], 'raid.mp4', { type: 'video/mp4' }))
  // Video has no implicit accessibility role. Metadata is a browser event, not a user action.
  const video = container.querySelector('video')!
  fireEvent.loadedMetadata(video)
  return { user, video }
}

async function addNote(user: ReturnType<typeof userEvent.setup>, video: HTMLVideoElement, seconds: number, observation: string) {
  video.currentTime = seconds
  await user.click(screen.getByRole('button', { name: 'Capture timestamp' }))
  await user.type(screen.getByRole('textbox', { name: 'Observation' }), observation)
  await user.type(screen.getByRole('textbox', { name: 'Suggested improvement' }), 'Move on the cast.')
  await user.click(screen.getByRole('button', { name: 'Add feedback' }))
}

function savedRows() {
  // Exclude the header and the new-entry row by selecting rows with an edit action.
  return screen.getAllByRole('row').filter((row) =>
    within(row).queryByRole('button', { name: /^Edit feedback at/ }) !== null)
}

describe('VideoReview feedback mutations', () => {
  it('saves only the selected entry, preserves its identity, and reorders after a time change', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'First note')
    await addNote(user, video, 30, 'Second note')
    const originalRow = savedRows()[1]

    await user.click(within(originalRow).getByRole('button', { name: 'Edit feedback at 0:30: Second note' }))
    const observation = within(originalRow).getByRole('textbox', { name: 'Observation' })
    await user.clear(observation)
    await user.type(observation, 'Updated second note')
    const time = within(originalRow).getByRole('textbox', { name: 'Timestamp (m:ss)' })
    await user.clear(time)
    await user.type(time, '0:05')
    await user.click(within(originalRow).getByRole('button', { name: 'Save' }))

    const rows = savedRows()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toBe(originalRow)
    expect(rows[0]).toHaveTextContent('Updated second note')
    expect(rows[1]).toHaveTextContent('First note')
    expect(within(rows[0]).getByRole('button', { name: 'Edit feedback at 0:05: Updated second note' })).toHaveFocus()
    await user.click(within(rows[0]).getByRole('button', { name: 'Seek to 0:05' }))
    expect(video.currentTime).toBe(5)
  })

  it('keeps insertion order for equal timestamps, including after editing', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'First note')
    await addNote(user, video, 10, 'Second note')
    // Matching timestamps must still have distinguishable edit/remove names.
    expect(screen.getByRole('button', { name: 'Edit feedback at 0:10: First note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit feedback at 0:10: Second note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove feedback at 0:10: First note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove feedback at 0:10: Second note' })).toBeInTheDocument()
    const secondRow = savedRows()[1]
    await user.click(within(secondRow).getByRole('button', { name: 'Edit feedback at 0:10: Second note' }))
    await user.click(within(secondRow).getByRole('button', { name: 'Save' }))
    expect(savedRows()[0]).toHaveTextContent('First note')
    expect(savedRows()[1]).toHaveTextContent('Second note')
  })

  it.each(['1:60', '1:01'])('rejects timestamp %s without losing the draft or changing saved data', async (invalidTime) => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'Original note')
    const row = savedRows()[0]
    await user.click(within(row).getByRole('button', { name: 'Edit feedback at 0:10: Original note' }))
    const time = within(row).getByRole('textbox', { name: 'Timestamp (m:ss)' })
    await user.clear(time)
    await user.type(time, invalidTime)
    await user.click(within(row).getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(within(row).getByRole('textbox', { name: 'Timestamp (m:ss)' })).toHaveValue(invalidTime)
    await user.click(within(row).getByRole('button', { name: 'Cancel' }))
    expect(within(row).getByRole('button', { name: 'Seek to 0:10' })).toBeInTheDocument()
    expect(row).toHaveTextContent('Original note')
  })

  it('rejects whitespace-only edits and retains the original after cancellation', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'Original note')
    const row = savedRows()[0]
    await user.click(within(row).getByRole('button', { name: 'Edit feedback at 0:10: Original note' }))
    const observation = within(row).getByRole('textbox', { name: 'Observation' })
    await user.clear(observation)
    await user.type(observation, '   ')
    await user.click(within(row).getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(within(row).getByRole('textbox', { name: 'Observation' })).toHaveValue('   ')
    await user.click(within(row).getByRole('button', { name: 'Cancel' }))
    expect(row).toHaveTextContent('Original note')
  })

  it('cancels removal, then deletes only the confirmed entry and handles the last entry', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'First note')
    await addNote(user, video, 20, 'Second note')
    await user.click(screen.getByRole('button', { name: 'Remove feedback at 0:10: First note' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(savedRows()).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Remove feedback at 0:10: First note' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Remove feedback at 0:10: First note' }))
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(savedRows()).toHaveLength(1)
    expect(savedRows()[0]).toHaveTextContent('Second note')
    expect(screen.queryByRole('cell', { name: 'First note' })).not.toBeInTheDocument()
    expect(screen.getByText('Feedback entries: 1', { exact: true })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Remove feedback at 0:20: Second note' }))
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByRole('button', { name: /^Edit feedback at/ })).not.toBeInTheDocument()
    expect(screen.getByText('No feedback yet. Capture a timestamp and add a note to begin.')).toBeInTheDocument()
    expect(screen.getByText('Feedback entries: 0', { exact: true })).toHaveFocus()
  })
})
