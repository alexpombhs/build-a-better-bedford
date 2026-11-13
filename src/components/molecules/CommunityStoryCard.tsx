import type { CommunityStory } from '../../communityContent'
import { UiArrowForwardIcon, UiBox, UiText } from '../atoms/MuiPrimitives'

/** A concise, single-link editorial story molecule using the BBB MUI atoms. */
export default function CommunityStoryCard({ story }: { story: CommunityStory }) {
  return (
    <article className="bbb-community-story">
      <a href={story.href} target="_blank" rel="noopener noreferrer" className="bbb-community-story-link">
        <UiBox className="bbb-community-story-meta">
          <span>{story.label}</span>
          {story.date && <span>{story.date}</span>}
        </UiBox>
        <UiText component="h3" className="bbb-community-story-title">{story.title}</UiText>
        <UiText component="p" className="bbb-community-story-summary">{story.summary}</UiText>
        <span className="bbb-community-story-source">
          {story.source}
          <UiArrowForwardIcon aria-hidden="true" fontSize="small" />
        </span>
      </a>
    </article>
  )
}
