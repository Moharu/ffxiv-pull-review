import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { demoVideoUrl } from './demo'
import { createEmptyReview, REVIEW_STORAGE_KEY } from './utils/storage'

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(420)
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(1)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function openDemo() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Try demo recording' }))
  const region = screen.getByRole('region', { name: 'Demo review' })
  const video = region.querySelector('video')!
  fireEvent.loadedMetadata(video)
  return { user, region, video }
}

describe('demo recording', () => {
  it('loads only after opting in and needs no local file', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    expect(container.querySelector('video')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Try demo recording' }))
    const demo = screen.getByRole('region', { name: 'Demo review' })
    expect(demo.querySelector('video')).toHaveAttribute('src', demoVideoUrl)
    expect(demo.querySelector('video')).not.toHaveAttribute('autoplay')
    expect(within(demo).queryByLabelText('Select a local video')).not.toBeInTheDocument()
    expect(within(demo).getByText(/Sample feedback supplied by the recording's owner/)).toBeInTheDocument()
    expect(within(demo).getByRole('button', { name: 'Add Feedback' })).toBeDisabled()
    fireEvent.loadedMetadata(demo.querySelector('video')!)
    expect(within(demo).getByRole('button', { name: 'Add Feedback' })).toBeEnabled()
    expect(within(demo).getByRole('heading', { name: 'Vamp Fatale - M9S · Demo recording' })).toBeInTheDocument()
    expect(within(demo).getByText('Moharu Nn · Sage')).toBeInTheDocument()
    expect(within(demo).getByText('Congratulations on the clear!')).toBeInTheDocument()
    expect(within(demo).getByRole('cell', { name: 'Dosis reapplication' })).toBeInTheDocument()
    expect(within(demo).getByRole('cell', { name: '2 · Minor' })).toBeInTheDocument()
    expect(within(demo).getByRole('cell', { name: 'Dangerous Raidwide' })).toBeInTheDocument()
    expect(within(demo).getByRole('cell', { name: '5 · Critical' })).toBeInTheDocument()
    expect(within(demo).getByRole('button', { name: 'Seek to 5:06' })).toBeEnabled()

  })

  it('isolates demo edits from saved data and restores the local review on exit', async () => {
    const saved = {
      ...createEmptyReview(),
      context: { encounter: 'My encounter', playerName: 'My player', playerJob: 'Sage', pullNotes: 'Keep me' },
    }
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(saved))
    const { user, region, video } = await openDemo()
    video.currentTime = 15
    await user.click(within(region).getByRole('button', { name: 'Add Feedback' }))
    await user.type(within(region).getByRole('textbox', { name: 'Observation' }), 'Temporary demo note')
    await user.type(within(region).getByRole('textbox', { name: 'Suggested improvement' }), 'Example improvement')
    await user.click(within(region).getByRole('button', { name: 'Save' }))
    expect(within(region).getByRole('cell', { name: 'Temporary demo note' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!)).toEqual(saved)
    await user.click(screen.getByRole('button', { name: 'Return to my review' }))
    expect(screen.getByRole('heading', { name: 'My encounter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try demo recording' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Try demo recording' }))
    expect(screen.queryByRole('cell', { name: 'Temporary demo note' })).not.toBeInTheDocument()
  })

  it('confirms resets and restores sample feedback', async () => {
    const { user, region } = await openDemo()
    await user.click(within(region).getByRole('button', { name: /^Remove feedback at 1:07/ }))
    await user.click(within(region).getByRole('button', { name: 'Remove' }))
    expect(within(region).queryByRole('button', { name: 'Seek to 1:07' })).not.toBeInTheDocument()
    await user.click(within(region).getByRole('button', { name: 'Reset demo' }))
    await user.click(within(region).getByRole('button', { name: 'Cancel reset' }))
    expect(within(region).queryByRole('button', { name: 'Seek to 1:07' })).not.toBeInTheDocument()
    await user.click(within(region).getByRole('button', { name: 'Reset demo' }))
    await user.click(within(region).getByRole('button', { name: 'Confirm reset' }))
    expect(within(region).getByRole('button', { name: 'Seek to 1:07' })).toBeInTheDocument()
  })

  it('reports hosting errors and can retry the demo source', async () => {
    const { user, video, region } = await openDemo()
    Object.defineProperty(video, 'error', { configurable: true, value: { code: 2 } })
    fireEvent.error(video)
    expect(within(region).getByRole('alert')).toHaveTextContent('demo recording could not be loaded')
    expect(within(region).getByRole('button', { name: 'Add Feedback' })).toBeDisabled()
    await user.click(within(region).getByRole('button', { name: 'Retry demo video' }))
    expect(within(region).queryByRole('alert')).not.toBeInTheDocument()
    Object.defineProperty(video, 'error', { configurable: true, value: null })
    fireEvent.loadedMetadata(video)
    expect(within(region).getByRole('button', { name: 'Add Feedback' })).toBeEnabled()
  })
})
