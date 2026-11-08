import { useEffect, useState } from 'react'
import PageHeading from './components/PageHeading'
import Typography from '@mui/material/Typography'
import { supabase } from './supabase'
import roadSolution from './assets/road_solution.png'
import './newsletterStudio.css'
import './newsletterLayouts.css'

export type NewsletterMedia = {
  id: string
  type: 'image' | 'video'
  asset?: 'road-solution'
  storagePath?: string
  url?: string
  alt?: string
  caption?: string
}
export type NewsletterSection = { heading: string; body: string; media?: NewsletterMedia[]; placement?: 'main' | 'sidebar' }
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
  sections: [{ heading: '', body: '', media: [] }],
  details: [],
  footer: '',
  status: 'draft',
  published_at: null,
})

function embeddedVideoUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = url.pathname.split('/')[1]
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      const id = url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : url.searchParams.get('v')
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'vimeo.com' || host === 'www.vimeo.com') {
      const id = url.pathname.split('/')[1]
      return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  } catch {
    return null
  }
}
export { embeddedVideoUrl }

export function NewsletterMediaView({ media }: { media: NewsletterMedia }) {
  const [signedUrl, setSignedUrl] = useState('')
  const [loadingError, setLoadingError] = useState(false)
  useEffect(() => {
    let active = true
    setSignedUrl('')
    setLoadingError(false)
    if (media.storagePath) {
      void supabase.storage.from('newsletter-media').createSignedUrl(media.storagePath, 3600)
        .then(({ data, error }) => {
          if (!active) return
          setSignedUrl(data?.signedUrl ?? '')
          setLoadingError(Boolean(error))
        })
    }
    return () => { active = false }
  }, [media.storagePath])

  const imageUrl = media.asset === 'road-solution' ? roadSolution : signedUrl
  const embedded = media.type === 'video' && media.url ? embeddedVideoUrl(media.url) : null
  return <figure className="newsletter-media">
    {media.type === 'image' && imageUrl && <img loading="lazy" src={imageUrl} alt={media.alt || 'Newsletter illustration'} />}
    {media.type === 'video' && media.storagePath && signedUrl &&
      <video src={signedUrl} controls playsInline preload="metadata" aria-label={media.alt || 'Newsletter video'} />}
    {media.type === 'video' && embedded &&
      <div className="newsletter-video-frame"><iframe src={embedded} title={media.alt || 'Newsletter video'} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
    {(!imageUrl && media.type === 'image' || media.type === 'video' && !signedUrl && !embedded) &&
      <p className="newsletter-media-placeholder" role="status">{loadingError ? 'This attachment could not be loaded.' : 'Loading attachment…'}</p>}
    {media.caption && <figcaption>{media.caption}</figcaption>}
  </figure>
}

export type NewsletterLayout = 'article' | 'feature'

export function IssueView({ issue, layout = 'article' }: { issue: NewsletterIssue; layout?: NewsletterLayout }) {
  const mainDetails = issue.details.filter(section => section.placement !== 'sidebar')
  const sideDetails = issue.details.filter(section => section.placement === 'sidebar')
  const hasSideRail = issue.sections.length > 0 || sideDetails.length > 0
  const sectionId = (index: number) => `bbb-issue-${issue.id}-section-${index + 1}`
  return <section className={`newsletter-page newsletter-layout-${layout}`}>
    {issue.status !== 'published' && <p className="newsletter-private-banner">PRIVATE PREVIEW · {issue.status === 'draft' ? 'DRAFT' : 'IN REVIEW'} · NOT VISIBLE TO VISITORS</p>}
    <div className="newsletter-clean">
      <header className="newsletter-intro">
        <PageHeading eyebrow={`${issue.month.toUpperCase()} · ISSUE ${issue.number}`} title={issue.title || 'Untitled issue'} description={issue.description} />
      </header>
      <div className={hasSideRail ? 'newsletter-editorial-grid has-sidebar' : 'newsletter-editorial-grid'}>
        <div className="newsletter-editorial-main">
          <div className="newsletter-notes">
            <div className="newsletter-notes-head"><span>THE STORY</span><span>BUILD A BETTER BEDFORD</span></div>
            {issue.sections.map((section, index) => <article className="newsletter-note" key={index} id={sectionId(index)}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className="newsletter-section-content">
                <Typography component="h2" variant="h6">{section.heading}</Typography>
                <Typography component="p" variant="body1">{section.body}</Typography>
                {(section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
              </div>
            </article>)}
          </div>
          {mainDetails.length > 0 && <div className="newsletter-expand-panel">
            {mainDetails.map((section, index) => <section className="design-problem" key={index}>
              <div className="expand-grid"><div><Typography component="h2" variant="h6">{section.heading}</Typography><Typography component="p" variant="body1">{section.body}</Typography></div></div>
              {(section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
            </section>)}
          </div>}
        </div>
        {hasSideRail && <aside className="newsletter-editorial-aside" aria-label="Issue contents and related stories">
          {issue.sections.length > 0 && <nav className="newsletter-issue-contents" aria-label="In this issue">
            <div className="newsletter-side-heading">IN THIS ISSUE</div>
            <ol className="newsletter-toc-list">
              {issue.sections.map((section, index) => <li key={index}>
                <a href={`#${sectionId(index)}`}><span className="newsletter-toc-number">{String(index + 1).padStart(2, '0')}</span><span>{section.heading || `Section ${index + 1}`}</span></a>
              </li>)}
            </ol>
          </nav>}
          {sideDetails.length > 0 && <div className="newsletter-side-stories">
            <div className="newsletter-side-heading">ON THE SIDE</div>
            {sideDetails.map((section, index) => <section className="newsletter-side-story" key={index}>
              <Typography component="h2" variant="subtitle1">{section.heading}</Typography>
              <Typography component="p" variant="body2">{section.body}</Typography>
              {(section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
            </section>)}
          </div>}
        </aside>}
      </div>
      {issue.footer && <footer className="newsletter-disclaimer"><p>{issue.footer}</p></footer>}
    </div>
  </section>
}

export default function Newsletter() {
  const [issues, setIssues] = useState<NewsletterIssue[]>([])
  const [selected, setSelected] = useState('')
  const [mobileIssuesOpen, setMobileIssuesOpen] = useState(false)
  const [error, setError] = useState('')
  const refresh = async () => {
    // The public route always fetches published issues, regardless of login state.
    // Editing and hidden content belong exclusively to /admin.
    const query = supabase.from('newsletters')
      .select('id,month,number,title,description,sections,details,footer,status,published_at')
      .eq('status', 'published')
    const { data, error: loadError } = await query.order('id', { ascending: false })
    if (loadError) {
      setError('Newsletters could not be refreshed. Please try again.')
      return
    }
    setError('')
    const visible = ((data ?? []) as NewsletterIssue[]).filter(issue => issue.status === 'published')
    setIssues(visible)
    setSelected(previous => visible.some(issue => issue.id === previous) ? previous : (visible[0]?.id ?? ''))
  }
  useEffect(() => { void refresh() }, [])
  const chosen = issues.find(issue => issue.id === selected)
  return <div>
    <div className="newsletter-library">
      <aside className="newsletter-archive" aria-label="Newsletter issue library">
        <div className="archive-head">
          <div><span className="archive-kicker">BUILD A BETTER BEDFORD</span><h2>Newsletter archive</h2></div>
          <button className="archive-mobile-toggle" type="button" aria-expanded={mobileIssuesOpen} aria-controls="newsletter-issue-list" onClick={() => setMobileIssuesOpen(open => !open)}>
            {mobileIssuesOpen ? 'Hide issues −' : 'Browse issues +'}
          </button>
        </div>
        <nav id="newsletter-issue-list" className={mobileIssuesOpen ? 'archive-list is-open' : 'archive-list'} aria-label="Browse newsletter issues">
          {issues.map(issue =>
            <button key={issue.id} type="button" className={issue.id === selected ? 'archive-item selected' : 'archive-item'} aria-current={issue.id === selected ? 'page' : undefined} onClick={() => { setSelected(issue.id); setMobileIssuesOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              <span className="archive-month">{issue.month} <small>NO. {issue.number}</small></span>
              <strong>{issue.title}</strong>
            </button>)}
        </nav>
        <p className="archive-coming">Explore the latest published issues of Build a Better Bedford.</p>
      </aside>
      <div className="newsletter-reading-area">
        {error && <p role="status" className="newsletter-load-message">{error}</p>}
        {chosen ? <IssueView issue={chosen} /> : <div className="newsletter-empty"><PageHeading title="No published issues yet" description="Check back for updates from Build a Better Bedford." /></div>}
      </div>
    </div>
  </div>
}
