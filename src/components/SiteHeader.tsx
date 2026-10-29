import { useState } from 'react'
import './SiteHeader.css'

type Section = 'home' | 'projects' | 'lab' | 'newsletter' | 'about'

type Props = {
  active: Section
  onNavigate: (section: Section) => void
  onJoin: () => void
}

export default function SiteHeader({ active, onNavigate, onJoin }: Props) {
  const [open, setOpen] = useState(false)
  const navigate = (section: Section) => {
    setOpen(false)
    onNavigate(section)
  }
  const items: { section: Section; label: string }[] = [
    { section: 'projects', label: 'Projects' },
    { section: 'lab', label: 'Lab' },
    { section: 'newsletter', label: 'Newsletter' },
    { section: 'about', label: 'About' },
  ]
  return (
    <header className="bbb-site-header">
      <button className="bbb-site-brand" onClick={() => navigate('home')} aria-label="Build a Better Bedford home">
        <strong>BBB</strong>
        <span>STUDENT-LED<br />CIVIL ENGINEERING CLUB</span>
      </button>
      <button
        type="button"
        className="bbb-site-menu-toggle"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls="bbb-primary-navigation"
        onClick={() => setOpen(value => !value)}
      >
        <span /><span /><span />
      </button>
      <nav id="bbb-primary-navigation" className={open ? 'bbb-site-nav is-open' : 'bbb-site-nav'} aria-label="Main navigation">
        {items.map(({ section, label }) => (
          <button type="button" key={section}
            className={active === section ? 'bbb-site-nav-link is-active' : 'bbb-site-nav-link'}
            aria-current={active === section ? 'page' : undefined}
            onClick={() => navigate(section)}>
            {label}
          </button>
        ))}
        <button type="button" className="bbb-site-join" onClick={() => {setOpen(false);onJoin()}}>Join the Club</button>
      </nav>
    </header>
  )
}
