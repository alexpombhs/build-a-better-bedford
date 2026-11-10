import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Newsletter from './Newsletter'
import NewsletterStudio from './NewsletterStudio'
import AboutPage from './AboutPage'
import SiteHeader from './components/SiteHeader'
import PageHeading from './components/PageHeading'
import ProjectCard from './components/ProjectCard'
import { UiActionButton, UiBox, UiIconButton } from './components/atoms/MuiPrimitives'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import './components/IdeaFlip.css'
import { EngineeringTabs, EngineeringWorkspace, EngineeringSectionIntro } from './EngineeringLab'
import heroLogo from './assets/logo.png'
import crosswalkIcon from './assets/crosswalk.png'
import dogparkIcon from './assets/dogpark.png'
import electricityIcon from './assets/electricity.png'
import roadworkIcon from './assets/roadwalks.png'
import bathroomIcon from './assets/bathroom.png'
import bikepathIcon from './assets/bikepath.png'
import floodIcon from './assets/flood.png'
import trailsIcon from './assets/trails.png'
import './newsletter.css'
import './editorial.css'
import './portfolio.css'

// Vite resolves these to hashed built assets when PNGs are in src/assets.
// The glob also permits checking out this branch before the image commit lands.
const homepageAssetFiles = import.meta.glob('./assets/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const homepageImage = (name: string): string | undefined => {
  const entry = Object.entries(homepageAssetFiles).find(([path]) => path.toLowerCase().endsWith('/' + name.toLowerCase()))
  return entry?.[1]
}


type Page = 'home' | 'about' | 'what-we-do' | 'projects' | 'lab' | 'newsletter' | 'join' | 'admin'

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
const pagePaths: Record<Page, string> = {
  home: '/', about: '/about', 'what-we-do': '/what-we-do', projects: '/projects',
  lab: '/lab', newsletter: '/newsletter', join: '/join', admin: '/admin',
}
const pageFromLocation = (): Page => {
  const pathname = window.location.pathname
  const relative = pathname.startsWith(basePath + '/') ? pathname.slice(basePath.length) : pathname
  const normalized = relative.replace(/\/+$/, '') || '/'
  return (Object.keys(pagePaths) as Page[]).find(page => pagePaths[page] === normalized) ?? 'home'
}

// Calculate the next Monday club meeting in Bedford's local time, not the viewer's timezone.
// On Mondays, keep today's date until the 3:30 PM meeting ends.
const upcomingMondayLabel = (now = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const date = new Date(Date.UTC(part('year'), part('month') - 1, part('day')))
  const daysToMonday = (8 - date.getUTCDay()) % 7
  const mondayMeetingEnded = daysToMonday === 0 &&
    (part('hour') > 15 || (part('hour') === 15 && part('minute') >= 30))
  date.setUTCDate(date.getUTCDate() + (mondayMeetingEnded ? 7 : daysToMonday))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(date)
}

type SubmittedIdea = { id:number; title:string; subtitle:string; description:string; submitter_name:string|null; photo_url:string|null }
type ProjectCard = {
  id?: number
  number: string
  icon?: string
  title: string
  fact: string
  question: string
  cta?: boolean
  isSubmitted?: boolean
  photoUrl?: string | null
  submitterName?: string | null
}
type IdeaForm = { title:string; subtitle:string; description:string; submitterName:string }
const emptyIdea: IdeaForm = { title:'', subtitle:'', description:'', submitterName:'' }

const projectProblems: ProjectCard[] = [
  {
    number: '01',
    icon: crosswalkIcon,
    title: "Crosswalk Safety",
    fact: "Three pedestrian deaths were documented in Bedford during 2022–2024.",
    question: "Have you ever stood at a crosswalk wondering whether a driver would actually stop? Speed limits, signs, and painted lines are supposed to help. But are they always enough? What makes one crossing safer than another, and how could we identify places that need attention before another accident happens?"
  },
  {
    number: '02',
    icon: dogparkIcon,
    title: "Where’s the Dog Park?",
    fact: "Bedford has over 1,100 registered dogs.",
    question: "Over 1,100 registered dogs in Bedford, but no dedicated dog park? Where do they all go to play? Could we design a place where dogs have room to run, owners can meet, and everyone else can enjoy walking trails too? What would make a location suitable?"
  },
  {
    number: '03',
    icon: electricityIcon,
    title: "Why Do Power Outages Happen?",
    fact: "Storms can disrupt Bedford's electricity supply.",
    question: "A storm arrives, the lights go out, and suddenly we realize how much we depend on electricity. But why do some neighborhoods lose power while others don't? Could better infrastructure, tree management, or alternative power systems make our community more resilient?"
  },
  {
    number: '04',
    icon: roadworkIcon,
    title: "Why Is This Road Closed Again?",
    fact: "Road repairs and utility projects repeatedly affect local streets.",
    question: "Have you ever seen a road repaired, only to find it dug up again a few months later? Why does that happen? Roads aren't just pavement—there are pipes, cables, and drainage systems underneath. Could better coordination reduce repeated construction, costs, and inconvenience?"
  },
  {
    number: '05',
    icon: bathroomIcon,
    title: "The Public Bathroom Problem",
    fact: "Public bathrooms must balance privacy, access, and space.",
    question: "Why are public bathrooms designed the way they are? At home, one bathroom works for everyone, but public buildings often have separate spaces and more complicated layouts. Could we rethink the design to improve privacy, accessibility, and efficiency while making everyone feel comfortable?"
  },
  {
    number: '06',
    icon: bikepathIcon,
    title: "Why Does the Sidewalk End?",
    fact: "Some Bedford walking and cycling connections are incomplete.",
    question: "Imagine walking somewhere when the sidewalk suddenly ends. What are you supposed to do next? Cross the road? Walk along the shoulder? Turn around? Why are some sidewalks disconnected, and how could we improve these missing links to make walking around Bedford easier and less risky?"
  },
  {
    number: '07',
    icon: trailsIcon,
    title: "Where Are the Trails?",
    fact: "Local trails and historic sites can be hard to find.",
    question: "Bedford has so many interesting trails and historic places, but how many of them do we actually know about? Some seem almost hidden in plain sight! Could better signs, maps, and connected routes make them easier to discover? Could engineering and technology help us explore our own town?"
  },
  {
    number: '08',
    icon: floodIcon,
    title: "Why Does This Spot Flood?",
    fact: "Heavy rain can overwhelm local drainage systems.",
    question: "Have you noticed how some places turn into puddles every time it rains, while others stay almost completely dry? Where does the water go, and why can't some drainage systems handle it? Could rain gardens, permeable pavement, or better drainage design make a difference?"
  },
  {
    number: '',
    cta: true,
    title: "YOUR IDEA HERE",
    fact: "Notice something in Bedford worth investigating?",
    question: "Add it to the list."
  },
]

const labels: Record<Page, string> = {
  home: 'Home',
  about: 'About',
  'what-we-do': 'What we do',
  projects: 'Projects',
  newsletter: 'Newsletter',
  join: 'Join the Club',
  lab: 'Lab',
  admin: 'Newsletter editor',
}

function App() {
  const [page, setPage] = useState<Page>(pageFromLocation)
  const [nextMeetingDate, setNextMeetingDate] = useState(upcomingMondayLabel)
  useEffect(() => {
    const refreshMeetingDate = () => setNextMeetingDate(upcomingMondayLabel())
    const intervalId = window.setInterval(refreshMeetingDate, 60_000)
    document.addEventListener('visibilitychange', refreshMeetingDate)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshMeetingDate)
    }
  }, [])
  const [projectPage, setProjectPage] = useState(0)
  const [projectTab, setProjectTab] = useState<'simulators'|'ideas'|'lab'|'hands-on'>(() => pageFromLocation() === 'lab' ? 'simulators' : 'ideas')

  // External citations open in another tab. Returning to this tab must leave
  // the reader in the same place, including after a browser page restore.
  useEffect(() => {
    const key = () => 'bbb-scroll:' + window.location.pathname
    let restoring = false
    let frameId = 0
    const read = () => {
      try {
        const y = Number(window.sessionStorage.getItem(key()))
        return Number.isFinite(y) && y > 0 ? y : 0
      } catch { return 0 }
    }
    const save = () => {
      if (restoring) return
      try { window.sessionStorage.setItem(key(), String(window.scrollY)) } catch { /* optional */ }
    }
    const restore = () => {
      window.cancelAnimationFrame(frameId)
      const y = read()
      if (!y || Math.abs(window.scrollY - y) < 2) return
      restoring = true
      let attempts = 0
      const step = () => {
        window.scrollTo({top:y,behavior:'auto'})
        if (Math.abs(window.scrollY - y) > 2 && ++attempts < 60) {
          frameId = window.requestAnimationFrame(step)
        } else {
          restoring = false
        }
      }
      frameId = window.requestAnimationFrame(step)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save()
      else restore()
    }
    const onPageShow = () => restore()
    window.addEventListener('scroll', save, {passive:true})
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('pagehide', save)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', save)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('pagehide', save)
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const next = pageFromLocation()
      setPage(next)
      if (next === 'lab') setProjectTab('simulators')
      if (next === 'projects') setProjectTab('ideas')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const [ideaOpen, setIdeaOpen] = useState(false)
  const [flippedIdeas, setFlippedIdeas] = useState<string[]>([])
  const [ideaForm, setIdeaForm] = useState<IdeaForm>(emptyIdea)
  const [ideaPhoto, setIdeaPhoto] = useState<File | null>(null)
  const [ideaPhotoPreview, setIdeaPhotoPreview] = useState('')
  const [submittedIdeas, setSubmittedIdeas] = useState<SubmittedIdea[]>([])
  const [submittingIdea, setSubmittingIdea] = useState(false)
  const [ideaMessage, setIdeaMessage] = useState('')
  const [editingIdeaId, setEditingIdeaId] = useState<number | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [visitStats, setVisitStats] = useState({ total: 0, today: 0 })

  // Privacy-friendly analytics: keep a random ID in this browser, hash it before
  // sending it to Supabase, and never collect names, emails, or precise location.
  useEffect(() => {
    const recordVisit = async () => {
      try {
        const storageKey = 'bbb-anonymous-visitor'
        let anonymousId = localStorage.getItem(storageKey)
        if (!anonymousId) {
          anonymousId = crypto.randomUUID()
          localStorage.setItem(storageKey, anonymousId)
        }
        const bytes = new TextEncoder().encode(anonymousId)
        const digest = await crypto.subtle.digest('SHA-256', bytes)
        const visitorId = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
        await supabase.from('page_visits').insert({ visitor_id: visitorId, page })
        const { data: stats } = await supabase.rpc('get_public_visit_stats')
        const row = Array.isArray(stats) ? stats[0] : stats
        if (row) setVisitStats({ total: Number(row.total_unique || 0), today: Number(row.today_unique || 0) })
      } catch (error) {
        console.warn('Anonymous analytics unavailable:', error)
      }
    }
    recordVisit()
  }, [page])
  const projectsPerPage = 6
  const submittedProjectCards: ProjectCard[] = submittedIdeas.map((idea) => ({
    id: idea.id,
    number: 'NEW',
    isSubmitted: true,
    title: idea.title,
    fact: idea.subtitle,
    question: idea.description,
    photoUrl: idea.title.trim().toLowerCase() === 'turning electronics into safety guards' ? null : idea.photo_url,
    submitterName: idea.submitter_name,
  }))
  const regularProjects = [...submittedProjectCards, ...projectProblems.filter(problem => !problem.cta)]
  const projectPageCount = Math.max(1, Math.ceil(regularProjects.length / projectsPerPage))
  const visibleProjects = regularProjects.slice(projectPage * projectsPerPage, (projectPage + 1) * projectsPerPage)
  const toggleIdea = (key: string) => setFlippedIdeas(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key])

  useEffect(() => {
    supabase.from('project_ideas').select('id,title,subtitle,description,submitter_name,photo_url').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const uniqueIdeas = Array.from(new Map((data as SubmittedIdea[]).map(idea => [idea.id, idea])).values())
          setSubmittedIdeas(uniqueIdeas)
        }
      })
  }, [])

  const updateIdea = (field: keyof IdeaForm, value: string) => setIdeaForm(form => ({ ...form, [field]: value }))

  const openNewIdea = () => {
    setEditingIdeaId(null)
    setExistingPhotoUrl(null)
    setIdeaForm(emptyIdea)
    chooseIdeaPhoto(null)
    setIdeaMessage('')
    setIdeaOpen(true)
  }

  const openEditIdea = (idea: SubmittedIdea) => {
    setEditingIdeaId(idea.id)
    setExistingPhotoUrl(idea.photo_url)
    setIdeaForm({
      title: idea.title,
      subtitle: idea.subtitle,
      description: idea.description,
      submitterName: idea.submitter_name || '',
    })
    chooseIdeaPhoto(null)
    setIdeaMessage('')
    setIdeaOpen(true)
  }

  const closeIdeaModal = () => {
    setIdeaOpen(false)
    setEditingIdeaId(null)
    setExistingPhotoUrl(null)
    setIdeaForm(emptyIdea)
    chooseIdeaPhoto(null)
    setIdeaMessage('')
  }

  const chooseIdeaPhoto = (file: File | null) => {
    if (ideaPhotoPreview) URL.revokeObjectURL(ideaPhotoPreview)
    setIdeaPhoto(file)
    setIdeaPhotoPreview(file ? URL.createObjectURL(file) : '')
  }

  const submitIdea = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!ideaForm.title.trim() || !ideaForm.subtitle.trim() || !ideaForm.description.trim()) return
    setSubmittingIdea(true); setIdeaMessage('')
    let photoUrl: string | null = editingIdeaId ? existingPhotoUrl : null
    if (ideaPhoto) {
      const safeName = ideaPhoto.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('project-idea-photos').upload(path, ideaPhoto)
      if (uploadError) { setIdeaMessage('Photo upload failed. Please try again.'); setSubmittingIdea(false); return }
      photoUrl = supabase.storage.from('project-idea-photos').getPublicUrl(path).data.publicUrl
    }
    const ideaPayload = {
      title: ideaForm.title.trim(), subtitle: ideaForm.subtitle.trim(), description: ideaForm.description.trim(),
      submitter_name: ideaForm.submitterName.trim() || null, photo_url: photoUrl,
    }
    const ideaQuery = editingIdeaId
      ? supabase.from('project_ideas').update(ideaPayload).eq('id', editingIdeaId)
      : supabase.from('project_ideas').insert(ideaPayload)
    const { error } = await ideaQuery.select('id,title,subtitle,description,submitter_name,photo_url').single()
    if (error) setIdeaMessage('Could not submit your idea. Please try again.')
    else {
      // Reload from Supabase instead of appending locally. This keeps one canonical
      // copy of each persisted idea even if development effects/refetches run twice.
      const { data: refreshedIdeas } = await supabase
        .from('project_ideas')
        .select('id,title,subtitle,description,submitter_name,photo_url')
        .order('created_at', { ascending: false })
      if (refreshedIdeas) {
        const uniqueIdeas = Array.from(new Map((refreshedIdeas as SubmittedIdea[]).map(idea => [idea.id, idea])).values())
        setSubmittedIdeas(uniqueIdeas)
      }
      const successMessage = editingIdeaId ? 'Idea updated!' : 'Idea added!'
      setIdeaForm(emptyIdea); chooseIdeaPhoto(null); setIdeaMessage(successMessage)
      setTimeout(() => { closeIdeaModal() }, 700)
    }
    setSubmittingIdea(false)
  }

  const joinClub = () => {
    window.open('https://forms.gle/ejjaRZzo5HMMtkVD7', '_blank', 'noopener,noreferrer')
  }

  const go = (next: Page) => {
    const path = `${basePath}${pagePaths[next]}`
    if (window.location.pathname !== path) {
      // An intentional in-app navigation starts at the top; returning from
      // another browser tab is not an intentional navigation.
      try { window.sessionStorage.removeItem('bbb-scroll:' + path) } catch { /* optional */ }
      window.history.pushState(null, '', path)
    }
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <main className="site-shell">
    <SiteHeader
      active={page === 'projects' || page === 'lab' ? 'projects' : page === 'newsletter' ? 'newsletter' : page === 'about' ? 'about' : 'home'}
      onNavigate={section => {
        if (section === 'projects') { setProjectTab('ideas'); go('projects') }
        else go(section)
      }}
      onJoin={joinClub}
    />

    {page === 'home' && <UiBox className="portfolio-home">
      <UiBox className="portfolio-hero">
        <PageHeading className="portfolio-hero-copy" title="Build a Better Bedford" description="A student-led civil engineering club exploring structural engineering, design, and local infrastructure through research, modeling, and hands-on projects." />
        {homepageImage("bridge_sketch_64.png") ? <img className="portfolio-hero-sketch" src={homepageImage("bridge_sketch_64.png")} alt="Conceptual pen sketch of a truss bridge" /> : <div className="portfolio-missing-sketch" role="status">Bridge sketch unavailable</div>}
      </UiBox>
      <UiBox className="portfolio-projects">
        <UiActionButton className="portfolio-project portfolio-bridge" onClick={() => {go('projects');setProjectTab('hands-on')}}>
          {homepageImage("bridge_photo_64.png") ? <img src={homepageImage("bridge_photo_64.png")} alt="Steel truss bridge photographed from below" /> : <span className="portfolio-missing-image">Bridge photo not found</span>}
          <span className="portfolio-project-copy"><strong>01 / Bridge Project</strong><small>STRUCTURAL MECHANICS · CURRENT PROJECT</small></span>
          <span className="portfolio-project-arrow" aria-hidden="true">→</span>
        </UiActionButton>
        <UiActionButton className="portfolio-project portfolio-lab" onClick={() => {setProjectTab('simulators');go('projects')}}>
          {homepageImage("bridge_blueprint_64.png") ? <img src={homepageImage("bridge_blueprint_64.png")} alt="Technical line drawing showing truss bridge elevations and details" /> : <span className="portfolio-missing-image">Bridge blueprint not found</span>}
          <span className="portfolio-project-copy"><strong>02 / Engineering Lab</strong><small>SIMULATIONS · EXPERIMENTS · DESIGN TOOLS</small></span>
          <span className="portfolio-project-arrow" aria-hidden="true">→</span>
        </UiActionButton>
      </UiBox>
      <UiBox className="portfolio-details">
        <UiBox className="portfolio-detail"><span className="portfolio-detail-icon" aria-hidden="true"><CalendarMonthOutlinedIcon fontSize="inherit" /></span><UiBox><small>NEXT MEETING</small><strong>{nextMeetingDate}</strong><p>2:30–3:30 PM · Guidance Office</p></UiBox></UiBox>
        <UiBox className="portfolio-detail"><span className="portfolio-detail-icon" aria-hidden="true"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h20M2 17h20M2 20h20"/><path d="M3 8v9m18-9v9M9 8v9m6-9v9"/><path d="m3 8 6 9 6-9 6 9"/></svg></span><UiBox><small>CURRENT FOCUS</small><strong>Bridge Design &amp; Testing</strong><p>Structural systems, materials, loads, and real-world examples.</p></UiBox></UiBox>
        <UiBox className="portfolio-detail"><span className="portfolio-detail-icon" aria-hidden="true"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14.5c1 1.5 2.4 2.3 4 2.3s3-.8 4-2.3"/><path d="M8.5 9.5h.01M15.5 9.5h.01" strokeWidth="2.6"/></svg></span><UiBox><strong>Everyone’s welcome</strong><p>No engineering experience needed. Just curiosity.</p></UiBox></UiBox>
      </UiBox>
    </UiBox>}

    {page === 'newsletter' && <Newsletter />}
    {page === 'admin' && <NewsletterStudio onPublished={() => go('newsletter')} />}

    {(page === 'projects' || page === 'lab') && <section className="projects-page">
      <div className="projects-heading projects-toolbar">
        <EngineeringTabs active={projectTab} onChange={tab => { setProjectTab(tab); go('projects') }} />
      </div>
      <EngineeringSectionIntro tab={projectTab} actions={projectTab === 'ideas' ? (
<div className="ideas-toolbar"><div className="project-pagination" aria-label="Project pages">
        <UiIconButton className="pagination-arrow" onClick={() => setProjectPage(page => Math.max(0, page - 1))} disabled={projectPage === 0} aria-label="Previous project page" size="small"><span aria-hidden="true">←</span></UiIconButton>
        <div className="pagination-pages">
          {Array.from({ length: projectPageCount }, (_, index) =>
            <UiIconButton key={index} className={projectPage === index ? 'pagination-page active' : 'pagination-page'} onClick={() => setProjectPage(index)} aria-label={`Project page ${index + 1}`} aria-current={projectPage === index ? 'page' : undefined} size="small">{index + 1}</UiIconButton>
          )}
        </div>
        <UiIconButton className="pagination-arrow" onClick={() => setProjectPage(page => Math.min(projectPageCount - 1, page + 1))} disabled={projectPage === projectPageCount - 1} aria-label="Next project page" size="small"><span aria-hidden="true">→</span></UiIconButton>
      <UiIconButton className="idea-add-toolbar" onClick={openNewIdea} aria-label="Add an idea" title="Add an idea" size="small"><span aria-hidden="true" className="idea-add-glyph">+</span></UiIconButton></div></div>
      ) : undefined} />
      {projectTab === 'ideas' ? <>
      <div className="problem-grid">
        {visibleProjects.map(problem => {
          const key = problem.isSubmitted ? `submitted-${problem.id}` : `project-${problem.number}`
          const flipped = flippedIdeas.includes(key)
          return <ProjectCard variant="idea" className={`bbb-flip-card ${flipped ? 'is-flipped' : ''}`} key={key}>
            <div className="bbb-flip-inner">
              <div className="bbb-flip-front">
                <div className={problem.photoUrl ? 'bbb-idea-feature has-photo' : 'bbb-idea-feature'}>
                  {problem.photoUrl ? <img src={problem.photoUrl} alt="" loading="lazy" /> : <div className="bbb-idea-feature-text">
                    <span>{problem.isSubmitted ? 'COMMUNITY SUBMISSION' : 'BEDFORD / FIELD NOTES'}</span>
                    <strong>{problem.isSubmitted ? 'NEW' : problem.number}</strong>
                  </div>}
                </div>
                <div className="bbb-idea-copy">
                  <h2>{problem.title}</h2>
                  <p className="problem-fact">{problem.fact}</p>
                  {problem.submitterName && <p className="idea-byline">Idea by {problem.submitterName}</p>}
                  <button type="button" className="bbb-flip-action" onClick={() => toggleIdea(key)} aria-label={`Read more about ${problem.title}`}>Read more <span aria-hidden="true">→</span></button>
                </div>
              </div>
              <div className="bbb-flip-back" aria-hidden={!flipped}>
                <div className="bbb-flip-back-copy">
                  <span className="bbb-flip-kicker">THE IDEA</span>
                  <h2>{problem.title}</h2>
                  <p className="problem-question">{problem.question}</p>
                  <button type="button" className="bbb-flip-action" onClick={() => toggleIdea(key)} tabIndex={flipped ? 0 : -1} aria-label={`Return to summary of ${problem.title}`}>← Back</button>
                </div>
              </div>
            </div>
            {problem.isSubmitted && problem.id != null && <button className="idea-edit bbb-flip-edit" onClick={() => {
              const idea = submittedIdeas.find(item => item.id === problem.id)
              if (idea) openEditIdea(idea)
            }} aria-label={`Edit ${problem.title}`} title="Edit idea">✎</button>}
          </ProjectCard>
        })}
      </div>




      </> : <EngineeringWorkspace tab={projectTab} />}

      {ideaOpen && <div className="idea-modal-backdrop" onMouseDown={closeIdeaModal}>
        <div className="idea-modal" role="dialog" aria-modal="true" aria-labelledby="idea-form-title" onMouseDown={e => e.stopPropagation()}>
          <div className="idea-modal-head"><div><p className="eyebrow">{editingIdeaId ? 'EDIT PROBLEM LAB IDEA' : 'ADD TO THE PROBLEM LAB'}</p><h2 id="idea-form-title">{editingIdeaId ? 'Edit your idea.' : 'Bring your idea.'}</h2></div><button className="idea-close" onClick={closeIdeaModal} aria-label="Close">×</button></div>
          <div className="idea-builder">
            <form className="idea-form" onSubmit={submitIdea}>
              <label>Title<input required maxLength={120} value={ideaForm.title} onChange={e => updateIdea('title', e.target.value)} placeholder="Why does this keep happening?" /></label>
              <label>Subtitle / starting fact<input required maxLength={220} value={ideaForm.subtitle} onChange={e => updateIdea('subtitle', e.target.value)} placeholder="A short fact or observation" /></label>
              <label>Description<textarea required maxLength={2000} rows={5} value={ideaForm.description} onChange={e => updateIdea('description', e.target.value)} placeholder="What should we investigate?" /></label>
              <label>Your name <span>(optional)</span><input maxLength={100} value={ideaForm.submitterName} onChange={e => updateIdea('submitterName', e.target.value)} placeholder="Name" /></label>
              <div className="photo-field"><span className="photo-label">Photo <small>(optional · JPG, PNG or WebP · max 5 MB)</small></span>
                <label className={ideaPhoto ? 'photo-dropzone has-file' : 'photo-dropzone'}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseIdeaPhoto(e.target.files?.[0] || null)} />
                  <span className="upload-icon" aria-hidden="true">↑</span>
                  <span className="upload-copy"><strong>{ideaPhoto ? 'Change photo' : 'Upload a photo'}</strong><small>{ideaPhoto ? ideaPhoto.name : 'Click to browse from your device'}</small></span>
                </label>
                {ideaPhoto && <button type="button" className="remove-photo" onClick={() => chooseIdeaPhoto(null)}>Remove photo</button>}
              </div>
              <button type="submit" className="idea-submit" disabled={submittingIdea}>{submittingIdea ? (editingIdeaId ? 'Saving changes…' : 'Adding idea…') : (editingIdeaId ? 'Save changes →' : 'Add idea to the board →')}</button>
              {ideaMessage && <p className="idea-message" role="status">{ideaMessage}</p>}
            </form>
            <div className="idea-preview-wrap">
              <p className="preview-label">LIVE PREVIEW</p>
              <article className="problem-card submitted-project-card idea-preview">
                <span className="problem-index">NEW</span>
                <div className="problem-card-top"><div className="problem-heading">
                  {ideaPhotoPreview || existingPhotoUrl ? <div className="road-sign submitted-photo"><img src={ideaPhotoPreview || existingPhotoUrl || ''} alt="Uploaded preview" /></div> : <div className="road-sign submitted-placeholder"><span>?</span></div>}
                  <h2>{ideaForm.title || 'Your idea title'}</h2>
                </div></div>
                <p className="problem-fact">{ideaForm.subtitle || 'Your short starting fact or observation appears here.'}</p>
                <p className="problem-question">{ideaForm.description || 'Describe the Bedford problem, question, or place you think is worth investigating.'}</p>
                {ideaForm.submitterName && <p className="idea-byline">Idea by {ideaForm.submitterName}</p>}
              </article>
            </div>
          </div>
        </div>
      </div>}
    </section>}

    {page === 'about' && <AboutPage onJoin={joinClub} />}

    {page !== 'home' && page !== 'newsletter' && page !== 'projects' && page !== 'lab' && page !== 'admin' && page !== 'about' && <section className="coming-page">
      <p className="eyebrow">{labels[page]}</p>
      <h1>Coming soon.</h1>
      <p>We’re preparing this part of Build a Better Bedford.</p>
      <button className="quiet-link" onClick={() => go('home')}>← Back home</button>
    </section>}

    <footer>Unique visitors: {visitStats.total} visitors total / {visitStats.today} visitors today</footer>
  </main>
}
export default App
