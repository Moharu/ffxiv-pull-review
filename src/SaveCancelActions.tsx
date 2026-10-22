type SaveCancelActionsProps = {
  onCancel: () => void
  disabled?: boolean
}

function SaveCancelActions({ onCancel, disabled }: SaveCancelActionsProps) {
  return (
    <>
      <button type="submit" disabled={disabled}>Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </>
  )
}

export default SaveCancelActions
