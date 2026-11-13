import type { CommunityStory } from '../../communityContent'
import { UiArrowForwardIcon, UiBox, UiText } from '../atoms/MuiPrimitives'

const displayDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month:'short',day:'numeric',year:'numeric',timeZone:'UTC',
  })
}

/** Featured link to an original external publication, with independently
 * created BBB artwork (never passed off as the publisher's photograph). */
export default function CommunityFeaturedStory({ story }: { story: CommunityStory }) {
  const artworkSrc = `${import.meta.env.BASE_URL}media/radium-girls-theater-illustration.svg`
  return <article className="bbb-community-featured">
    <a
      className="bbb-community-featured-link"
      href={story.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <UiBox className="bbb-community-featured-art">
        <img
          src={artworkSrc}
          alt="Original illustrated theater graphic for Bedford High School's Radium Girls. Not a photograph or official show poster."
          loading="eager"
        />
        <span className="bbb-community-featured-image-credit">Illustration by BBB · Not a production photo</span>
      </UiBox>
      <UiBox className="bbb-community-featured-copy">
        <UiBox className="bbb-community-featured-meta">
          <span>FEATURED · {story.label}</span>
          {story.publishedAt && <time dateTime={story.publishedAt}>Posted {displayDate(story.publishedAt)}</time>}
        </UiBox>
        <UiText component="h3" className="bbb-community-featured-title">{story.title}</UiText>
        <UiText component="p" className="bbb-community-featured-summary">{story.summary}</UiText>
        <UiBox className="bbb-community-featured-bottom">
          <span>{story.source}</span>
          <span className="bbb-community-featured-read">Read original article <UiArrowForwardIcon aria-hidden="true" fontSize="small"/></span>
        </UiBox>
      </UiBox>
    </a>
  </article>
}
