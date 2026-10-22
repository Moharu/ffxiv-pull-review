import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createEmptyReview, REVIEW_STORAGE_KEY } from './utils/storage'

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(60)
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(1)
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL() { return 'blob:test' }
    static revokeObjectURL() {}
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function saveContext(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /Encounter/ }), 'Encounter')
  await user.type(screen.getByRole('textbox', { name: /Player name/ }), 'Player')
  await user.selectOptions(screen.getByRole('combobox', { name: /Player job/ }), 'Paladin')
  await user.upload(screen.getByLabelText('Select a local video'), new File(['sample'], 'raid.mp4', { type: 'video/mp4' }))
  fireEvent.loadedMetadata(document.querySelector('video')!)
  await user.click(screen.getByRole('button', { name: 'Start review' }))
}

describe('App persistence', () => {
  it('opens a legacy review without title and persists the migrated format', () => {
    const feedbackEntries = [{ id: 'legacy-note', timestamp: 10, importance: 3, category: 'Mechanics', observation: 'Keep this note', suggestedImprovement: 'Move early' }]
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({
      version: 1,
      recording: { name: 'raid.mp4', size: 10, lastModified: 123 },
      context: { title: 'Old title', encounter: 'Legacy encounter', playerName: 'Player', playerJob: 'Paladin', pullNotes: 'Keep notes' },
      feedbackEntries,
    }))
    render(<StrictMode><App /></StrictMode>)
    expect(screen.queryByRole('textbox', { name: /Review title/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Legacy encounter' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Keep this note' })).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!)
    expect(stored.version).toBe(2)
    expect(stored.context.title).toBeUndefined()
    expect(stored.feedbackEntries).toEqual(feedbackEntries)
  })

  it('restores saved context across remounts but does not save unsaved draft text', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await saveContext(user)
    await user.click(screen.getByRole('button', { name: 'Edit context' }))
    await user.type(screen.getByRole('textbox', { name: /Encounter/ }), ' unsaved draft')
    first.unmount()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Encounter' })).toBeInTheDocument()
  })

  it('restores notes without a video as read-only feedback', async () => {
    const user = userEvent.setup()
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({
      ...createEmptyReview(), recording: { name: 'raid.mp4', size: 10, lastModified: 123 },
      feedbackEntries: [{ id: 'saved', timestamp: 10, importance: 5, category: 'Mechanics', observation: 'Saved note', suggestedImprovement: 'Move earlier' }],
    }))
    render(<App />)
    expect(screen.getByRole('cell', { name: 'Saved note' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '5 · Critical' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Seek to 0:10' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add Feedback' })).toBeDisabled()
    const edit = screen.getByRole('button', { name: 'Edit feedback at 0:10: Saved note' })
    const remove = screen.getByRole('button', { name: 'Remove feedback at 0:10: Saved note' })
    expect(edit).toBeDisabled()
    expect(remove).toBeDisabled()
    await user.click(edit)
    await user.click(remove)
    expect(screen.queryByRole('textbox', { name: 'Observation' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(screen.getByText(/Feedback is read-only until/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filter by category' })).toBeEnabled()
  })

  it('does not overwrite damaged data, even in StrictMode, until replacement is confirmed', async () => {
    const user = userEvent.setup()
    localStorage.setItem(REVIEW_STORAGE_KEY, 'damaged data')
    render(<StrictMode><App /></StrictMode>)
    await saveContext(user)
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe('damaged data')
    await user.click(screen.getByRole('button', { name: 'Replace stored data' }))
    await user.click(screen.getByRole('button', { name: 'Cancel replacement' }))
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe('damaged data')
    await user.click(screen.getByRole('button', { name: 'Replace stored data' }))
    await user.click(screen.getByRole('button', { name: 'Confirm replacement' }))
    expect(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!).context.encounter).toBe('Encounter')
    expect(screen.queryByRole('region', { name: 'Storage recovery' })).not.toBeInTheDocument()
  })

  it('keeps changes in memory on write failure and retries the current working review', async () => {
    const user = userEvent.setup()
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full') })
    render(<App />)
    await saveContext(user)
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved')
    expect(screen.getByRole('heading', { name: 'Encounter' })).toBeInTheDocument()
    write.mockRestore()
    await user.click(screen.getByRole('button', { name: 'Retry save' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!).context.encounter).toBe('Encounter')
  })
})
