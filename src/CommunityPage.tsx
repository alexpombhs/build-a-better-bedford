import { useState } from 'react'
import PageHeading from './components/PageHeading'
import CommunityStoryCard from './components/molecules/CommunityStoryCard'
import { UiArrowForwardIcon, UiBox, UiTab, UiTabs, UiText } from './components/atoms/MuiPrimitives'
import { communitySections, communityUpcoming } from './communityContent'
import type { CommunitySection, CommunityUpcomingItem } from './communityContent'
import './community.css'

type CommunityTopic = 'all' | CommunitySection['id']

const tabLabels: Record<CommunityTopic, string> = {
  all: 'All',
  bedford: 'Bedford',
  industry: 'Engineering industry',
  universities: 'Colleges & universities',
}

function UpcomingEvent({ item }: { item: CommunityUpcomingItem }) {
  const [year, month, day] = item.date.split('-').map(Number)
  const monthLabel = new Date(Date.UTC(year, month - 1, day))
    .toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()
  return (
    <li className="bbb-community-upcoming-item">
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="bbb-community-upcoming-link">
        <time dateTime={item.date} className="bbb-community-upcoming-date">
          <span>{monthLabel}</span>
          <strong>{day}</strong>
        </time>
        <UiBox className="bbb-community-upcoming-details">
          <span className="bbb-community-upcoming-type">{item.label}</span>
          <strong>{item.title}</strong>
          <span className="bbb-community-upcoming-description">{item.detail}</span>
        </UiBox>
      </a>
    </li>
  )
}

/** All is the concise overview; the other three tabs show a single topic.
 * All dates have source links and expire automatically after the event ends. */
export default function CommunityPage() {
  const [topic, setTopic] = useState<CommunityTopic>('all')
  const section = topic === 'all' ? null : communitySections.find(item => item.id === topic) ?? communitySections[0]
  const today = new Date()
  const upcoming = communityUpcoming
    .filter(item => new Date(`${item.endDate ?? item.date}T23:59:59`).getTime() >= today.getTime())
    .sort((a, b) => a.date.localeCompare(b.date))

  const mainHighlight = communitySections[0].stories[0]
  const otherHighlights = [
    communitySections[0].stories[1],
    communitySections[1].stories[0],
    communitySections[2].stories[0],
  ]

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
        {(['all', ...communitySections.map(item => item.id)] as CommunityTopic[]).map(id => (
          <UiTab
            key={id}
            id={`bbb-community-tab-${id}`}
            aria-controls="bbb-community-panel"
            value={id}
            label={tabLabels[id]}
          />
        ))}
      </UiTabs>

      {topic === 'all' ? (
        <section
          className="bbb-community-active-section bbb-community-all"
          id="bbb-community-panel"
          role="tabpanel"
          aria-labelledby="bbb-community-tab-all"
        >
          <UiBox className="bbb-community-intro">
            <UiBox className="bbb-community-intro-copy">
              <UiText component="h2" className="bbb-community-section-title">Highlights</UiText>
              <UiText component="p" className="bbb-community-section-description">
                A selection of local infrastructure, engineering industry and university updates.
              </UiText>
            </UiBox>
          </UiBox>

          <UiBox className="bbb-community-all-lead">
            <UiBox className="bbb-community-all-feature">
              <CommunityStoryCard story={mainHighlight} />
            </UiBox>
            <aside className="bbb-community-coming-up" aria-labelledby="bbb-community-coming-up-heading">
              <UiBox className="bbb-community-coming-up-header">
                <UiText component="h2" id="bbb-community-coming-up-heading">Coming up</UiText>
                <span>Events &amp; deadlines</span>
              </UiBox>
              {upcoming.length ? (
                <ul className="bbb-community-upcoming-list">
                  {upcoming.map(item => <UpcomingEvent key={item.id} item={item} />)}
                </ul>
              ) : (
                <UiText component="p" className="bbb-community-upcoming-empty">
                  No scheduled updates yet. Check the individual tabs for current resources.
                </UiText>
              )}
            </aside>
          </UiBox>

          <UiBox className="bbb-community-more">
            <UiText component="h2" className="bbb-community-more-title">Across Bedford &amp; beyond</UiText>
            <UiBox className="bbb-community-more-grid">
              {otherHighlights.map(story => <CommunityStoryCard key={story.id} story={story} />)}
            </UiBox>
          </UiBox>
        </section>
      ) : (
        section && (
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
        )
      )}

      <UiText component="p" className="bbb-community-editorial-note">
        Curated by BBB · Sources reviewed November 2026. Confirm event dates, admissions deadlines and current conditions with the linked official sources. Not a real-time weather or emergency alert service.
      </UiText>
    </UiBox>
  )
}
