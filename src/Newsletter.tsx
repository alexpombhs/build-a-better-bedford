import { useEffect, useState } from 'react'
import PageHeading from './components/PageHeading'
import { supabase } from './supabase'
import NewsletterStudio from './NewsletterStudio'
import './newsletterStudio.css'

export type NewsletterSection = { heading: string; body: string }
export type NewsletterIssue = {
  id: string
  month: string
  number: string
  title: string
  description: string
  sections: NewsletterSection[]
  details: NewsletterSection[]
  footer: string
  status: 'draft' | 'in_review' | 'published'
  published_at: string | null
}

export const emptyIssue = (): NewsletterIssue => ({
  id: new Date().toISOString().slice(0, 7),
  month: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
  number: '03',
  title: '',
  description: '',
  sections: [{ heading: '', body: '' }],
  details: [],
  footer: '',
  status: 'draft',
  published_at: null,
})

const initialOctober: NewsletterIssue = {
  id: '2026-10', month: 'October 2026', number: '02',
  title: "We're official. Bridges are first.",
  description: 'Build a Better Bedford is now meeting regularly. We introduced it at the activity fair, held our first meeting, and voted on our first project. Bridges won.',
  sections: [
    { heading: 'Club update', body: 'BBB has started meeting regularly. Meetings are on Mondays, and our first topic is bridges.' },
    { heading: 'Activity fair', body: 'We had a table at the activity fair and talked with students about the projects we want to try this year.' },
    { heading: 'First meeting', body: "Members voted for bridges and agreed on a Monday meeting schedule. We'll compare bridge types before building and testing models." },
  ],
  details: [
    { heading: "We're official", body: "Build a Better Bedford has started its first project. We'll learn engineering through case studies, models, measurements, and local infrastructure questions." },
    { heading: 'At the activity fair', body: 'We introduced BBB and invited students to join.' },
    { heading: 'First up: bridges', body: "We'll explore structural mechanics, build bridge models, and compare their load capacity." },
  ],
  footer: 'Club leadership: Alex Pominova · Farah Semy · Julia Richards',
  status: 'published', published_at: null,
}

export function IssueView({ issue }: { issue: NewsletterIssue }) {
  return <section className="newsletter-page">
    <div className="newsletter-clean">
      <div className="newsletter-intro">
        <PageHeading eyebrow={`${issue.month.toUpperCase()} · ISSUE ${issue.number}`} title={issue.title || 'Untitled issue'} description={issue.description} />
      </div>
      <div className="newsletter-notes">
        <div className="newsletter-notes-head"><span>THE STORY</span><span>BUILD A BETTER BEDFORD</span></div>
        {issue.sections.map((section, index) => <article className="newsletter-note" key={index}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div><h2>{section.heading}</h2><p>{section.body}</p></div>
        </article>)}
        {issue.footer && <div className="newsletter-disclaimer"><p>{issue.footer}</p></div>}
      </div>
    </div>
    {issue.details.length > 0 && <div className="newsletter-expand-panel">
      {issue.details.map((section, index) => <section className="design-problem" key={index}>
        <p className="expand-kicker">{String(index + 1).padStart(2, '0')} · {section.heading.toUpperCase()}</p>
        <div className="expand-grid"><div><h2>{section.heading}</h2><p>{section.body}</p></div></div>
      </section>)}
    </div>}
  </section>
}

export default function Newsletter() {
  const [issues, setIssues] = useState<NewsletterIssue[]>([initialOctober])
  const [selected, setSelected] = useState(initialOctober.id)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [studioOpen, setStudioOpen] = useState(false)
  const [error, setError] = useState('')
  const refresh = async () => {
    const { data, error: loadError } = await supabase.from('newsletters')
      .select('id,month,number,title,description,sections,details,footer,status,published_at')
      .eq('status', 'published').order('id', { ascending: false })
    if (loadError) {
      setError('Published newsletters could not be refreshed. Showing the October issue.')
      return
    }
    setError('')
    const published = (data ?? []) as NewsletterIssue[]
    setIssues(published)
    setSelected(previous => published.some(issue => issue.id === previous) ? previous : (published[0]?.id ?? ''))
  }
  useEffect(() => { void refresh() }, [])
  const chosen = issues.find(issue => issue.id === selected)
  return <div>
    <div className="newsletter-public-toolbar">
      <button type="button" className="newsletter-editor-entry" onClick={() => setStudioOpen(v => !v)}>{studioOpen ? '← Back to newsletters' : 'Newsletter editor'}</button>
    </div>
    {studioOpen ? <NewsletterStudio onPublished={() => { setStudioOpen(false); void refresh() }} /> :
    <div className={archiveOpen ? 'newsletter-library archive-visible' : 'newsletter-library'}>
      <button className="newsletter-issue-tab" type="button" aria-expanded={archiveOpen} onClick={() => setArchiveOpen(v => !v)}>▤ <span>Browse issues</span></button>
      {archiveOpen && <div className="newsletter-archive-scrim" onClick={() => setArchiveOpen(false)} />}
      <aside className={archiveOpen ? 'newsletter-archive open' : 'newsletter-archive'} aria-label="Newsletter issue library">
        <div className="archive-head"><span>PUBLISHED ISSUES</span><button className="archive-close" type="button" onClick={() => setArchiveOpen(false)} aria-label="Close issue list">×</button></div>
        <nav className="archive-list" aria-label="Published newsletters">{issues.map(issue =>
          <button key={issue.id} type="button" className={issue.id === selected ? 'archive-item selected' : 'archive-item'} onClick={() => { setSelected(issue.id); setArchiveOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <span>{issue.month} <small>ISSUE {issue.number}</small></span><strong>{issue.title}</strong>
          </button>)}</nav>
        <p className="archive-coming">New issues appear here after they are published.</p>
      </aside>
      {error && <p role="status" className="newsletter-load-message">{error}</p>}
      {chosen ? <IssueView issue={chosen} /> : <div className="newsletter-empty"><PageHeading title="No published issues yet" description="Check back for updates from Build a Better Bedford." /></div>}
    </div>}
  </div>
}
