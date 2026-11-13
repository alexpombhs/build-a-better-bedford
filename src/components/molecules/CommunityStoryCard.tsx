import type { CommunityStory } from '../../communityContent'
import { UiArrowForwardIcon, UiBox, UiText } from '../atoms/MuiPrimitives'

const publishedLabel = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

/** Direct-link news entry. No invented feature story, publisher-like teaser or
 * hierarchy based on authorship: the original publisher owns the announcement. */
export default function CommunityStoryCard({ story }: { story: CommunityStory }) {
  return (
    <article className="bbb-community-story">
      <a href={story.href} target="_blank" rel="noopener noreferrer" className="bbb-community-story-link">
        <UiBox className="bbb-community-story-meta">
          <span className="bbb-community-story-category">{story.label}</span>
          {story.publishedAt ? (
            <time dateTime={story.publishedAt}>Posted {publishedLabel(story.publishedAt)}</time>
          ) : (
            <span>{story.date || 'Official resource'}</span>
          )}
        </UiBox>
        <UiBox className="bbb-community-story-body">
          <UiText component="h3" className="bbb-community-story-title">{story.title}</UiText>
          <UiText component="p" className="bbb-community-story-summary">{story.summary}</UiText>
          <span className="bbb-community-story-source">
            {story.source}
          </span>
        </UiBox>
        <span className="bbb-community-story-action" aria-hidden="true">
          Original source <UiArrowForwardIcon fontSize="small" />
        </span>
      </a>
    </article>
  )
}
