import { useEffect, useState } from 'react'
import { UiSelect } from './components/atoms/MuiPrimitives'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { emptyIssue, IssueView, NewsletterMediaView, embeddedVideoUrl, newsletterSectionStyle, newsletterSectionPlacement } from './Newsletter'
import type { NewsletterIssue, NewsletterSection, NewsletterMedia } from './Newsletter'

type Template = 'club' | 'project' | 'announcement'
type Preset = { name: string; description: string; headings: string[] }
const presets: Record<Template, Preset> = {
  club: {
    name: 'Club update',
    description: 'Meetings, milestones, and what comes next',
    headings: ['This month', 'What we worked on', 'Coming up'],
  },
  project: {
    name: 'Project spotlight',
    description: 'A challenge, the engineering process, and results',
    headings: ['The challenge', 'Our approach', 'What we learned'],
  },
  announcement: {
    name: 'Announcement',
    description: 'A focused update with key details and next steps',
    headings: ['The news', 'Important details', 'What to do next'],
  },
}
const cleanSections = (sections: NewsletterSection[]) =>
  sections.map(section => ({
    heading: section.heading.trim(),
    body: section.body.trim(),
    placement: section.placement,
    style: section.style,
    media: (section.media ?? []).map(item => ({
      ...item, alt: item.alt?.trim() ?? '', caption: item.caption?.trim() ?? '',
    })),
  })).filter(section => section.heading || section.body || section.media.length)
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
  const [username, setUsername] = useState('bbb_admin')
  const [email, setEmail] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'email'>('password')
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)
  const [settingPassword, setSettingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [list, setList] = useState<NewsletterIssue[]>([])
  const [draft, setDraft] = useState<NewsletterIssue>(emptyIssue)
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoInputs, setVideoInputs] = useState<Record<string, string>>({})
  const [newIssue, setNewIssue] = useState(true)

  useEffect(() => {
    let active = true
    const check = async (nextUser: User | null) => {
      if (!active) return
      setChecking(true)
      setUser(nextUser)
      if (!nextUser?.email) {
        setAuthorized(false)
        setNeedsPasswordChange(false)
        setList([])
        setDraft(emptyIssue())
        setNewIssue(true)
        setPreview(false)
        setChecking(false)
        return
      }
      const { data, error } = await supabase.from('newsletter_staff').select('email,must_change_password').eq('email', nextUser.email.toLowerCase()).maybeSingle()
      if (!active) return
      const allowed = !error && !!data
      setAuthorized(allowed)
      setNeedsPasswordChange(allowed && Boolean(data?.must_change_password))
      if (!allowed) {
        setList([])
        setDraft(emptyIssue())
        setNewIssue(true)
        setPreview(false)
      }
      setChecking(false)
    }
    void supabase.auth.getUser().then(({ data }) => check(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => { void check(session?.user ?? null) }, 0) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  const loadIssues = async () => {
    const { data, error } = await supabase.from('newsletters').select('id,month,number,title,description,sections,details,footer,status,published_at').order('id', { ascending: false })
    if (error) { setMessage(error.message); return }
    setList((data ?? []) as NewsletterIssue[])
    setMessage('')
  }
  useEffect(() => { if (authorized && !needsPasswordChange) void loadIssues() }, [authorized, needsPasswordChange])

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.functions.invoke('newsletter-login', {
        body: { username: username.trim().toLowerCase(), password },
      })
      if (!error && data?.password_change_required) {
        setNeedsSetup(true)
        setMessage('')
        return
      }
      if (error || !data?.access_token || !data?.refresh_token) {
        setMessage('Unable to sign in. Check your username and password.')
        return
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      if (sessionError) {
        setMessage('Sign-in failed. Please try again.')
        return
      }
      setPassword('')
      setMessage('')
    } catch {
      setMessage('Sign-in service unavailable. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const completeFirstLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (newPassword.length < 12 || newPassword !== confirmPassword) {
      setMessage('Choose a password of at least 12 characters and confirm it exactly.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.functions.invoke('newsletter-login', {
        body: {
          action: 'finish_setup',
          username: username.trim().toLowerCase(),
          password,
          new_password: newPassword,
        },
      })
      if (error || !data?.access_token || !data?.refresh_token) {
        setMessage(data?.error || 'The temporary password has expired or could not be used.')
        return
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      if (sessionError) {
        setMessage('Password saved, but automatic sign-in failed. Sign in again using your new password.')
        setNeedsSetup(false)
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
        return
      }
      setNeedsSetup(false)
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setMessage('Password setup failed. Please retry.')
    } finally {
      setBusy(false)
    }
  }

  const setEditorPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 12) { setMessage('Choose a password with at least 12 characters.'); return }
    setSettingPassword(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { setMessage(`Could not set password: ${error.message}`); return }
      setNewPassword('')
      setMessage('Password updated in Supabase Auth. Use bbb_admin and this password next time.')
    } catch {
      setMessage('Could not set password. Please try again.')
    } finally {
      setSettingPassword(false)
    }
  }

  const sendEmailLink = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: 'https://alexpombhs.github.io/build-a-better-bedford/',
        },
      })
      setMessage(error ? error.message : 'A sign-in link has been requested. Check your email.')
    } catch {
      setMessage('Email sign-in is temporarily unavailable.')
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (newPassword !== confirmNewPassword) {
      setMessage('Passwords do not match.')
      return
    }
    if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) ||
        !/[^A-Za-z0-9]/.test(newPassword)) {
      setMessage('Choose 12+ characters including uppercase, lowercase, a number and a symbol.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.functions.invoke('newsletter-change-password', {
        body: { password: newPassword },
      })
      if (error || !data?.ok) {
        setMessage('Could not update your password. Try a different password or sign in again.')
        return
      }
      setNewPassword('')
      setConfirmNewPassword('')
      setNeedsPasswordChange(false)
      setMessage('Password saved. The newsletter editor is unlocked.')
    } catch {
      setMessage('Could not update password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const updateField = <K extends keyof NewsletterIssue>(field: K, value: NewsletterIssue[K]) =>
    setDraft(current => ({ ...current, [field]: value }))
  const updateSection = (field: 'sections' | 'details', index: number, property: 'heading' | 'body' | 'placement' | 'style', value: string) =>
    setDraft(current => {
      const next = { ...current, [field]: current[field].map((section, i) => i === index ? { ...section, [property]: value } : section) }
      if (field !== 'details' || property !== 'heading' || current.details[index]?.placement === 'sidebar') return next
      const previousHeading = current.details[index].heading
      // Only update the index when the matching title hasn't been customized.
      // Compare by position for newly generated templates, then by exact heading
      // for older issues that have a different sidebar/order.
      const indexedPosition = current.sections[index]?.heading === previousHeading ? index
        : current.sections.findIndex(section => section.heading === previousHeading)
      if (indexedPosition < 0) return next
      return {
        ...next,
        sections: current.sections.map((section, i) => i === indexedPosition ? { ...section, heading: value } : section),
      }
    })
  const addSection = (field: 'sections' | 'details') =>
    setDraft(current => ({ ...current, [field]: [...current[field], { heading: '', body: '', media: [] }] }))
  const addSidebarStory = () =>
    setDraft(current => ({ ...current, details: [...current.details, { heading: '', body: '', media: [], placement: 'sidebar', style: 'default' }] }))
  const removeSection = (field: 'sections' | 'details', index: number) =>
    setDraft(current => ({ ...current, [field]: current[field].filter((_, i) => i !== index) }))
  const changeMedia = (field: 'sections' | 'details', sectionIndex: number, mediaIndex: number, patch: Partial<NewsletterMedia>) =>
    setDraft(current => ({
      ...current, [field]: current[field].map((section, index) => index !== sectionIndex ? section : ({
        ...section, media: (section.media ?? []).map((item, i) => i === mediaIndex ? { ...item, ...patch } : item),
      })),
    }))
  const addMedia = (field: 'sections' | 'details', sectionIndex: number, item: NewsletterMedia) =>
    setDraft(current => ({
      ...current, [field]: current[field].map((section, index) => index !== sectionIndex ? section : ({
        ...section, media: [...(section.media ?? []), item],
      })),
    }))
  const removeMedia = (field: 'sections' | 'details', sectionIndex: number, mediaIndex: number) =>
    setDraft(current => ({
      ...current, [field]: current[field].map((section, index) => index !== sectionIndex ? section : ({
        ...section, media: (section.media ?? []).filter((_, i) => i !== mediaIndex),
      })),
    }))
  const uploadMedia = async (field: 'sections' | 'details', sectionIndex: number, file: File) => {
    if (!validIssueId(draft.id)) { setMessage('Enter a valid issue ID (YYYY-MM) before uploading.'); return }
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null
    const accepted = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
    if (!type || !accepted.includes(file.type)) { setMessage('Use JPG, PNG, WebP, GIF, MP4 or WebM files.'); return }
    if (file.size > (type === 'image' ? 8 : 30) * 1024 * 1024) {
      setMessage(type === 'image' ? 'Images must be 8 MB or smaller.' : 'Videos must be 30 MB or smaller. For longer videos, paste a YouTube or Vimeo URL.')
      return
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100) || 'upload'
    const storagePath = `${draft.id}/${crypto.randomUUID()}-${safeName}`
    setUploading(true); setMessage('')
    try {
      const { error } = await supabase.storage.from('newsletter-media')
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (error) { setMessage(`Upload failed: ${error.message}`); return }
      addMedia(field, sectionIndex, {
        id: crypto.randomUUID(), type, storagePath,
        alt: type === 'image' ? file.name.replace(/\.[^.]+$/, '') : 'Newsletter video',
        caption: '',
      })
      setMessage('Media uploaded. Save the newsletter draft to keep the attachment.')
    } catch {
      setMessage('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }
  const addVideoLink = (field: 'sections' | 'details', sectionIndex: number) => {
    const key = `${field}-${sectionIndex}`
    const url = videoInputs[key]?.trim() ?? ''
    if (!embeddedVideoUrl(url)) { setMessage('Use a valid HTTPS YouTube or Vimeo video link.'); return }
    addMedia(field, sectionIndex, { id: crypto.randomUUID(), type: 'video', url, alt: 'Newsletter video', caption: '' })
    setVideoInputs(current => ({ ...current, [key]: '' }))
    setMessage('Video added. Save the newsletter to keep it.')
  }
  const addArticleSection = () =>
    setDraft(current => ({
      ...current,
      sections: [...current.sections, { heading: '', body: '', media: [] }],
      details: [...current.details, { heading: '', body: '', media: [], placement: 'main', style: 'default' }],
    }))
  const chooseTemplate = (type: Template) => {
    const preset = presets[type]
    if ((draft.sections.some(section => section.heading || section.body || section.media?.length) ||
         draft.details.some(section => section.heading || section.body || section.media?.length)) &&
        !window.confirm('Replace the current article and contents with this template? Any unsaved section text and attachments in the editor will be lost.')) return
    setDraft(current => ({
      ...current,
      sections: preset.headings.map(heading => ({ heading, body: '', media: [] })),
      details: preset.headings.map(heading => ({ heading, body: '', media: [], placement: 'main', style: 'default' })),
    }))
    setMessage('Template applied to this draft. Add the article text before publishing.')
  }
  const save = async (status: NewsletterIssue['status']) => {
    const next = normalize({ ...draft, status, published_at: status === 'published' ? draft.published_at || new Date().toISOString() : null })
    if (!validIssueId(next.id)) { setMessage('Use a valid issue month in YYYY-MM format.'); return }
    if (!next.title || !next.month || !next.number) { setMessage('Issue month, number, and title are required.'); return }
    const article = next.details.filter(section => section.placement !== 'sidebar')
    if (status === 'published' && (!next.description || !next.sections.length || next.sections.some(section => !section.heading))) {
      setMessage('Complete the introduction and all table-of-contents titles before publishing.'); return
    }
    if (status === 'published' && (article.length
      ? article.some(section => !section.heading || !section.body)
      : next.sections.some(section => !section.body))) {
      setMessage('Complete each main article heading and its content before publishing.'); return
    }
    if (uploading) { setMessage('Finish uploading attachments before saving.'); return }
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
  if (!user && needsSetup) return <section className="studio-shell studio-login">
    <p className="studio-kicker">ONE-TIME ADMIN SETUP</p>
    <h1>Choose your permanent password</h1>
    <p>Your temporary credential is valid for one password change only. Set a strong password to activate your editor login.</p>
    <form onSubmit={completeFirstLogin}>
      <label>New password (12+ characters)
        <input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </label>
      <label>Confirm new password
        <input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      </label>
      <button className="studio-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Set password and sign in'}</button>
      <button className="studio-secondary" type="button" disabled={busy} onClick={() => { setNeedsSetup(false); setPassword(''); setNewPassword(''); setConfirmPassword(''); setMessage('') }}>Back to sign in</button>
    </form>
    {message && <p role="status">{message}</p>}
  </section>
  if (!user) return <section className="studio-shell studio-login">
    <p className="studio-kicker">BBB EDITORIAL STUDIO</p><h1>Newsletter editor</h1>
    <p>Approved editors can sign in with a username and password or request an email link.</p>
    <div className="studio-login-options" role="group" aria-label="Sign-in method">
      <button type="button" className={loginMethod === 'password' ? 'active' : ''} onClick={() => { setLoginMethod('password'); setMessage('') }}>Username & password</button>
      <button type="button" className={loginMethod === 'email' ? 'active' : ''} onClick={() => { setLoginMethod('email'); setMessage('') }}>Email link</button>
    </div>
    {loginMethod === 'password'
      ? <form onSubmit={signIn}>
          <label>Username
            <input type="text" autoComplete="username" required minLength={3} maxLength={32} value={username} onChange={e => setUsername(e.target.value)} placeholder="bbb_admin" />
          </label>
          <label>Password or one-time login code
            <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <button type="submit" className="studio-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to newsletter editor'}</button>
        </form>
      : <form onSubmit={sendEmailLink}>
          <label>Approved editor email
            <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <button type="submit" className="studio-primary" disabled={busy}>{busy ? 'Sending…' : 'Send sign-in link'}</button>
          <p className="studio-login-hint">Email links are subject to Supabase email delivery limits and redirect settings.</p>
        </form>}
    {message && <p role="status" className="studio-message">{message}</p>}
  </section>
  if (!authorized) return <section className="studio-shell studio-login">
    <h1>Editor access required</h1><p>Your account is signed in, but it has not been approved for newsletter publishing. An administrator must add your email to the newsletter_staff table.</p>
    <button type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button>
  </section>

  if (needsPasswordChange) return <section className="studio-shell studio-login">
    <p className="studio-kicker">ACCOUNT SECURITY</p><h1>Set your permanent password</h1>
    <p>The one-time sign-in is complete. You must replace your temporary password before viewing hidden issues or publishing newsletters.</p>
    <form onSubmit={changePassword}>
      <label>New password
        <input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </label>
      <label>Confirm new password
        <input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
      </label>
      <p className="studio-login-hint">Use 12+ characters with uppercase and lowercase letters, a number and a symbol. Choose a password you don't use elsewhere.</p>
      <button type="submit" className="studio-primary" disabled={busy}>{busy ? 'Saving…' : 'Save password and open editor'}</button>
      <button type="button" className="studio-secondary" disabled={busy} onClick={() => void supabase.auth.signOut()}>Sign out</button>
    </form>
    {message && <p role="status" className="studio-message">{message}</p>}
  </section>

  return <section className="studio-shell">
    <div className="studio-header"><div><p className="studio-kicker">BUILD A BETTER BEDFORD / EDITORIAL</p><h1>Newsletter studio</h1><p>Draft, review and publish club updates directly on the site.</p></div>
      <div className="studio-account-actions">
        <details className="studio-password-settings">
          <summary>Change editor password</summary>
          <form onSubmit={setEditorPassword}>
            <label>New password (12+ characters)<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
            <button type="submit" className="studio-secondary" disabled={settingPassword}>{settingPassword ? 'Saving…' : 'Save password to Supabase'}</button>
          </form>
        </details>
        <button type="button" className="studio-secondary" onClick={() => void supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
    <div className={preview ? "studio-layout studio-layout-preview" : "studio-layout"}>
      {!preview && <aside className="studio-panel studio-sidebar">
        <button className="studio-primary" type="button" onClick={() => { setDraft(emptyIssue()); setNewIssue(true); setPreview(false); setMessage('') }}>+ New issue</button>
        <p className="studio-kicker">ALL ISSUES · INCLUDING HIDDEN</p>
        {list.map(issue => <button key={issue.id} type="button" className={draft.id === issue.id && !newIssue ? 'studio-issue selected' : 'studio-issue'} onClick={() => { setDraft(issue); setNewIssue(false); setPreview(false); setMessage('') }}>
          <strong>{issue.month}</strong><span>{issue.title}</span><small>{issue.status.replace('_', ' ')}</small>
        </button>)}
      </aside>}
      <div className="studio-main">
        <div className="studio-actions">
          <div className="studio-tabs"><button type="button" className={!preview ? 'active' : ''} onClick={() => setPreview(false)}>Edit</button><button type="button" className={preview ? 'active' : ''} onClick={() => setPreview(true)}>Preview</button></div>
          <span className="studio-status">{draft.status.replace('_', ' ')}</span>
        </div>
        {preview ? <div className="studio-preview-area">
          <p className="studio-layout-description">Article preview: main content and side panel, without site navigation. Nothing is published until you choose “Publish issue.”</p>
          <div className="studio-preview"><IssueView issue={draft} layout="article" editorPreview /></div>
        </div> : <div className="studio-panel studio-form">
          <h2>Issue details</h2>
          <div className="studio-fields-two">
            <label>Issue ID (YYYY-MM)<input value={draft.id} disabled={!newIssue} onChange={e => { const id = e.target.value; setDraft(current => ({ ...current, id, month: defaultMonth(id) || current.month })) }} /></label>
            <label>Issue number<input value={draft.number} maxLength={4} onChange={e => updateField('number', e.target.value)} /></label>
          </div>
          <label>Issue month<input value={draft.month} maxLength={40} onChange={e => updateField('month', e.target.value)} /></label>
          <label>Headline<input value={draft.title} maxLength={160} onChange={e => updateField('title', e.target.value)} placeholder="What happened this month?" /></label>
          <label>Introduction<textarea rows={3} maxLength={800} value={draft.description} onChange={e => updateField('description', e.target.value)} placeholder="A short overview of the issue…" /></label>
          <div className="studio-template">
            <h2>Start with an outline <span className="studio-optional">(optional)</span></h2>
            <p className="studio-template-help">Choose a starting outline for your article and its matching contents index. Choosing another outline replaces the sections currently in this draft.</p>
            <div className="studio-template-options">{(Object.keys(presets) as Template[]).map(type =>
              <button key={type} type="button" onClick={() => chooseTemplate(type)} aria-label={`Use ${presets[type].name} outline`}>
                <strong>{presets[type].name}</strong><span>{presets[type].description}</span>
              </button>)}</div>
          </div>
          {(['details', 'sections'] as const).map(field => <div key={field} className="studio-section-group">
            <div className="studio-group-head"><div>
              <h2>{field === 'details' ? 'Newsletter content & side panel' : 'In this issue · navigation index'}</h2>
              <p>{field === 'details'
                ? 'Add sections, choose Main content or Side panel, and select a style independently for each section.'
                : 'These titles appear as numbered links in the right column. Matching titles update as you edit the article. You can customize them here; brief descriptions are saved but hidden.'}</p>
            </div><div className="studio-group-buttons">
              {field === 'details'
                ? <><button type="button" className="studio-secondary" onClick={addArticleSection}>+ Add article section</button><button type="button" className="studio-secondary" onClick={addSidebarStory}>+ Add sidebar feature</button></>
                : <button type="button" className="studio-secondary" onClick={() => addSection('sections')}>+ Add index entry</button>}
            </div></div>
            {draft[field].map((section, index) => <div className="studio-section" key={index}>
              <div className="studio-section-top"><strong>{field === 'sections' ? 'INDEX ITEM' : newsletterSectionPlacement(section) === 'sidebar' ? 'SIDE PANEL SECTION' : 'CONTENT SECTION'} {String(index + 1).padStart(2, '0')}</strong><button type="button" onClick={() => removeSection(field, index)}>Remove</button></div>
              <label>{field === 'sections' ? 'Index title' : 'Section heading'}<input value={section.heading} maxLength={160} onChange={e => updateSection(field, index, 'heading', e.target.value)} /></label>
              {field === 'details' && <div className="studio-section-options">
                <UiSelect
                  className="studio-placement-select"
                  label="Location"
                  value={newsletterSectionPlacement(section)}
                  onValueChange={value => updateSection(field, index, 'placement', value)}
                  options={[
                    { value: 'main', label: 'Main content' },
                    { value: 'sidebar', label: 'Side panel' },
                  ]}
                />
                <UiSelect
                  className="studio-section-style-select"
                  label="Section style"
                  value={newsletterSectionStyle(section)}
                  onValueChange={value => updateSection(field, index, 'style', value)}
                  options={[
                    { value: 'default', label: 'Default' },
                    { value: 'halloween', label: 'Halloween' },
                  ]}
                />
              </div>}
              <label>{field === 'sections' ? 'Short summary (saved, not currently displayed)' : 'Article text'}<textarea rows={field === 'sections' ? 2 : 6} value={section.body} maxLength={8000} onChange={e => updateSection(field, index, 'body', e.target.value)} /></label>
              <div className="studio-media-editor">
                <div className="studio-media-heading"><strong>PHOTOS & VIDEOS</strong><span>Attach media to this section</span></div>
                {(section.media ?? []).map((item, mediaIndex) =>
                  <div className="studio-media-item" key={item.id}>
                    <div className="studio-media-item-preview"><NewsletterMediaView media={item} /></div>
                    <div className="studio-media-item-controls">
                      <label>{item.type === 'image' ? 'Image description (alt text)' : 'Video title'}<input maxLength={220} value={item.alt ?? ''} onChange={e => changeMedia(field,index,mediaIndex,{alt:e.target.value})} /></label>
                      <label>Caption<input maxLength={500} value={item.caption ?? ''} onChange={e => changeMedia(field,index,mediaIndex,{caption:e.target.value})} placeholder="Optional caption or credit" /></label>
                      <button type="button" className="studio-media-remove" onClick={() => removeMedia(field,index,mediaIndex)}>Remove from newsletter</button>
                    </div>
                  </div>
                )}
                <div className="studio-media-add">
                  <label className="studio-file-upload">{uploading ? 'Uploading…' : '+ Upload photo or video'}
                    <input type="file" disabled={uploading} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={event => {
                      const file = event.target.files?.[0]
                      if (file) void uploadMedia(field, index, file)
                      event.target.value = ''
                    }} />
                  </label>
                  <small>JPG, PNG, WebP or GIF up to 8 MB · MP4 or WebM up to 30 MB</small>
                </div>
                <div className="studio-media-link">
                  <label>Or embed a YouTube / Vimeo video
                    <input type="url" placeholder="https://www.youtube.com/watch?v=…" value={videoInputs[`${field}-${index}`] ?? ''} onChange={e => setVideoInputs(current => ({ ...current, [`${field}-${index}`]: e.target.value }))} />
                  </label>
                  <button type="button" className="studio-secondary" onClick={() => addVideoLink(field,index)}>Add video</button>
                </div>
              </div>
            </div>)}
          </div>)}
          <label>Footer or credits<textarea rows={2} value={draft.footer} maxLength={800} onChange={e => updateField('footer', e.target.value)} /></label>
        </div>}
        <div className="studio-savebar">
          <button type="button" className="studio-secondary" disabled={busy || uploading} onClick={() => void save('draft')}>Save draft</button>
          <button type="button" className="studio-secondary" disabled={busy || uploading} onClick={() => void save('in_review')}>Send for review</button>
          <button type="button" className="studio-primary" disabled={busy || uploading} onClick={() => void save('published')}>{busy ? 'Saving…' : 'Publish issue'}</button>
        </div>
        {message && <p className="studio-message" role="status">{message}</p>}
      </div>
    </div>
  </section>
}
