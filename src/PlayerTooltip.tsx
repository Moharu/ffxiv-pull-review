import { useId } from "react"
import type { ReactNode } from "react"

type PlayerTooltipProps = {
  label: string
  suppressed?: boolean
  children: (descriptionId: string) => ReactNode
}

function PlayerTooltip({ label, suppressed = false, children }: PlayerTooltipProps) {
  const id = useId()
  return <span className="player-tooltip" data-suppressed={suppressed || undefined}>
    {children(id)}
    <span id={id} role="tooltip" className="player-tooltip-label">{label}</span>
  </span>
}

export default PlayerTooltip
