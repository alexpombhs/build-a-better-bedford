import { useState } from 'react'
import roadSolution from './assets/road_solution.png'

// Add new published issues here when their articles are ready.
const issues = [{ id: '2026-09', month: 'September 2026', number: '01', title: 'Can you design danger out of a road?' }] as const

const sections = [
  ['01', 'The idea', 'Roads have a user experience. Geometry, visibility, markings, lighting and crossing distance influence how people move and what they notice.'],
  ['02', 'The question', 'What if we studied a Bedford crossing like a designer studies an interface: where is the uncertainty, and what behavior does the street encourage?'],
  ['03', 'The experiment', 'Observe safely, sketch one possible improvement, then identify the measurements and evidence needed before treating it as an engineering proposal.'],
]

export default function Newsletter() {
  const [expanded, setExpanded] = useState(false)

  return <div className="newsletter-library">
    <aside className="newsletter-archive" aria-label="Newsletter issues">
      <div className="archive-head"><span>THE ARCHIVE</span><h2>Newsletter</h2><p>Explore our monthly ideas and engineering stories.</p></div>
      <label className="archive-mobile-label" htmlFor="newsletter-issue-select">Choose an issue</label>
      <select id="newsletter-issue-select" className="archive-select" value={issues[0].id} onChange={() => setExpanded(false)}>
        {issues.map(issue => <option key={issue.id} value={issue.id}>{issue.month} · Issue {issue.number}</option>)}
      </select>
      <nav className="archive-list" aria-label="Published newsletter issues">
        {issues.map(issue => <button key={issue.id} type="button" className="archive-item selected" aria-current="page" onClick={() => { setExpanded(false); window.scrollTo({top:0,behavior:'smooth'}) }}>
          <span>{issue.month} <small>ISSUE {issue.number}</small></span>
          <strong>{issue.title}</strong>
        </button>)}
      </nav>
      <p className="archive-coming">New issues will appear here as they’re published.</p>
    </aside>
    <section className={expanded ? 'newsletter-page expanded' : 'newsletter-page'}>
    <div className="newsletter-clean">
      <div className="newsletter-intro">
        <p className="eyebrow">SEPTEMBER 2026 · ISSUE 01</p>
        <p className="newsletter-label">MONTHLY FIELD NOTE</p>
        <h1>Can you design <span>danger</span> out of a road?</h1>
        <p className="newsletter-deck">A look at how design, urbanism and engineering can make safer behavior easier and more intuitive.</p>
        <div className="newsletter-quote">If the environment influences behavior, engineering can help make the safer choice the easier choice.</div>
      </div>

      <div className="newsletter-notes">
        <div className="newsletter-notes-head"><span>THE STORY</span><span>BUILD A BETTER BEDFORD</span></div>
        {sections.map(([number,title,text]) => <article className="newsletter-note" key={number}>
          <span>{number}</span>
          <div><h2>{title}</h2><p>{text}</p></div>
        </article>)}
        <div className="newsletter-disclaimer">
          <strong>Design exploration, not an engineering plan.</strong>
          <p>A real design would require site measurements, accessibility and drainage requirements, traffic data, sight-distance analysis, utilities and right-of-way constraints.</p>
        </div>
      </div>
      <button
        className="newsletter-drawer-toggle"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
      >
        <span>{expanded ? 'See less' : 'See more'}</span>
        <span className="drawer-symbol">{expanded ? '−' : '+'}</span>
      </button>
    </div>

    {expanded && <div className="newsletter-expand-panel">
        <section className="design-problem">
          <p className="expand-kicker">01 · THE DESIGN PROBLEM</p>
          <div className="expand-grid">
            <div>
              <h2>What is the road teaching people to do?</h2>
              <p>Before proposing a solution, treat the crossing as a design problem. Where do drivers naturally look? How wide does the road feel? How long is the crossing? Where does a pedestrian hesitate? The goal is to identify which physical cues may be encouraging speed or uncertainty.</p>
            </div>
            <div className="design-principle">
              <span>DESIGN QUESTION</span>
              <strong>Can the street itself communicate a safer speed?</strong>
              <p>Instead of depending only on warnings, explore whether geometry, visibility, crossing distance and pedestrian connections can make safer behavior more intuitive.</p>
            </div>
          </div>
        </section>

        <section className="bedford-context">
          <p className="expand-kicker">02 · WHY BEDFORD</p>
          <div className="expand-grid">
            <div>
              <h2>A real local problem.</h2>
              <p>Bedford’s Transportation Advisory Committee documented three pedestrian deaths involving vehicles in roughly two years: one on Shawsheen Road in 2022 and two on Concord Road in 2024. The town has also identified speed, accessibility, and missing sidewalk/bicycle connections as concerns at the Concord Road/Reformatory Branch Trail crossing.</p>
              <div className="source-links">
                <a href="https://bedfordma.gov/AgendaCenter/ViewFile/Minutes/_04162025-2105" target="_blank" rel="noreferrer">Bedford TAC minutes ↗</a>
                <a href="https://bedfordma.gov/1037/Concord-Road-Crosswalk-Improvements" target="_blank" rel="noreferrer">Concord Road project ↗</a>
              </div>
            </div>
            <div>
              <h3>What we would study</h3>
              <ul>
                <li>vehicle speed and approach behavior</li>
                <li>driver and pedestrian sight lines</li>
                <li>crossing distance and waiting space</li>
                <li>lighting and visibility</li>
                <li>ADA access and route continuity</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="solution-section">
          <p className="expand-kicker">03 · POSSIBLE RESPONSE</p>
          <div className="solution-layout">
            <div>
              <h2>Then sketch a possible intervention.</h2>
              <p>Only after defining the design problem do we explore a response: shorter crossings, refuge space, clearer pedestrian connections, tighter geometry, stronger visual cues, or other changes that make the road feel slower and easier to read.</p>
              <p className="solution-note">This image is a design sketch for discussion — not a final engineering recommendation.</p>
            </div>
            <figure>
              <img src={roadSolution} alt="Student concept for a safer Bedford road crossing" />
            </figure>
          </div>
        </section>

        <section className="inspiration-section">
          <p className="expand-kicker">04 · IDEAS TO LEARN FROM</p>
          <div className="inspiration-grid">
            <article className="inspiration-card">
              <div className="inspiration-top"><span>NEW URBANISM</span><a href="https://www.dpz.com/" target="_blank" rel="noreferrer">DPZ ↗</a></div>
              <h3>Change the environment producing the behavior.</h3>
              <p>DPZ’s New Urbanism work emphasizes walkable, connected places where street geometry and public-space design shape how people move — not just signs telling them what to do.</p>
            </article>

            <article className="inspiration-card">
              <div className="inspiration-top"><span>SUSTAINABILITY + SYSTEMS</span><a href="https://thothlondon.com/" target="_blank" rel="noreferrer">Thoth ↗</a></div>
              <h3>Measure whether the redesign is working.</h3>
              <p>Thoth’s systems approach suggests pairing design with data: speed, traffic, crossing activity, lighting and infrastructure condition can be compared before and after changes.</p>
            </article>
          </div>
        </section>
      </div>}
  </section>
  </div>
}
