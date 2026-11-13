import type { MouseEvent } from 'react'
import type { CommunityStory } from '../../communityContent'
import { UiArrowForwardIcon, UiBox, UiText } from '../atoms/MuiPrimitives'

type Props = {
  story: CommunityStory
  onNavigateProjects: () => void
}

/** Story card molecule composed of BBB's MUI layout/text/icon atoms. */
export default function CommunityStoryCard({ story, onNavigateProjects }: Props) {
  const href = story.internal ? `${import.meta.env.BASE_URL}projects` : story.href
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!story.internal || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onNavigateProjects()
  }
  return (
    <article className="bbb-community-card">
      <a
        className="bbb-community-card-link"
        href={href}
        onClick={onClick}
        target={story.internal ? undefined : '_blank'}
        rel={story.internal ? undefined : 'noopener noreferrer'}
        aria-label={`${story.title} — ${story.source}`}
      >
        <UiBox className="bbb-community-card-image">
          <img src={story.image} alt={story.imageAlt} loading="lazy" />
        </UiBox>
        <UiBox className="bbb-community-card-copy">
          <UiBox className="bbb-community-card-meta">
            <span>{story.eyebrow}</span>
            <span>{story.date}</span>
          </UiBox>
          <UiText component="h3" className="bbb-community-card-title">{story.title}</UiText>
          <UiText component="p" className="bbb-community-card-summary">{story.summary}</UiText>
          <span className="bbb-community-card-read">Read more <UiArrowForwardIcon aria-hidden="true" fontSize="small" /></span>
        </UiBox>
      </a>
    </article>
  )
}
