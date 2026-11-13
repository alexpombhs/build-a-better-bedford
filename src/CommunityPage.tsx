import PageHeading from './components/PageHeading'
import CommunityStoryCard from './components/molecules/CommunityStoryCard'
import { UiArrowForwardIcon, UiBox, UiText } from './components/atoms/MuiPrimitives'
import { communitySections } from './communityContent'
import './community.css'

/** Three editorial beats. No general school feed, artificial ranking or
 * event sidebar: each update must have a clear civil engineering connection. */
export default function CommunityPage() {
  return (
    <UiBox className="bbb-community-page">
      <PageHeading
        className="bbb-community-heading"
        eyebrow="BEDFORD & BEYOND"
        title="Community"
        description="Civil engineering updates — from the projects shaping Bedford to the industry and universities building what comes next."
      />
      <UiBox className="bbb-community-grid">
        {communitySections.map(section => (
          <section
            className="bbb-community-column"
            key={section.id}
            aria-labelledby={`community-section-${section.id}`}
          >
            <UiBox className="bbb-community-column-head">
              <span className="bbb-community-column-number">{section.number} / COMMUNITY</span>
              <UiText component="h2" className="bbb-community-column-title" id={`community-section-${section.id}`}>
                {section.title}
              </UiText>
              <UiText component="p" className="bbb-community-column-description">
                {section.description}
              </UiText>
              <span className="bbb-community-column-topics">{section.topics}</span>
            </UiBox>

            <UiBox className="bbb-community-story-list">
              {section.stories.map(story => <CommunityStoryCard key={story.id} story={story} />)}
            </UiBox>

            <a className="bbb-community-directory-link" href={section.directoryHref} target="_blank" rel="noopener noreferrer">
              {section.directoryLabel}
              <UiArrowForwardIcon aria-hidden="true" fontSize="small" />
            </a>
          </section>
        ))}
      </UiBox>
      <UiText component="p" className="bbb-community-editorial-note">
        Curated by BBB · Sources reviewed November 2026. Event dates and admission deadlines can change; confirm details with the linked official sources. This is not a real-time weather or emergency alert service.
      </UiText>
    </UiBox>
  )
}
