import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

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
  const { container } = render(<App />)
  await user.upload(screen.getByLabelText('Select a local video'),
    new File(['sample'], 'raid.mp4', { type: 'video/mp4', lastModified: 123456 }))
  // Video has no implicit accessibility role. Metadata is a browser event, not a user action.
  const video = container.querySelector('video')!
  fireEvent.loadedMetadata(video)
  await user.type(screen.getByRole('textbox', { name: /Encounter/ }), 'Test encounter')
  await user.type(screen.getByRole('textbox', { name: /Player name/ }), 'POV player')
  await user.selectOptions(screen.getByRole('combobox', { name: /Player job/ }), 'Paladin')
  await user.click(screen.getByRole('button', { name: 'Start review' }))
  return { user, video }
}

async function addNote(user: ReturnType<typeof userEvent.setup>, video: HTMLVideoElement, seconds: number, observation: string) {
  video.currentTime = seconds
  await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
  await user.type(screen.getByRole('textbox', { name: 'Observation' }), observation)
  await user.type(screen.getByRole('textbox', { name: 'Suggested improvement' }), 'Move on the cast.')
  await user.click(screen.getByRole('button', { name: 'Save' }))
}

function savedRows() {
  // Exclude the header and the new-entry row by selecting rows with an edit action.
  return screen.getAllByRole('row').filter((row) =>
    within(row).queryByRole('button', { name: /^Edit feedback at/ }) !== null)
}

describe('VideoReview feedback mutations', () => {
  it('switches recordings freely before saving review data, including after refresh', async () => {
    const user = userEvent.setup()
    const firstRender = render(<App />)
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['first'], 'first.mp4', { type: 'video/mp4' }))
    await user.type(screen.getByRole('textbox', { name: /Encounter/ }), 'Unsaved encounter')
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['second'], 'second.mp4', { type: 'video/mp4' }))
    expect(screen.queryByRole('group', { name: /does not match/ })).not.toBeInTheDocument()
    expect(screen.getByText('Selected: second.mp4')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Encounter/ })).toHaveValue('Unsaved encounter')
    firstRender.unmount()
    render(<App />)
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['third'], 'third.mp4', { type: 'video/mp4' }))
    expect(screen.queryByRole('group', { name: /does not match/ })).not.toBeInTheDocument()
    expect(screen.getByText('Selected: third.mp4')).toBeInTheDocument()
  })

  it('protects saved context even when no feedback has been added', async () => {
    const { user } = await setupRecording()
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['replacement'], 'replacement.mp4', { type: 'video/mp4' }))
    expect(screen.getByRole('group', { name: /does not match/ })).toBeInTheDocument()
    expect(screen.queryByText('Selected: replacement.mp4')).not.toBeInTheDocument()
  })

  it('leaves volume controls available for local recordings', async () => {
    const { video } = await setupRecording()
    expect(video.muted).toBe(false)
    video.volume = 0.5
    fireEvent.volumeChange(video)
    expect(video.volume).toBe(0.5)
    expect(video.muted).toBe(false)
  })

  it('keeps local and demo draft labels and form ownership separate', async () => {
    const { user } = await setupRecording()
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    await user.type(screen.getByRole('textbox', { name: 'Observation' }), 'Local draft')
    await user.click(screen.getByRole('button', { name: 'Try demo recording' }))
    const demo = screen.getByRole('region', { name: 'Demo review' })
    fireEvent.loadedMetadata(demo.querySelector('video')!)
    await user.click(within(demo).getByRole('button', { name: 'Add Feedback' }))
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id)
    expect(new Set(ids).size).toBe(ids.length)
    const observation = within(demo).getByRole('textbox', { name: 'Observation' }) as HTMLTextAreaElement
    expect(observation.form).toBe(within(demo).getByRole('form', { name: 'Add feedback' }))
    await user.type(observation, 'Demo draft')
    await user.keyboard('{Escape}')
    expect(within(demo).queryByRole('textbox', { name: 'Observation' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Return to my review' }))
    expect(screen.getByRole('textbox', { name: 'Observation' })).toHaveValue('Local draft')
  })

  it('pauses the local player for the demo and preserves the selected file and feedback on return', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'My local note')
    video.currentTime = 25
    const stored = localStorage.getItem('ffxiv-pull-review')
    const pause = vi.spyOn(video, 'pause')
    await user.click(screen.getByRole('button', { name: 'Try demo recording' }))
    expect(pause).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Return to my review' }))
    expect(screen.getByRole('cell', { name: 'My local note' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Raid review' }).querySelector('video')).toBe(video)
    expect(video.currentTime).toBe(25)
    expect(localStorage.getItem('ffxiv-pull-review')).toBe(stored)
  })

  it('requires valid context and playable video before starting, then shows a compact header', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.type(screen.getByRole('textbox', { name: /Encounter/ }), '   ')
    await user.type(screen.getByRole('textbox', { name: /Player name/ }), 'Player')
    await user.selectOptions(screen.getByRole('combobox', { name: /Player job/ }), 'Sage')
    expect(screen.getByRole('button', { name: 'Start review' })).toBeDisabled()
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['sample'], 'raid.mp4', { type: 'video/mp4' }))
    expect(screen.getByRole('button', { name: 'Start review' })).toBeDisabled()
    const video = container.querySelector('video')!
    fireEvent.loadedMetadata(video)
    await user.click(screen.getByRole('button', { name: 'Start review' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an encounter')
    const encounter = screen.getByRole('textbox', { name: /Encounter/ })
    await user.clear(encounter)
    await user.type(encounter, 'Raid encounter')
    await user.click(screen.getByRole('button', { name: 'Start review' }))
    expect(screen.getByRole('heading', { name: 'Raid encounter' })).toHaveFocus()
    expect(screen.getByText('Player · Sage')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Encounter/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Feedback' })).toBeEnabled()
    expect(container.querySelector('video')).toBe(video)
  })

  it('blocks starting a review when the selected video fails', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['bad'], 'bad.mp4', { type: 'video/mp4' }))
    const video = container.querySelector('video')!
    Object.defineProperty(video, 'error', { configurable: true, value: { code: 4 } })
    fireEvent.error(video)
    expect(screen.getByRole('alert')).toHaveTextContent('could not be played')
    expect(screen.getByRole('button', { name: 'Start review' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Add Feedback' })).not.toBeInTheDocument()
  })

  it('reconnects matching metadata and preserves notes', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'Keep this note')
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['sample'], 'raid.mp4', { type: 'video/mp4', lastModified: 123456 }))
    expect(screen.queryByRole('group', { name: /does not match/ })).not.toBeInTheDocument()
    fireEvent.loadedMetadata(video)
    expect(screen.getByText('Selected: raid.mp4')).toBeInTheDocument()
    expect(savedRows()[0]).toHaveTextContent('Keep this note')
    expect(screen.getByRole('button', { name: 'Add Feedback' })).toBeEnabled()
  })

  it('keeps the original recording on mismatch cancellation and checks duration on explicit override', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 40, 'Keep this note')
    const replacement = new File(['different'], 'other.mp4', { type: 'video/mp4' })
    await user.upload(screen.getByLabelText('Select a local video'), replacement)
    expect(screen.getByRole('group', { name: /does not match/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Feedback' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancel replacement' }))
    expect(savedRows()[0]).toHaveTextContent('Keep this note')
    expect(screen.getByRole('button', { name: 'Seek to 0:40' })).toBeEnabled()
    await user.upload(screen.getByLabelText('Select a local video'), replacement)
    await user.click(screen.getByRole('button', { name: 'Use this recording anyway' }))
    vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(20)
    fireEvent.loadedMetadata(video)
    expect(screen.getByRole('alert')).toHaveTextContent('Some feedback timestamps exceed')
    expect(savedRows()[0]).toHaveTextContent('Keep this note')
    expect(screen.getByRole('button', { name: 'Seek to 0:40' })).toBeDisabled()
    expect(screen.getByText('Selected: other.mp4')).toBeInTheDocument()
  })

  it('clears notes and context only after confirming a new review', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'Old note')
    // Context remains untouched until the new-review confirmation.
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['different'], 'new.mp4', { type: 'video/mp4' }))
    await user.click(screen.getByRole('button', { name: 'Start a new review' }))
    expect(savedRows()[0]).toHaveTextContent('Old note')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Test encounter' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start a new review' }))
    await user.click(screen.getByRole('button', { name: 'Confirm new review' }))
    expect(screen.queryByRole('cell', { name: 'Old note' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Encounter/ })).toHaveValue('')
    expect(screen.getByText('Selected: new.mp4')).toBeInTheDocument()
    fireEvent.loadedMetadata(video)
    expect(screen.getByRole('button', { name: 'Start review' })).toBeEnabled()
  })

  it('preserves feedback while saving or cancelling context edits', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'Existing feedback')
    await user.click(screen.getByRole('button', { name: 'Edit context' }))
    const encounter = screen.getByRole('textbox', { name: /Encounter/ })
    await user.clear(encounter)
    await user.type(encounter, 'Updated encounter')
    await user.click(screen.getByRole('button', { name: 'Save context' }))
    expect(savedRows()[0]).toHaveTextContent('Existing feedback')
    expect(screen.getByRole('heading', { name: 'Updated encounter' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Edit context' }))
    await user.type(screen.getByRole('textbox', { name: /Encounter/ }), ' draft')
    await user.click(screen.getByRole('button', { name: 'Cancel context changes' }))
    await addNote(user, video, 20, 'Another note')
    expect(savedRows()).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Updated encounter' })).toBeInTheDocument()
  })

  it('hides feedback before selection and hides the table until a draft is opened', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    expect(screen.queryByRole('button', { name: 'Add Feedback' })).not.toBeInTheDocument()
    await user.upload(screen.getByLabelText('Select a local video'),
      new File(['sample'], 'raid.mp4', { type: 'video/mp4', lastModified: 123456 }))
    expect(screen.queryByRole('button', { name: 'Add Feedback' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start review' })).toBeDisabled()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.loadedMetadata(container.querySelector('video')!)
    expect(screen.getByRole('button', { name: 'Start review' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Start review' }))
    expect(screen.queryByRole('button', { name: 'Add Feedback' })).not.toBeInTheDocument()
  })

  it('pauses and locks whole seconds on Add Feedback, even if playback moves before saving', async () => {
    const { user, video } = await setupRecording()
    video.currentTime = 10.9
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    expect(video.pause).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Add Feedback' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Importance' })).toHaveFocus()
    // A resumed player can move without changing the draft's locked time.
    video.currentTime = 35
    fireEvent.timeUpdate(video)
    await user.type(screen.getByRole('textbox', { name: 'Observation' }), 'Locked note')
    await user.type(screen.getByRole('textbox', { name: 'Suggested improvement' }), 'Act earlier')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Seek to 0:10' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Seek to 0:35' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Observation' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Feedback' })).toHaveFocus()
  })

  it('cancels a new draft without saving and starts a fresh draft next time', async () => {
    const { user, video } = await setupRecording()
    video.currentTime = 10
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    await user.type(screen.getByRole('textbox', { name: 'Observation' }), 'Discard me')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('0 feedback entries', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Feedback' })).toHaveFocus()
    video.currentTime = 20
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    expect(screen.getByRole('textbox', { name: 'Observation' })).toHaveValue('')
    expect(screen.getByRole('cell', { name: /Locked timestamp:\s*0:20/ })).toBeInTheDocument()
  })

  it('keeps a rejected new draft and its locked timestamp until cancelled', async () => {
    const { user, video } = await setupRecording()
    video.currentTime = 10
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    await user.type(screen.getByRole('textbox', { name: 'Observation' }), '   ')
    await user.type(screen.getByRole('textbox', { name: 'Suggested improvement' }), 'Keep my draft')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(within(screen.getByRole('form', { name: 'Add feedback' })).getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Suggested improvement' })).toHaveValue('Keep my draft')
    expect(screen.getByText('0 feedback entries', { exact: true })).toBeInTheDocument()
  })

  it('filters saved entries without losing them or filtering out an open new draft', async () => {
    const { user, video } = await setupRecording()
    await addNote(user, video, 10, 'Mechanics note')
    video.currentTime = 20
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'Mitigation')
    await user.type(screen.getByRole('textbox', { name: 'Observation' }), 'Mitigation note')
    await user.type(screen.getByRole('textbox', { name: 'Suggested improvement' }), 'Use a cooldown')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const filter = screen.getByRole('combobox', { name: 'Filter by category' })
    await user.selectOptions(filter, 'Mitigation')
    expect(savedRows()).toHaveLength(1)
    expect(savedRows()[0]).toHaveTextContent('Mitigation note')
    expect(screen.getByText('Showing 1 of 2 feedback entries')).toBeInTheDocument()
    await user.selectOptions(filter, 'Other')
    expect(screen.getByText('No feedback matches this category.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    expect(screen.getByRole('textbox', { name: 'Observation' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.selectOptions(filter, 'All')
    expect(savedRows()).toHaveLength(2)
    expect(savedRows()[0]).toHaveTextContent('Mechanics note')
    expect(savedRows()[1]).toHaveTextContent('Mitigation note')
  })

  it('defaults importance to 3, saves a chosen level, and supports cancelling and saving edits', async () => {
    const { user } = await setupRecording()
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    expect(screen.getByRole('combobox', { name: 'Importance' })).toHaveValue('3')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Importance' }), '5')
    await user.type(screen.getByRole('textbox', { name: 'Observation' }), 'Important note')
    await user.type(screen.getByRole('textbox', { name: 'Suggested improvement' }), 'Avoid the hit')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const row = savedRows()[0]
    expect(within(row).getByRole('cell', { name: '5 · Critical' })).toBeInTheDocument()
    await user.click(within(row).getByRole('button', { name: /^Edit feedback/ }))
    expect(within(row).getByRole('combobox', { name: 'Importance' })).toHaveValue('5')
    await user.selectOptions(within(row).getByRole('combobox', { name: 'Importance' }), '1')
    await user.click(within(row).getByRole('button', { name: 'Cancel' }))
    expect(within(row).getByRole('cell', { name: '5 · Critical' })).toBeInTheDocument()
    await user.click(within(row).getByRole('button', { name: /^Edit feedback/ }))
    await user.selectOptions(within(row).getByRole('combobox', { name: 'Importance' }), '1')
    await user.click(within(row).getByRole('button', { name: 'Save' }))
    expect(within(row).getByRole('cell', { name: '1 · Low' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Feedback' }))
    expect(screen.getByRole('combobox', { name: 'Importance' })).toHaveValue('3')
  })

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
    expect(screen.getByText('1 feedback entry', { exact: true })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Remove feedback at 0:20: Second note' }))
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByRole('button', { name: /^Edit feedback at/ })).not.toBeInTheDocument()
    expect(screen.getByText('No feedback yet. Choose Add Feedback at a moment you want to review.')).toBeInTheDocument()
    expect(screen.getByText('0 feedback entries', { exact: true })).toHaveFocus()
  })
})
