import { UiText } from './components/atoms/MuiPrimitives'
import NewsletterSidebarSection from './components/molecules/NewsletterSidebarSection'
import NewsletterRailHeading from './components/atoms/NewsletterRailHeading'
import { createElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { isNewsletterRichBody, newsletterBodyHtml, sanitizedNewsletterHtml } from './components/NewsletterRichEditor'
import PageHeading from './components/PageHeading'
import HalloweenTruss from './components/HalloweenTruss'
import ThanksgivingHorn from './components/ThanksgivingHorn'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
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
  /** Inline media floats within the story; undefined is left for older issues. */
  align?: 'left' | 'right'
}
export type NewsletterSectionStyle = 'default' | 'club-corner' | 'did-you-know' | 'halloween' | 'thanksgiving'
export type NewsletterColorTheme = 'default' | 'sage' | 'blue' | 'amber' | 'lavender'
export type NewsletterSection = {
  heading: string
  body: string
  media?: NewsletterMedia[]
  placement?: 'main' | 'sidebar'
  style?: NewsletterSectionStyle
  colorTheme?: NewsletterColorTheme
  summary?: string
}

// Legacy October content was displayed with a seasonal look before styles
// were editable. Preserve that rendering until an editor explicitly chooses
// a location or style. New content uses the saved settings only.
const isLegacyHalloween = (section: NewsletterSection) =>
  section.style == null && /halloween/i.test(section.heading) && /joke|skeleton|haunted|ghost/i.test(section.body)
export const newsletterSectionStyle = (section: NewsletterSection): NewsletterSectionStyle =>
  section.style ?? (isLegacyHalloween(section) ? 'halloween' : 'default')
export const newsletterColorTheme = (section: NewsletterSection): NewsletterColorTheme =>
  section.colorTheme ?? 'default'
export const newsletterSectionClass = (section: NewsletterSection) =>
  `newsletter-section-style-${newsletterSectionStyle(section)} newsletter-color-${newsletterColorTheme(section)}`
export const newsletterSectionPlacement = (section: NewsletterSection): 'main' | 'sidebar' =>
  section.placement ?? (isLegacyHalloween(section) ? 'sidebar' : 'main')

/** Editorial ordering rule: factual Did You Know panels always close the rail.
 * Reused by public rendering and Newsletter Studio when saving or loading. */
export const orderNewsletterDetails = (details: NewsletterSection[]): NewsletterSection[] => {
  const main = details.filter(section => newsletterSectionPlacement(section) === 'main')
  const side = details.filter(section => newsletterSectionPlacement(section) === 'sidebar')
  return [
    ...main,
    ...side.filter(section => newsletterSectionStyle(section) !== 'did-you-know'),
    ...side.filter(section => newsletterSectionStyle(section) === 'did-you-know'),
  ]
}
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
  sections: [],
  details: [{ heading: '', body: '', media: [], placement: 'main', style: 'default', colorTheme: 'default' }],
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
// A Google Maps contributor video cannot be played in a third-party iframe.
// Offer a labeled preview that takes readers to the exact original clip instead.
function externalGoogleMapsVideoUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !['google.com', 'www.google.com'].includes(url.hostname)) return null
    if (url.pathname !== '/search' || !url.hash.startsWith('#lpg=') || !url.hash.includes(',ik:')) return null
    return url.href
  } catch {
    return null
  }
}
export { embeddedVideoUrl, externalGoogleMapsVideoUrl }

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
  const googleMapsClip = media.type === 'video' && media.url ? externalGoogleMapsVideoUrl(media.url) : null
  return <figure className={`newsletter-media newsletter-media-aligned-${media.align === 'right' ? 'right' : 'left'}`}>
    {media.type === 'image' && imageUrl && <img loading="lazy" src={imageUrl} alt={media.alt || 'Newsletter illustration'} />}
    {media.type === 'video' && media.storagePath && signedUrl &&
      <video src={signedUrl} controls playsInline preload="metadata" aria-label={media.alt || 'Newsletter video'} />}
    {media.type === 'video' && embedded &&
      <div className="newsletter-video-frame"><iframe src={embedded} title={media.alt || 'Newsletter video'} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
    {googleMapsClip && <a className="newsletter-external-video" href={googleMapsClip} target="_blank" rel="noopener noreferrer"
      aria-label={(media.alt || 'Bridge video') + ' — watch the original clip on Google Maps (opens in new tab)'}>
      <span className="newsletter-external-video-poster">
        <span className="newsletter-external-video-source">CONTRIBUTOR VIDEO · GOOGLE MAPS · 0:12</span>
        <span className="newsletter-external-video-icon"><PlayCircleOutlineIcon aria-hidden="true" /></span>
        <span className="newsletter-external-video-overlay">Hart–Desiato Bridge</span>
        <span className="newsletter-external-video-subtitle">A look at the timber supports beneath the bridge</span>
      </span>
      <span className="newsletter-external-video-action">Watch the original video on Google Maps <OpenInNewIcon aria-hidden="true" fontSize="inherit" /></span>
      <span className="newsletter-external-video-description">Video opens on Google Maps; it cannot play directly on this site.</span>
    </a>}
    {(!imageUrl && media.type === 'image' || media.type === 'video' && !signedUrl && !embedded && !googleMapsClip) &&
      <p className="newsletter-media-placeholder" role="status">{loadingError ? 'This attachment could not be loaded.' : 'Loading attachment…'}</p>}
    {media.caption && <figcaption>{media.caption}</figcaption>}
  </figure>
}

export type NewsletterLayout = 'article' | 'feature'

// Rich content uses a small safe markup subset. Media tokens resolve to the
// issue's own uploaded assets and can appear between paragraphs.
function NewsletterRichBody({body,media=[]}:{body:string;media?:NewsletterMedia[]}){
  const safe=sanitizedNewsletterHtml(newsletterBodyHtml(body))
  const dom=new DOMParser().parseFromString(safe,'text/html')
  let index=0
  const convert=(node:Node):ReactNode=>{
    if(node.nodeType===3)return node.textContent
    if(node.nodeType!==1)return null
    const element=node as Element
    const mediaId=element.getAttribute('data-media-id')
    if(mediaId){
      const asset=media.find(item=>item.id===mediaId)
      return asset ? <NewsletterMediaView key={index++} media={asset}/> : null
    }
    const tag=element.tagName.toLowerCase()
    const tags=new Set(['p','div','h3','h4','strong','em','u','ul','ol','li','blockquote','br','a'])
    if(!tags.has(tag))return null
    const children=Array.from(element.childNodes).map(convert)
    // A media token can be inserted inside a paragraph by contentEditable.
    // Never nest a <figure> inside <p>: it is invalid HTML, and the browser
    // relocates the figure, often placing it above the text unexpectedly.
    if(tag==='p' && Array.from(element.children).some(child=>child.hasAttribute('data-media-id')))
      return createElement('div',{key:index++,className:'newsletter-rich-media-paragraph'},...children)
    if(tag==='a')return createElement('a',{key:index++,href:element.getAttribute('href') ?? undefined,target:'_blank',rel:'noopener noreferrer'},...children)
    return createElement(tag,{
      key:index++,
      // One safe, semantic newsletter introduction style survives sanitization.
      className:tag==='div' && element.classList.contains('newsletter-intro-block')
        ? 'newsletter-intro-block' : undefined,
    },...children)
  }
  return <div className="newsletter-article-copy newsletter-rich-copy newsletter-rich-media-layout">{Array.from(dom.body.childNodes).map(convert)}</div>
}
function NewsletterArticleBody({ body }: { body: string }) {
  // The editor contains meaningful line breaks, but not necessarily blank
  // lines. Render each text line as a real paragraph so CSS controls spacing.
  const lines = body.replace(/\r\n?/g, '\n').split('\n').map(line => line.trim()).filter(Boolean)
  const rolePattern = /^(Club Leader|Co-Leader|Club Advisor)\s*:?\s*(.*)$/i
  type TeamMember = { role: string; person: string }
  type Block = { type: 'paragraph'; text: string } | { type: 'team'; members: TeamMember[] }
  const blocks: Block[] = []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(rolePattern)
    if (!match) {
      blocks.push({ type: 'paragraph', text: lines[i] })
      continue
    }

    const role = match[1]
    // Support "Club Leader: Name" and an editor's "Club Leader" + next line.
    const person = match[2] || (i + 1 < lines.length && !rolePattern.test(lines[i + 1]) ? lines[++i] : '')
    const last = blocks[blocks.length - 1]
    if (last?.type === 'team') last.members.push({ role, person })
    else blocks.push({ type: 'team', members: [{ role, person }] })
  }

  const roleIcon = (role: string) => {
    const props = { fontSize: 'small' as const, 'aria-hidden': true as const }
    if (/advisor/i.test(role)) return <SchoolOutlinedIcon {...props} />
    if (/co-leader/i.test(role)) return <GroupsOutlinedIcon {...props} />
    return <EmojiEventsOutlinedIcon {...props} />
  }

  return <div className="newsletter-article-copy">
    {blocks.map((block, index) => block.type === 'team'
      ? <div className="newsletter-leadership-team" role="group" aria-label="Club leadership team" key={index}>
          {block.members.map(({ role, person }, memberIndex) =>
            <div className="newsletter-leadership-person" key={memberIndex}>
              <span className="newsletter-leadership-icon">{roleIcon(role)}</span>
              <span className="newsletter-leadership-role">{role}</span>
              <span className="newsletter-leadership-name">{person}</span>
            </div>)}
        </div>
      : <UiText component="p" variant="body1" key={index}>{block.text}</UiText>)}
  </div>
}

export function IssueView({ issue, layout = 'article', editorPreview = false }: { issue: NewsletterIssue; layout?: NewsletterLayout; editorPreview?: boolean }) {
  const mainDetails = issue.details.filter(section => newsletterSectionPlacement(section) === 'main')
  const sideDetails = orderNewsletterDetails(issue.details).filter(section => newsletterSectionPlacement(section) === 'sidebar')
  const articleSections = mainDetails.length > 0 ? mainDetails : issue.sections
  const contents = articleSections.filter(section => section.heading.trim()).map(section => ({...section, body: section.summary ?? issue.sections.find(entry => entry.heading.trim().toLowerCase() === section.heading.trim().toLowerCase())?.body ?? ''}))
  const isOctober2026 = issue.id.startsWith('2026-10') || /october\s+2026/i.test(issue.month)
  const hasSideRail = contents.length > 0 || sideDetails.length > 0 || isOctober2026
  const sectionId = (index: number) => `bbb-issue-${issue.id}-section-${index + 1}`
  return <section className={`newsletter-page newsletter-layout-${layout}`}>
    {!editorPreview && issue.status !== 'published' && <p className="newsletter-private-banner">PRIVATE PREVIEW · {issue.status === 'draft' ? 'DRAFT' : 'IN REVIEW'} · NOT VISIBLE TO VISITORS</p>}
    <div className="newsletter-clean">
      <div className={hasSideRail ? 'newsletter-editorial-grid has-sidebar' : 'newsletter-editorial-grid'}>
        <div className="newsletter-editorial-main">
          <header className="newsletter-intro">
            <PageHeading eyebrow={`${issue.month.toUpperCase()} · ISSUE ${issue.number}`} title={issue.title || 'Untitled issue'} description={issue.description} />
          </header>
          <div className="newsletter-expand-panel">
            {articleSections.map((section, index) => {
              const halloween = newsletterSectionStyle(section) === 'halloween'
              const thanksgiving = newsletterSectionStyle(section) === 'thanksgiving'
              return <section className={`design-problem ${newsletterSectionClass(section)}${halloween || thanksgiving ? ' newsletter-main-halloween-feature' : ''}`} key={index} id={sectionId(index)}>
                {newsletterSectionStyle(section) === 'club-corner' && <span className="newsletter-feature-kicker">CLUB CORNER</span>}
                {newsletterSectionStyle(section) === 'did-you-know' && <span className="newsletter-feature-kicker">DID YOU KNOW?</span>}
                {halloween && <div className="newsletter-main-seasonal"><span className="newsletter-feature-kicker">CLUB CORNER</span><HalloweenTruss /></div>}
                {thanksgiving && <div className="newsletter-main-seasonal"><span className="newsletter-feature-kicker">CLUB CORNER</span><ThanksgivingHorn /></div>}
                <div className="expand-grid"><div><UiText component="h2" variant="h6">{section.heading}</UiText>{isNewsletterRichBody(section.body) ? <NewsletterRichBody body={section.body} media={section.media}/> : <NewsletterArticleBody body={section.body} />}</div></div>
                {!isNewsletterRichBody(section.body) && (section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
              </section>
            })}
          </div>
        </div>
        {hasSideRail && <aside className="newsletter-editorial-aside" aria-label="Issue contents and related stories">
          {contents.length > 0 && <nav className="newsletter-issue-contents" aria-label="In this issue">
            <NewsletterRailHeading>In This Issue</NewsletterRailHeading>
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
            {sideDetails.map((section, index) => {
              const style = newsletterSectionStyle(section)
              const halloween = style === 'halloween'
              const thanksgiving = style === 'thanksgiving'
              const variant = style === 'did-you-know' ? 'did-you-know'
                : (style === 'club-corner' || halloween || thanksgiving) ? 'club-corner' : 'default'
              return <NewsletterSidebarSection
                key={index}
                variant={variant}
                title={section.heading}
                className={`${newsletterSectionClass(section)}${halloween || thanksgiving ? ' newsletter-halloween-feature' : ''}`}
                ornament={halloween ? <HalloweenTruss /> : thanksgiving ? <ThanksgivingHorn /> : undefined}>
                {isNewsletterRichBody(section.body)
                  ? thanksgiving
                    ? <div className="newsletter-halloween-copy newsletter-thanksgiving-copy"><NewsletterRichBody body={section.body} media={section.media} /></div>
                    : <NewsletterRichBody body={section.body} media={section.media} />
                  : halloween
                    ? <div className="newsletter-halloween-copy">{section.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, paragraphIndex) =>
                      <p className={/^(Why |Because )/i.test(paragraph.trim()) ? 'newsletter-halloween-joke' : undefined} key={paragraphIndex}>{paragraph}</p>
                    )}</div>
                  : <UiText component="p" variant="body2">{section.body}</UiText>}
                {!isNewsletterRichBody(section.body) && (section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
              </NewsletterSidebarSection>
            })}
          </div>}
          {isOctober2026 && <section className="newsletter-nerd-facts" aria-label="Did you know? Bedford dog facts">
            <div className="newsletter-side-heading">DID YOU KNOW?</div>
            <ol className="newsletter-nerd-fact-list">
              <li className="newsletter-nerd-fact">
              <h3>About one registered dog for every five Bedford households</h3>
              <p>Bedford had 1,162 registered dogs in August 2026—roughly 20 dogs for every 100 households.</p>
              <a href="https://thebedfordcitizen.org/2026/08/bedford-home-to-many-four-legged-friends/" target="_blank" rel="noopener noreferrer">Read more <span aria-hidden="true">↗</span></a>
              </li>
              <li className="newsletter-nerd-fact">
              <h3>Bedford once planned a dog park</h3>
              <p>The town formed a Dog Park Task Force and approved preliminary funding, but the proposal faced concerns about location and community impacts.</p>
              <div className="newsletter-nerd-links">
                <a href="https://www.bedfordma.gov/ArchiveCenter/ViewFile/Item/215" target="_blank" rel="noopener noreferrer">Read more <span aria-hidden="true">↗</span></a>
                <a href="https://cdn.thebedfordcitizen.org/wp-content/uploads/2018/05/ad-hoc-Dog-Park-Task-Force-Recommendations-to-the-Selectmen-05292018.pdf" target="_blank" rel="noopener noreferrer">Proposed locations <span aria-hidden="true">↗</span></a>
              </div>
              </li>
            </ol>
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
