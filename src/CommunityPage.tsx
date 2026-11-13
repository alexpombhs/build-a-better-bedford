import { useState } from 'react'
import PageHeading from './components/PageHeading'
import CommunityStoryCard from './components/molecules/CommunityStoryCard'
import { UiArrowForwardIcon, UiBox, UiTab, UiTabs, UiText } from './components/atoms/MuiPrimitives'
import { communitySections } from './communityContent'
import type { CommunitySection } from './communityContent'
import './community.css'

type CommunityTopic = CommunitySection['id']

const tabLabels: Record<CommunityTopic, string> = {
  bedford: 'Bedford',
  industry: 'Engineering industry',
  universities: 'Colleges & universities',
}

/** Community keeps three distinct editorial beats, shown one at a time.
 * Tabs are the MUI atom wrappers already used throughout BBB. */
export default function CommunityPage() {
  const [topic, setTopic] = useState<CommunityTopic>('bedford')
  const section = communitySections.find(item => item.id === topic) ?? communitySections[0]

  return (
    <UiBox className="bbb-community-page">
      <PageHeading
        className="bbb-community-heading"
        eyebrow="BEDFORD & BEYOND"
        title="Community"
        description="Civil engineering updates — from Bedford projects to industry events and university programs."
      />

      <UiTabs
        className="bbb-community-tabs"
        value={topic}
        onChange={(_, next: CommunityTopic) => setTopic(next)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Community topics"
      >
        {communitySections.map(item => (
          <UiTab
            key={item.id}
            id={`bbb-community-tab-${item.id}`}
            aria-controls="bbb-community-panel"
            value={item.id}
            label={tabLabels[item.id]}
          />
        ))}
      </UiTabs>

      <section
        className="bbb-community-active-section"
        id="bbb-community-panel"
        role="tabpanel"
        aria-labelledby={`bbb-community-tab-${section.id}`}
        key={section.id}
      >
        <UiBox className="bbb-community-intro">
          <UiBox className="bbb-community-intro-copy">
            <UiText component="h2" className="bbb-community-section-title">{section.title}</UiText>
            <UiText component="p" className="bbb-community-section-description">
              {section.description}
            </UiText>
          </UiBox>
          <span className="bbb-community-section-topics">{section.topics}</span>
        </UiBox>

        <UiBox className="bbb-community-story-grid">
          {section.stories.map(story => <CommunityStoryCard key={story.id} story={story} />)}
        </UiBox>

        <a
          className="bbb-community-directory-link"
          href={section.directoryHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {section.directoryLabel}
          <UiArrowForwardIcon aria-hidden="true" fontSize="small" />
        </a>
      </section>

      <UiText component="p" className="bbb-community-editorial-note">
        Curated by BBB · Sources reviewed November 2026. Confirm event dates, admissions deadlines and current conditions with the linked official sources. Not a real-time weather or emergency alert service.
      </UiText>
    </UiBox>
  )
}
