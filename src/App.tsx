import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Newsletter from './Newsletter'
import AboutPage from './AboutPage'
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

type Page = 'home' | 'about' | 'what-we-do' | 'projects' | 'newsletter' | 'join'
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

const focusAreas = [
  ['01', 'Local infrastructure', 'Observe Bedford streets, crossings, trails, drainage, and public spaces.'],
  ['02', 'Engineering + physics', 'Learn why structures work through calculations, models, building, and testing.'],
  ['03', 'Design + CAD', 'Turn ideas into sketches, digital models, and practical design concepts.'],
]


const projectProblems: ProjectCard[] = [
  {
    number: '01',
    icon: crosswalkIcon,
    title: "Can Bedford Crosswalks Be Safer?",
    fact: "Three pedestrian deaths were documented in Bedford during 2022–2024.",
    question: "Could better visibility, narrower crossings, and safer street geometry reduce risk?"
  },
  {
    number: '02',
    icon: dogparkIcon,
    title: "Where’s the Dog Park?",
    fact: "Bedford has over 1,100 registered dogs.",
    question: "Could a dedicated park create a safer space for dogs and owners?"
  },
  {
    number: '03',
    icon: electricityIcon,
    title: "Why Do Outages Happen?",
    fact: "Storms can disrupt Bedford's electricity supply.",
    question: "Could tree management and resilient grid design help prevent outages?"
  },
  {
    number: '04',
    icon: roadworkIcon,
    title: "Why Is This Road Closed Again?",
    fact: "Road repairs and utility projects repeatedly affect local streets.",
    question: "Could better project coordination reduce repeat roadwork?"
  },
  {
    number: '05',
    icon: bathroomIcon,
    title: "Can Public Bathrooms Work Better?",
    fact: "Public bathrooms must balance privacy, access, and space.",
    question: "Could more flexible layouts improve comfort and accessibility?"
  },
  {
    number: '06',
    icon: bikepathIcon,
    title: "Why Does the Sidewalk End?",
    fact: "Some Bedford walking and cycling connections are incomplete.",
    question: "How could missing links be made safer and easier to navigate?"
  },
  {
    number: '07',
    icon: trailsIcon,
    title: "Where Are Bedford’s Hidden Trails?",
    fact: "Local trails and historic sites can be hard to find.",
    question: "Could better signs and maps make these places easier to explore?"
  },
  {
    number: '08',
    icon: floodIcon,
    title: "Why Does This Spot Flood?",
    fact: "Heavy rain can overwhelm local drainage systems.",
    question: "Could grading and green infrastructure help manage runoff?"
  },
  {
    number: '',
    cta: true,
    title: "YOUR IDEA HERE",
    fact: "Have an idea for a better Bedford?",
    question: "Share a local problem worth exploring, designing, or testing."
  },
]

const labels: Record<Page, string> = {
  home: 'Home',
  about: 'About',
  'what-we-do': 'What we do',
  projects: 'Projects',
  newsletter: 'Newsletter',
  join: 'Join the Club',
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [projectPage, setProjectPage] = useState(0)
  const [projectTab, setProjectTab] = useState<'simulators'|'ideas'|'lab'|'hands-on'>('ideas')
  const [ideaOpen, setIdeaOpen] = useState(false)
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
  const ideaCard = projectProblems.find(problem => problem.cta)!
  const submittedProjectCards: ProjectCard[] = submittedIdeas.map((idea) => ({
    id: idea.id,
    number: 'NEW',
    isSubmitted: true,
    title: idea.title,
    fact: idea.subtitle,
    question: idea.description,
    photoUrl: idea.photo_url,
    submitterName: idea.submitter_name,
  }))
  // Community submissions come first, followed by the built-in project prompts.
  const regularProjects = [...submittedProjectCards, ...projectProblems.filter(problem => !problem.cta)]
  // Six cards total per page: five projects + the always-visible idea CTA.
  const regularProjectsPerPage = projectsPerPage - 1
  const projectPageCount = Math.max(1, Math.ceil(regularProjects.length / regularProjectsPerPage))
  const pageProjects = regularProjects.slice(
    projectPage * regularProjectsPerPage,
    (projectPage + 1) * regularProjectsPerPage,
  )
  // The CTA occupies one of the six grid slots on every page.
  const visibleProjects = [...pageProjects, ideaCard].slice(0, projectsPerPage)

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
    setPage(next)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <main className="site-shell">
    <header className="topbar">
      <button className="identity identity-button" onClick={() => go('home')} aria-label="Build a Better Bedford home">
        <span className="brand-text">Build a Better Bedford</span>
      </button>

      <button className="menu-toggle" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>

      <nav className={menuOpen ? 'nav-menu open' : 'nav-menu'} aria-label="Main navigation">
        {(['home','about','what-we-do','projects','newsletter'] as Page[]).map(item =>
          <button key={item} className={page === item ? 'nav-button active-link' : 'nav-button'} onClick={() => go(item)}>{labels[item]}</button>
        )}
        <button className="join-link" onClick={joinClub}>Join the Club</button>
      </nav>
    </header>

    {page === 'home' && <section className="viewport">
      <div className="hero-logo-wrap">
        <img className="hero-logo-image" src={heroLogo} alt="Build a Better Bedford Civil Engineering and Community Design Club logo" />
      </div>

      <div className="home-content">
        <p className="eyebrow">STUDENT-LED · BEDFORD, MASSACHUSETTS</p>
        <p className="lede">We explore local infrastructure, learn the engineering behind it, and turn observations into ideas we can sketch, model, build, and test.</p>

        <div className="focus">
          {focusAreas.map(([number,title,text]) => <article className="focus-row" key={number}>
            <span className="number">{number}</span>
            <div><h2>{title}</h2><p>{text}</p></div>
          </article>)}
        </div>

        <div className="actions">
          <button className="primary" onClick={joinClub}>Join the club <span>→</span></button>
          <button className="quiet-link" onClick={() => go('about')}>Learn more <span>→</span></button>
        </div>
        <p className="about-line"><strong>No experience required.</strong> We learn together through real examples, design tools, models, and conversations with professionals.</p>
      </div>
    </section>}

    {page === 'newsletter' && <Newsletter />}

    {page === 'projects' && <section className="projects-page">
      <div className="projects-heading projects-toolbar">
        <EngineeringTabs active={projectTab} onChange={setProjectTab} />
      </div>
      <EngineeringSectionIntro tab={projectTab} actions={projectTab === 'ideas' && projectPageCount > 1 ? (
<div className="project-pagination" aria-label="Project pages">
        <button
          className="pagination-arrow"
          onClick={() => setProjectPage(page => Math.max(0, page - 1))}
          disabled={projectPage === 0}
          aria-label="Previous project page"
        >←</button>
        <div className="pagination-pages">
          {Array.from({ length: projectPageCount }, (_, index) =>
            <button
              key={index}
              className={projectPage === index ? 'pagination-page active' : 'pagination-page'}
              onClick={() => setProjectPage(index)}
              aria-label={`Project page ${index + 1}`}
              aria-current={projectPage === index ? 'page' : undefined}
            >{index + 1}</button>
          )}
        </div>
        <button
          className="pagination-arrow"
          onClick={() => setProjectPage(page => Math.min(projectPageCount - 1, page + 1))}
          disabled={projectPage === projectPageCount - 1}
          aria-label="Next project page"
        >→</button>
      </div>
      ) : undefined} />
      {projectTab === 'ideas' ? <>
      <div className="problem-grid">
        {visibleProjects.map(problem => <article className={problem.cta ? 'problem-card problem-card-cta' : problem.isSubmitted ? 'problem-card submitted-project-card' : 'problem-card'} key={problem.cta ? 'idea-cta' : problem.isSubmitted ? `submitted-${problem.id}` : `project-${problem.number}`}>
          {!problem.cta && <span className={problem.isSubmitted ? 'problem-index problem-index-new' : 'problem-index'}>{problem.number}</span>}
          {problem.isSubmitted && problem.id != null && <button className="idea-edit" onClick={() => {
            const idea = submittedIdeas.find(item => item.id === problem.id)
            if (idea) openEditIdea(idea)
          }} aria-label={`Edit ${problem.title}`} title="Edit idea">✎</button>}
          <div className="problem-card-top">
            <div className={problem.cta ? 'problem-heading problem-heading-cta' : 'problem-heading'}>
              {problem.cta
                ? <div className="idea-mark">?</div>
                : problem.photoUrl
                  ? <div className="road-sign submitted-photo"><img src={problem.photoUrl} alt="" /></div>
                  : <div className="road-sign"><img src={problem.icon} alt="" aria-hidden="true" /></div>}
              <h2>{problem.title}</h2>
            </div>
          </div>
          <p className="problem-fact">{problem.fact}</p>
          {problem.isSubmitted ? <details className="idea-description-details">
            <summary>Read idea</summary>
            <p className="problem-question">{problem.question}</p>
          </details> : <p className="problem-question">{problem.question}</p>}
          {problem.submitterName && <p className="idea-byline">Idea by {problem.submitterName}</p>}
          {problem.cta && <button className="idea-cta" onClick={openNewIdea}>Bring your idea <span>→</span></button>}
        </article>)}
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
              <button className="idea-submit" disabled={submittingIdea}>{submittingIdea ? (editingIdeaId ? 'Saving changes…' : 'Adding idea…') : (editingIdeaId ? 'Save changes →' : 'Add idea to the board →')}</button>
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

    {page !== 'home' && page !== 'newsletter' && page !== 'projects' && page !== 'about' && <section className="coming-page">
      <p className="eyebrow">{labels[page]}</p>
      <h1>Coming soon.</h1>
      <p>We’re preparing this part of Build a Better Bedford.</p>
      <button className="quiet-link" onClick={() => go('home')}>← Back home</button>
    </section>}

    <footer>Unique visitors: {visitStats.total} visitors total / {visitStats.today} visitors today</footer>
  </main>
}
export default App
