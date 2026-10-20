import type { ReactNode } from "react"

type AlertProps = {
  children: ReactNode
  id?: string
}

function Alert({ children, id }: AlertProps) {
  return <p id={id} className="alert" role="alert">{children}</p>
}

export default Alert
