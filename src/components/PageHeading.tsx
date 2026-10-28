import type { ReactNode } from 'react'
import './PageHeading.css'

type Props = {
  title: ReactNode
  description?: ReactNode
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeading({title,description,eyebrow,actions,className = ''}:Props) {
  return <div className={`bbb-page-heading ${className}`}>
    <div className="bbb-page-heading-copy">
      {eyebrow && <p className="bbb-page-heading-eyebrow">{eyebrow}</p>}
      <h1 className="bbb-page-heading-title">{title}</h1>
      {description && <p className="bbb-page-heading-description">{description}</p>}
    </div>
    {actions && <div className="bbb-page-heading-actions">{actions}</div>}
  </div>
}
