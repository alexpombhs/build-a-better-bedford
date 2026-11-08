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
  const hrefFor = (section: Section) => `${import.meta.env.BASE_URL}${section === 'home' ? '' : section}`
  const linkClick = (event: React.MouseEvent<HTMLAnchorElement>, section: Section) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(section)
  }
  const items: { section: Section; label: string }[] = [
    { section: 'projects', label: 'Projects' },
    { section: 'lab', label: 'Lab' },
    { section: 'newsletter', label: 'Newsletter' },
    { section: 'about', label: 'About' },
  ]
  return (
    <header className="bbb-site-header">
      <a className="bbb-site-brand" href={hrefFor('home')} onClick={event => linkClick(event, 'home')} aria-label="Build a Better Bedford home">
        <strong>BBB</strong>
        <span>STUDENT-LED<br />CIVIL ENGINEERING CLUB</span>
      </a>
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
          <a key={section} href={hrefFor(section)}
            className={active === section ? 'bbb-site-nav-link is-active' : 'bbb-site-nav-link'}
            aria-current={active === section ? 'page' : undefined}
            onClick={event => linkClick(event, section)}>
            {label}
          </a>
        ))}
        <button type="button" className="bbb-site-join" onClick={() => {setOpen(false);onJoin()}}>Join the Club</button>
      </nav>
    </header>
  )
}
