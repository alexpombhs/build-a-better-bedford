import type { ReactNode } from 'react'
import { UiBox, UiText } from '../atoms/MuiPrimitives'
import NewsletterRailHeading from '../atoms/NewsletterRailHeading'

export type NewsletterSidebarVariant = 'default' | 'club-corner' | 'did-you-know'

type Props = {
  variant: NewsletterSidebarVariant
  title: string
  className?: string
  ornament?: ReactNode
  children: ReactNode
}

/**
 * Shared newsletter sidebar organism.
 *
 * The label, title hierarchy and content layout are identical for Club Corner
 * and Did You Know; saved palette classes on the parent supply the only visual
 * variation. A seasonal Three.js ornament is optional and remains decorative.
 */
export default function NewsletterSidebarSection({
  variant, title, className = '', ornament, children,
}: Props) {
  const label = variant === 'club-corner' ? 'Club Corner' : variant === 'did-you-know' ? 'Did You Know?' : ''
  const showTitle = !label || title.trim().toLowerCase() !== label.toLowerCase()

  return (
    <UiBox role="region" aria-label={label || title}
      className={['newsletter-side-story', `newsletter-sidebar-variant-${variant}`, className].filter(Boolean).join(' ')}>
      {label && <NewsletterRailHeading>{label}</NewsletterRailHeading>}
      {ornament}
      {showTitle && <UiText component={label ? 'h3' : 'h2'} variant="subtitle1"
        className="newsletter-sidebar-title">{title}</UiText>}
      {children}
    </UiBox>
  )
}
