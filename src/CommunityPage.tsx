import { useState } from 'react'
import PageHeading from './components/PageHeading'
import CommunityStoryCard from './components/molecules/CommunityStoryCard'
import { UiArrowForwardIcon, UiBox, UiButton, UiTab, UiTabs, UiText } from './components/atoms/MuiPrimitives'
import { communityCategories, communityEvents, communityFeature, communityStories } from './communityContent'
import type { CommunityCategory, CommunityEvent } from './communityContent'
import './community.css'

function UpcomingEvent({ event }: { event: CommunityEvent }) {
  const [month, day] = event.dateLabel.split('\n')
  return (
    <li className="bbb-community-event">
      <a href={event.href} target="_blank" rel="noopener noreferrer" aria-label={`${event.title}: ${event.detail}, ${event.source}`}>
        <span className="bbb-community-event-date"><small>{month}</small><strong>{day}</strong></span>
        <span className="bbb-community-event-details"><strong>{event.title}</strong><span>{event.detail}</span></span>
      </a>
    </li>
  )
}

export default function CommunityPage({ onExploreProjects }: { onExploreProjects: () => void }) {
  const [category, setCategory] = useState<CommunityCategory>('All updates')
  const showFeature = category === 'All updates' || category === communityFeature.category
  const stories = category === 'All updates'
    ? communityStories
    : communityStories.filter(story => story.category === category)

  // Use end-of-day local time so same-day events remain visible, but do not
  // leave a finished school play or SAT listed as "coming up" indefinitely.
  const upcoming = communityEvents
    .filter(event => new Date(`${event.lastDate}T23:59:59`).getTime() >= Date.now())
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)

  return (
    <UiBox className="bbb-community-page">
      <PageHeading
        className="bbb-community-heading"
        eyebrow="BEDFORD & BEYOND"
        title="Community"
        description="Local stories, student connections, and the world of civil engineering."
      />

      <UiTabs
        className="bbb-community-tabs"
        value={category}
        onChange={(_, value: CommunityCategory) => setCategory(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Community news categories"
      >
        {communityCategories.map(item => <UiTab key={item} value={item} label={item} />)}
      </UiTabs>

      {showFeature && (
        <UiBox className="bbb-community-lead">
          <article className="bbb-community-feature">
            <a href={communityFeature.href} target="_blank" rel="noopener noreferrer" className="bbb-community-feature-link">
              <div className="bbb-community-feature-image">
                <img src={communityFeature.image} alt={communityFeature.imageAlt} />
                <span className="bbb-community-feature-label">FEATURED STORY</span>
              </div>
              <div className="bbb-community-feature-copy">
                <span className="bbb-community-overline">{communityFeature.eyebrow} <span aria-hidden="true">·</span> {communityFeature.date}</span>
                <UiText component="h2" className="bbb-community-feature-title">{communityFeature.title}</UiText>
                <UiText component="p" className="bbb-community-feature-summary">{communityFeature.summary}</UiText>
                <span className="bbb-community-feature-action">Read from {communityFeature.source} <UiArrowForwardIcon aria-hidden="true" fontSize="small" /></span>
              </div>
            </a>
          </article>
          <aside className="bbb-community-upcoming" aria-labelledby="community-upcoming-heading">
            <UiText component="h2" className="bbb-community-upcoming-title" id="community-upcoming-heading">Coming up</UiText>
            {upcoming.length ? (
              <ul className="bbb-community-event-list">
                {upcoming.map(event => <UpcomingEvent key={event.id} event={event} />)}
              </ul>
            ) : (
              <p className="bbb-community-upcoming-empty">No future dates in this curated list yet. Explore local calendars for the latest events.</p>
            )}
            <a className="bbb-community-calendar-link" href="https://thebedfordcitizen.org/" target="_blank" rel="noopener noreferrer">
              Explore Bedford news & events <UiArrowForwardIcon aria-hidden="true" fontSize="small" />
            </a>
          </aside>
        </UiBox>
      )}

      <section className="bbb-community-stories" aria-labelledby="community-stories-heading">
        <UiBox className="bbb-community-stories-head">
          <UiText id="community-stories-heading" component="h2" className="bbb-community-section-title">
            {category === 'All updates' ? 'More to explore' : category}
          </UiText>
          <UiText component="p" className="bbb-community-stories-hint">
            Curated updates & opportunities · links open original sources
          </UiText>
        </UiBox>
        <UiBox className="bbb-community-story-grid">
          {stories.map(story =>
            <CommunityStoryCard key={story.id} story={story} onNavigateProjects={onExploreProjects} />
          )}
        </UiBox>
      </section>

      <UiBox className="bbb-community-bottom">
        <UiBox className="bbb-community-bottom-copy">
          <UiText component="h2">Have a story or collaboration idea?</UiText>
          <UiText component="p">Explore our projects and find a problem worth working on together.</UiText>
        </UiBox>
        <UiButton className="bbb-community-bottom-action" variant="contained" onClick={onExploreProjects} endIcon={<UiArrowForwardIcon aria-hidden="true" />}>
          Explore projects
        </UiButton>
      </UiBox>
      <p className="bbb-community-editorial-note">
        Community is a student-curated selection, not a live emergency or road-closure alert service. Check the linked sources for the most current details.
      </p>
    </UiBox>
  )
}
