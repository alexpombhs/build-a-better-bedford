import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { emptyIssue, IssueView } from './Newsletter'
import type { NewsletterIssue, NewsletterSection } from './Newsletter'

type Template = 'club' | 'project' | 'announcement'
const presets: Record<Template, { name: string; sections: NewsletterSection[]; details: NewsletterSection[] }> = {
  club: { name: 'Club update', sections: [
    { heading: 'This month', body: '' }, { heading: 'What we worked on', body: '' }, { heading: 'Coming up', body: '' },
  ], details: [{ heading: 'Highlights and photos', body: '' }] },
  project: { name: 'Project spotlight', sections: [
    { heading: 'The challenge', body: '' }, { heading: 'Our approach', body: '' }, { heading: 'What we learned', body: '' },
  ], details: [{ heading: 'Results and next steps', body: '' }] },
  announcement: { name: 'Announcement', sections: [
    { heading: 'The news', body: '' }, { heading: 'Important details', body: '' }, { heading: 'What to do next', body: '' },
  ], details: [] },
}
const cleanSections = (sections: NewsletterSection[]) =>
  sections.map(s => ({ heading: s.heading.trim(), body: s.body.trim() })).filter(s => s.heading || s.body)
const normalize = (issue: NewsletterIssue): NewsletterIssue => ({
  ...issue,
  title: issue.title.trim(), description: issue.description.trim(),
  footer: issue.footer.trim(),
  sections: cleanSections(issue.sections), details: cleanSections(issue.details),
})
const validIssueId = (id: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(id)
const defaultMonth = (id: string) => {
  if (!validIssueId(id)) return ''
  const [year, month] = id.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

export default function NewsletterStudio({ onPublished }: { onPublished: () => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [list, setList] = useState<NewsletterIssue[]>([])
  const [draft, setDraft] = useState<NewsletterIssue>(emptyIssue)
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [newIssue, setNewIssue] = useState(true)

  useEffect(() => {
    let active = true
    const check = async (nextUser: User | null) => {
      if (!active) return
      setUser(nextUser)
      setChecking(true)
      if (!nextUser?.email) { setAuthorized(false); setChecking(false); return }
      const { data, error } = await supabase.from('newsletter_staff').select('email').eq('email', nextUser.email.toLowerCase()).maybeSingle()
      if (!active) return
      setAuthorized(!error && !!data)
      setChecking(false)
    }
    void supabase.auth.getUser().then(({ data }) => check(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void check(session?.user ?? null) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  const loadIssues = async () => {
    const { data, error } = await supabase.from('newsletters').select('id,month,number,title,description,sections,details,footer,status,published_at').order('id', { ascending: false })
    if (error) { setMessage(error.message); return }
    setList((data ?? []) as NewsletterIssue[])
  }
  useEffect(() => { if (authorized) void loadIssues() }, [authorized])

  const sendLink = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true); setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // Always return to the deployed club website, not the local dev server or
      // a URL containing a previous (possibly expired) auth error fragment.
      // Supabase Auth URL Configuration must allow this exact redirect URL.
      options: { shouldCreateUser: true, emailRedirectTo: 'https://alexpombhs.github.io/build-a-better-bedford/' },
    })
    setMessage(error ? error.message : 'Check your inbox for your sign-in link. Only approved editors can publish.')
    setBusy(false)
  }

  const updateField = <K extends keyof NewsletterIssue>(field: K, value: NewsletterIssue[K]) =>
    setDraft(current => ({ ...current, [field]: value }))
  const updateSection = (field: 'sections' | 'details', index: number, property: keyof NewsletterSection, value: string) =>
    setDraft(current => ({ ...current, [field]: current[field].map((section, i) => i === index ? { ...section, [property]: value } : section) }))
  const addSection = (field: 'sections' | 'details') =>
    setDraft(current => ({ ...current, [field]: [...current[field], { heading: '', body: '' }] }))
  const removeSection = (field: 'sections' | 'details', index: number) =>
    setDraft(current => ({ ...current, [field]: current[field].filter((_, i) => i !== index) }))
  const chooseTemplate = (type: Template) => {
    const preset = presets[type]
    if ((draft.sections.some(section => section.heading || section.body) || draft.details.some(section => section.heading || section.body)) &&
        !window.confirm('Replace the current sections with this template?')) return
    setDraft(current => ({ ...current, sections: preset.sections.map(section => ({ ...section })), details: preset.details.map(section => ({ ...section })) }))
  }
  const save = async (status: NewsletterIssue['status']) => {
    const next = normalize({ ...draft, status, published_at: status === 'published' ? draft.published_at || new Date().toISOString() : null })
    if (!validIssueId(next.id)) { setMessage('Use a valid issue month in YYYY-MM format.'); return }
    if (!next.title || !next.month || !next.number) { setMessage('Issue month, number, and title are required.'); return }
    if (status === 'published' && (!next.description || !next.sections.length || next.sections.some(section => !section.heading || !section.body))) {
      setMessage('Complete the description and all story sections before publishing.'); return
    }
    if (status === 'published' && !window.confirm('Publish this issue to the public newsletter page?')) return
    setBusy(true); setMessage('')
    const payload = { ...next, updated_at: new Date().toISOString() }
    const query = newIssue
      ? supabase.from('newsletters').insert(payload)
      : supabase.from('newsletters').update(payload).eq('id', draft.id)
    const { error } = await query
    setBusy(false)
    if (error) { setMessage(error.message); return }
    setNewIssue(false)
    setDraft(next)
    setMessage(status === 'published' ? 'Issue published successfully.' : 'Newsletter saved.')
    await loadIssues()
    if (status === 'published') onPublished()
  }

  if (checking) return <div className="studio-shell"><p role="status">Checking editor access…</p></div>
  if (!user) return <section className="studio-shell studio-login">
    <p className="studio-kicker">BBB EDITORIAL STUDIO</p><h1>Newsletter editor</h1>
    <p>Sign in to create, edit, and publish club newsletters. Publishing is restricted to approved editors.</p>
    <form onSubmit={sendLink}><label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="editor@example.com" /></label><button className="studio-primary" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button></form>
    {message && <p role="status">{message}</p>}
  </section>
  if (!authorized) return <section className="studio-shell studio-login">
    <h1>Editor access required</h1><p>Your account is signed in, but it has not been approved for newsletter publishing. An administrator must add your email to the newsletter_staff table.</p>
    <button type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button>
  </section>

  return <section className="studio-shell">
    <div className="studio-header"><div><p className="studio-kicker">BUILD A BETTER BEDFORD / EDITORIAL</p><h1>Newsletter studio</h1><p>Draft, review and publish club updates directly on the site.</p></div>
      <button type="button" className="studio-secondary" onClick={() => void supabase.auth.signOut()}>Sign out</button>
    </div>
    <div className="studio-layout">
      <aside className="studio-panel studio-sidebar">
        <button className="studio-primary" type="button" onClick={() => { setDraft(emptyIssue()); setNewIssue(true); setPreview(false); setMessage('') }}>+ New issue</button>
        <p className="studio-kicker">YOUR ISSUES</p>
        {list.map(issue => <button key={issue.id} type="button" className={draft.id === issue.id && !newIssue ? 'studio-issue selected' : 'studio-issue'} onClick={() => { setDraft(issue); setNewIssue(false); setPreview(false); setMessage('') }}>
          <strong>{issue.month}</strong><span>{issue.title}</span><small>{issue.status.replace('_', ' ')}</small>
        </button>)}
      </aside>
      <div className="studio-main">
        <div className="studio-actions">
          <div className="studio-tabs"><button type="button" className={!preview ? 'active' : ''} onClick={() => setPreview(false)}>Edit</button><button type="button" className={preview ? 'active' : ''} onClick={() => setPreview(true)}>Preview</button></div>
          <span className="studio-status">{draft.status.replace('_', ' ')}</span>
        </div>
        {preview ? <div className="studio-preview"><IssueView issue={draft} /></div> : <div className="studio-panel studio-form">
          <h2>Issue details</h2>
          <div className="studio-fields-two">
            <label>Issue ID (YYYY-MM)<input value={draft.id} disabled={!newIssue} onChange={e => { const id = e.target.value; setDraft(current => ({ ...current, id, month: defaultMonth(id) || current.month })) }} /></label>
            <label>Issue number<input value={draft.number} maxLength={4} onChange={e => updateField('number', e.target.value)} /></label>
          </div>
          <label>Issue month<input value={draft.month} maxLength={40} onChange={e => updateField('month', e.target.value)} /></label>
          <label>Headline<input value={draft.title} maxLength={160} onChange={e => updateField('title', e.target.value)} placeholder="What happened this month?" /></label>
          <label>Introduction<textarea rows={3} maxLength={800} value={draft.description} onChange={e => updateField('description', e.target.value)} placeholder="A short overview of the issue…" /></label>
          <div className="studio-template"><h2>Start from a template</h2><div className="studio-template-options">{(Object.keys(presets) as Template[]).map(type => <button key={type} type="button" onClick={() => chooseTemplate(type)}>{presets[type].name}</button>)}</div></div>
          {(['sections', 'details'] as const).map(field => <div key={field} className="studio-section-group">
            <div className="studio-group-head"><div><h2>{field === 'sections' ? 'The story' : 'Additional sections'}</h2><p>{field === 'sections' ? 'The main summary sections shown beside the headline.' : 'Longer details shown below the introduction.'}</p></div><button type="button" className="studio-secondary" onClick={() => addSection(field)}>+ Add</button></div>
            {draft[field].map((section, index) => <div className="studio-section" key={index}>
              <div className="studio-section-top"><strong>SECTION {String(index + 1).padStart(2, '0')}</strong><button type="button" onClick={() => removeSection(field, index)}>Remove</button></div>
              <label>Section title<input value={section.heading} maxLength={160} onChange={e => updateSection(field, index, 'heading', e.target.value)} /></label>
              <label>Content<textarea rows={5} value={section.body} maxLength={8000} onChange={e => updateSection(field, index, 'body', e.target.value)} /></label>
            </div>)}
          </div>)}
          <label>Footer or credits<textarea rows={2} value={draft.footer} maxLength={800} onChange={e => updateField('footer', e.target.value)} /></label>
        </div>}
        <div className="studio-savebar">
          <button type="button" className="studio-secondary" disabled={busy} onClick={() => void save('draft')}>Save draft</button>
          <button type="button" className="studio-secondary" disabled={busy} onClick={() => void save('in_review')}>Send for review</button>
          <button type="button" className="studio-primary" disabled={busy} onClick={() => void save('published')}>{busy ? 'Saving…' : 'Publish issue'}</button>
        </div>
        {message && <p className="studio-message" role="status">{message}</p>}
      </div>
    </div>
  </section>
}
