import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FeedbackItem from './FeedbackItem'
import type { FeedbackEntry } from './types'

const entry: FeedbackEntry = {
  id: 'feedback-1',
  timestamp: 10,
  importance: 3,
  category: 'Mechanics',
  observation: 'Moved too late.',
  suggestedImprovement: 'Start moving when the cast begins.',
}

describe('FeedbackItem', () => {
  it('preserves the edited draft when saving is rejected', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn(() => 'Unable to save feedback.')

    render(
      <table>
        <tbody>
          <FeedbackItem
            entry={entry}
            duration={60}
            canSeek
            onSeek={vi.fn()}
            onUpdate={onUpdate}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>,
    )

    await user.click(screen.getByRole('button', { name: 'Edit feedback at 0:10: Moved too late.' }))
    const observation = screen.getByRole('textbox', { name: 'Observation' })
    await user.clear(observation)
    await user.type(observation, 'Started moving earlier.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      screen.getByRole('textbox', { name: 'Observation' }),
    ).toHaveValue('Started moving earlier.')
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to save feedback.')
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith({
      ...entry,
      observation: 'Started moving earlier.',
    })
  })
  it('cancelling discards a draft without requesting a save', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn(() => null)

    render(
      <table>
        <tbody>
          <FeedbackItem
            entry={entry}
            duration={60}
            canSeek
            onSeek={vi.fn()}
            onUpdate={onUpdate}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>,
    )

    await user.click(screen.getByRole('button', { name: 'Edit feedback at 0:10: Moved too late.' }))
    const observation = screen.getByRole('textbox', { name: 'Observation' })
    await user.clear(observation)
    await user.type(observation, 'Started moving earlier.')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('textbox', { name: 'Observation' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Moved too late.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit feedback at 0:10: Moved too late.' })).toHaveFocus()
  })
  it('cancelling deletion does not call onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <table>
        <tbody>
          <FeedbackItem
            entry={entry}
            duration={60}
            canSeek
            onSeek={vi.fn()}
            onUpdate={vi.fn(() => null)}
            onDelete={onDelete}
          />
        </tbody>
      </table>,
    )
    await user.click(screen.getByRole('button', { name: 'Remove feedback at 0:10: Moved too late.' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: 'Remove feedback at 0:10? This cannot be undone.' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove feedback at 0:10: Moved too late.' })).toHaveFocus()
  })
  it('requests deletion only after confirmation', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <table><tbody>
        <FeedbackItem entry={entry} duration={60} canSeek onSeek={vi.fn()}
          onUpdate={vi.fn(() => null)} onDelete={onDelete} />
      </tbody></table>,
    )
    await user.click(screen.getByRole('button', { name: 'Remove feedback at 0:10: Moved too late.' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(entry.id)
  })

})
