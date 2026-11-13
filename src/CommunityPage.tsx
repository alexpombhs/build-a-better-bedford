import { useState } from 'react'
import PageHeading from './components/PageHeading'
import CommunityStoryCard from './components/molecules/CommunityStoryCard'
import { UiArrowForwardIcon, UiBox, UiTab, UiTabs, UiText } from './components/atoms/MuiPrimitives'
import { communitySections, communityUpcoming } from './communityContent'
import type { CommunitySection, CommunityUpcomingItem } from './communityContent'
import './community.css'

type CommunityTopic = 'all' | CommunitySection['id'] | 'events'

const tabLabels: Record<CommunityTopic, string> = {
  all: 'All',
  bedford: 'Bedford',
  industry: 'Engineering Industry',
  universities: 'Colleges & Universities',
  events: 'Events & Opportunities',
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

/** The Community page indexes primary sources. BBB selects relevant links;
 * it does not present the linked news as its own reporting. */
export default function CommunityPage() {
  const [topic, setTopic] = useState<CommunityTopic>('all')
  const section = topic !== 'all' && topic !== 'events'
    ? communitySections.find(item => item.id === topic)
    : undefined
  const today = new Date()
  const upcoming = communityUpcoming
    .filter(item => new Date(`${item.endDate ?? item.date}T23:59:59`).getTime() >= today.getTime())
    .sort((a, b) => a.date.localeCompare(b.date))

  // One consistent feed component everywhere. The All tab samples sources from
  // each topic without pretending that evergreen resources are breaking news.
  const selectedLinks = [
    ...communitySections[0].stories.slice(0, 4),
    communitySections[1].stories[0],
    communitySections[2].stories[0],
  ]

  return (
    <UiBox className="bbb-community-page">
      <PageHeading
        className="bbb-community-heading"
        eyebrow="BEDFORD & BEYOND"
        title="Community"
        description="Local Bedford news, engineering updates, college information and events — all linked to their original sources."
      />

      <UiTabs
        className="bbb-community-tabs"
        value={topic}
        onChange={(_, next: CommunityTopic) => setTopic(next)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Community topics"
      >
        {(['all', ...communitySections.map(item => item.id), 'events'] as CommunityTopic[]).map(id => (
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
          className="bbb-community-active-section"
          id="bbb-community-panel"
          role="tabpanel"
          aria-labelledby="bbb-community-tab-all"
        >
          <UiBox className="bbb-community-all-layout">
            <UiBox className="bbb-community-source-feed">
              <UiBox className="bbb-community-intro">
                <UiBox className="bbb-community-intro-copy">
                  <UiText component="h2" className="bbb-community-section-title">Latest updates</UiText>
                  <UiText component="p" className="bbb-community-section-description">
                    Bedford news and engineering resources. Select a headline to read the original article or announcement.
                  </UiText>
                </UiBox>
              </UiBox>
              <UiBox className="bbb-community-news-list">
                {selectedLinks.map(story => <CommunityStoryCard key={story.id} story={story} />)}
              </UiBox>
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
                  No future events are listed yet. Check the original sources for updates.
                </UiText>
              )}
            </aside>
          </UiBox>
        </section>
      ) : topic === 'events' ? (
        <section
          className="bbb-community-active-section"
          id="bbb-community-panel"
          role="tabpanel"
          aria-labelledby="bbb-community-tab-events"
        >
          <UiBox className="bbb-community-intro">
            <UiBox className="bbb-community-intro-copy">
              <UiText component="h2" className="bbb-community-section-title">Events &amp; Opportunities</UiText>
              <UiText component="p" className="bbb-community-section-description">
                Science fairs, student competitions, engineering conferences and application deadlines — linked to organizers.
              </UiText>
            </UiBox>
            <span className="bbb-community-section-topics">EVENTS · DEADLINES</span>
          </UiBox>
          {upcoming.length ? (
            <ul className="bbb-community-events-grid">
              {upcoming.map(item => <UpcomingEvent key={item.id} item={item} />)}
            </ul>
          ) : (
            <UiText component="p" className="bbb-community-upcoming-empty">
              No future events are listed yet. Check the original sources for updates.
            </UiText>
          )}
        </section>
      ) : section ? (
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
              <UiText component="p" className="bbb-community-section-description">{section.description}</UiText>
            </UiBox>
            <span className="bbb-community-section-topics">{section.topics}</span>
          </UiBox>

          <UiBox className="bbb-community-news-list">
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
      ) : null}

      <UiText component="p" className="bbb-community-editorial-note">
        Collected by BBB from local news, town announcements and official resources. Dates reflect the original publishers. This is not a live news or weather alert service.
      </UiText>
    </UiBox>
  )
}
