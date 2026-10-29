import type { ReactNode } from 'react'
import { UiCard, UiCardContent } from './atoms/MuiPrimitives'
import './ProjectCard.css'

type Props = { children: ReactNode; className?: string; variant?: 'default' | 'idea' | 'cta' }
export default function ProjectCard({children,className='',variant='default'}:Props) {
  return <UiCard variant="outlined" className={`bbb-project-card bbb-project-card--${variant} ${className}`}>
    <UiCardContent className="bbb-project-card-content">{children}</UiCardContent>
  </UiCard>
}
