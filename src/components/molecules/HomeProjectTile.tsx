import { UiActionButton, UiArrowForwardIcon } from '../atoms/MuiPrimitives'

type HomeProjectTileProps = {
  variant: 'bridge' | 'lab'
  imageSrc?: string
  imageAlt: string
  missingLabel: string
  title: string
  subtitle: string
  onClick: () => void
}

/** One accessible click target with a reusable, decorative arrow glyph. */
export default function HomeProjectTile({variant, imageSrc, imageAlt, missingLabel, title, subtitle, onClick}: HomeProjectTileProps) {
  return <UiActionButton className={`portfolio-project portfolio-${variant}`} onClick={onClick}>
    {imageSrc ? <img src={imageSrc} alt={imageAlt} /> : <span className="portfolio-missing-image">{missingLabel}</span>}
    <span className="portfolio-project-copy"><strong>{title}</strong><small>{subtitle}</small></span>
    <span className="portfolio-project-arrow" aria-hidden="true"><UiArrowForwardIcon /></span>
  </UiActionButton>
}
