import { useEffect, useState } from 'react'
import PageHeading from './components/PageHeading'
import HalloweenTruss from './components/HalloweenTruss'
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
  // Older newsletters stored the Halloween feature as a main-article section.
  // Present it in the secondary rail without rewriting or deleting saved content.
  const isHalloweenFeature = (section: NewsletterSection) =>
    /halloween/i.test(section.heading) && /joke|skeleton|haunted|ghost/i.test(section.body)
  const mainDetails = issue.details.filter(section => section.placement !== 'sidebar' && !isHalloweenFeature(section))
  const sideDetails = issue.details.filter(section => section.placement === 'sidebar' || isHalloweenFeature(section))
  const articleSections = mainDetails.length > 0 ? mainDetails : issue.sections
  const contents = issue.sections.length > 0 ? issue.sections : mainDetails
  const isOctober2026 = issue.id.startsWith('2026-10') || /october\s+2026/i.test(issue.month)
  const hasSideRail = contents.length > 0 || sideDetails.length > 0 || isOctober2026
  const sectionId = (index: number) => `bbb-issue-${issue.id}-section-${index + 1}`
  return <section className={`newsletter-page newsletter-layout-${layout}`}>
    {issue.status !== 'published' && <p className="newsletter-private-banner">PRIVATE PREVIEW · {issue.status === 'draft' ? 'DRAFT' : 'IN REVIEW'} · NOT VISIBLE TO VISITORS</p>}
    <div className="newsletter-clean">
      <div className={hasSideRail ? 'newsletter-editorial-grid has-sidebar' : 'newsletter-editorial-grid'}>
        <div className="newsletter-editorial-main">
          <header className="newsletter-intro">
            <PageHeading eyebrow={`${issue.month.toUpperCase()} · ISSUE ${issue.number}`} title={issue.title || 'Untitled issue'} description={issue.description} />
          </header>
          <div className="newsletter-expand-panel">
            {articleSections.map((section, index) => <section className="design-problem" key={index} id={sectionId(index)}>
              <div className="expand-grid"><div><Typography component="h2" variant="h6">{section.heading}</Typography><Typography component="p" variant="body1">{section.body}</Typography></div></div>
              {(section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
            </section>)}
          </div>
        </div>
        {hasSideRail && <aside className="newsletter-editorial-aside" aria-label="Issue contents and related stories">
          {contents.length > 0 && <nav className="newsletter-issue-contents" aria-label="In this issue">
            <div className="newsletter-side-heading">IN THIS ISSUE</div>
            <ol className="newsletter-toc-list">
              {contents.map((section, index) => {
                const exactIndex = articleSections.findIndex(article => article.heading.trim().toLowerCase() === section.heading.trim().toLowerCase())
                const linkedIndex = exactIndex >= 0 ? exactIndex : (index < articleSections.length ? index : -1)
                return <li key={index}>
                {linkedIndex >= 0
                  ? <a href={`#${sectionId(linkedIndex)}`}>
                      <span className="newsletter-toc-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="newsletter-toc-content">
                        <span className="newsletter-toc-title">{section.heading || `Section ${index + 1}`}</span>
                        {section.body && <span className="newsletter-toc-description">{section.body}</span>}
                      </span>
                    </a>
                  : <span className="newsletter-toc-unlinked">
                      <span className="newsletter-toc-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="newsletter-toc-content">
                        <span className="newsletter-toc-title">{section.heading || `Section ${index + 1}`}</span>
                        {section.body && <span className="newsletter-toc-description">{section.body}</span>}
                      </span>
                    </span>}
              </li>})}
            </ol>
          </nav>}
          {sideDetails.length > 0 && <div className="newsletter-side-stories">
            <div className="newsletter-side-heading">ON THE SIDE</div>
            {sideDetails.map((section, index) => {
              const halloween = isHalloweenFeature(section)
              return <section className={halloween ? 'newsletter-side-story newsletter-halloween-feature' : 'newsletter-side-story'} key={index}>
                {halloween && <span className="newsletter-halloween-eyebrow" aria-hidden="true">🎃 CLUB CORNER</span>}
                {halloween && <HalloweenTruss />}
                <Typography component="h2" variant="subtitle1">{section.heading}</Typography>
                {halloween
                  ? <div className="newsletter-halloween-copy">{section.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, paragraphIndex) =>
                      <p className={/^(Why |Because )/i.test(paragraph.trim()) ? 'newsletter-halloween-joke' : undefined} key={paragraphIndex}>{paragraph}</p>
                    )}</div>
                  : <Typography component="p" variant="body2">{section.body}</Typography>}
                {(section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
              </section>
            })}
          </div>}
          {isOctober2026 && <section className="newsletter-nerd-facts" aria-label="Bedford dog park facts and sources">
            <div className="newsletter-side-heading">FOR THE CURIOUS</div>
            <div className="newsletter-nerd-fact">
              <span className="newsletter-nerd-fact-kicker">DID YOU KNOW? · 01</span>
              <h3>Nearly 20 registered dogs for every 100 households</h3>
              <p>Bedford had <strong>1,162 registered dogs</strong> and approximately <strong>6,000 households</strong> in August 2026.</p>
              <p className="newsletter-nerd-equation">1,162 ÷ 6,000 × 100 ≈ 19.4</p>
              <p className="newsletter-nerd-footnote">That’s about one registered dog per five households—not a measured percentage of dog-owning households, since some families have multiple dogs.</p>
              <a href="https://thebedfordcitizen.org/2026/08/bedford-home-to-many-four-legged-friends/" target="_blank" rel="noopener noreferrer">Read the dog registration report <span aria-hidden="true">↗</span></a>
            </div>
            <div className="newsletter-nerd-fact">
              <span className="newsletter-nerd-fact-kicker">DID YOU KNOW? · 02</span>
              <h3>Bedford once planned a dog park</h3>
              <p>The town formed a Dog Park Task Force in 2017, and Town Meeting approved <strong>$25,000</strong> toward a proposed park. Locations were studied, but the proposal also drew concerns about neighboring homes, environmental effects, and safety.</p>
              <p className="newsletter-nerd-footnote">The records establish serious public interest and planning—not that a dog park was the town’s most-requested addition or that a final cancellation vote occurred.</p>
              <div className="newsletter-nerd-links">
                <a href="https://www.bedfordma.gov/ArchiveCenter/ViewFile/Item/215" target="_blank" rel="noopener noreferrer">2018 town report <span aria-hidden="true">↗</span></a>
                <a href="https://cdn.thebedfordcitizen.org/wp-content/uploads/2018/05/ad-hoc-Dog-Park-Task-Force-Recommendations-to-the-Selectmen-05292018.pdf" target="_blank" rel="noopener noreferrer">Proposed sites <span aria-hidden="true">↗</span></a>
                <a href="https://thebedfordcitizen.org/2017/12/residents-voice-concerns-possible-dog-park-bedford/" target="_blank" rel="noopener noreferrer">Community debate <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </section>}
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
