type SaveCancelActionsProps = {
  onCancel: () => void
}

function SaveCancelActions({ onCancel }: SaveCancelActionsProps) {
  return (
    <>
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </>
  )
}

export default SaveCancelActions
