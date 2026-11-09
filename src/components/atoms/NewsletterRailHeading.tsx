import type { ReactNode } from 'react'
import { UiText } from './MuiPrimitives'

/** Shared atomic rail heading: In This Issue, Club Corner, Did You Know.
 * One typography treatment regardless of which sidebar variant uses it. */
export default function NewsletterRailHeading({ children }: { children: ReactNode }) {
  return <UiText component="h2" variant="subtitle2" className="newsletter-rail-heading">{children}</UiText>
}
