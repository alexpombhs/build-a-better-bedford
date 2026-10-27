import { useState } from 'react'
import roadSolution from './assets/road_solution.png'

// Add new published issues here when their articles are ready.
const issues = [
  { id: '2026-10', month: 'October 2026', number: '02', title: "We're official. Bridges are first." },
  { id: '2026-09', month: 'September 2026', number: '01', title: 'Can you design danger out of a road?' },
] as const

const septemberSections = [
  ['01', 'The idea', 'Roads have a user experience. Geometry, visibility, markings, lighting and crossing distance influence how people move and what they notice.'],
  ['02', 'The question', 'What if we studied a Bedford crossing like a designer studies an interface: where is the uncertainty, and what behavior does the street encourage?'],
  ['03', 'The experiment', 'Observe safely, sketch one possible improvement, then identify the measurements and evidence needed before treating it as an engineering proposal.'],
]

const octoberSections = [
  ['01', 'Officially approved', 'BBB has been approved as a BHS club. Meetings are on Thursdays, and our first topic is bridges.'],
  ['02', 'Activity fair', 'We had a table at the BHS activity fair and talked with students about the projects we want to try this year.'],
  ['03', 'First meeting', "Members voted for bridges and agreed on a Thursday meeting schedule. We'll compare bridge types before building and testing models."],
]

export default function Newsletter() {
  const [expanded, setExpanded] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string>(issues[0].id)
  const selectedIssue = issues.find(issue => issue.id === selectedIssueId) ?? issues[0]
  const isOctober = selectedIssue.id === '2026-10'
  const activeSections = isOctober ? octoberSections : septemberSections

  return <div className={archiveOpen ? "newsletter-library archive-visible" : "newsletter-library"}>
    {!archiveOpen && <button className="newsletter-issue-tab" type="button" aria-expanded={false} aria-controls="newsletter-issue-navigation" aria-label="Browse newsletter issues" onClick={() => setArchiveOpen(true)}>
      <svg className="issue-tab-symbol" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="18" rx="1" />
        <path d="M7 7h0M7 17h0" />
        <rect x="11" y="3" width="4" height="18" rx="1" />
        <path d="m17 5 4 14M18.7 10l-2.9.7" />
      </svg><span>Browse issues</span>
    </button>}
    {archiveOpen && <div className="newsletter-archive-scrim" onClick={() => setArchiveOpen(false)} aria-hidden="true" />}
    <aside id="newsletter-issue-navigation" className={archiveOpen ? 'newsletter-archive open' : 'newsletter-archive'} aria-label="Newsletter issues">
      <div className="archive-head">
        <span>ISSUE LIBRARY</span>
        <button className="archive-close" type="button" onClick={() => setArchiveOpen(false)} aria-label="Close issue navigation">×</button>
      </div>
      <nav className="archive-list" aria-label="Published newsletter issues">
        {issues.map(issue => <button key={issue.id} type="button" className={issue.id === selectedIssueId ? "archive-item selected" : "archive-item"} aria-current={issue.id === selectedIssueId ? "page" : undefined} onClick={() => { setSelectedIssueId(issue.id); setExpanded(false); window.scrollTo({top:0,behavior:"smooth"}) }}>
          <span>{issue.month} <small>ISSUE {issue.number}</small></span>
          <strong>{issue.title}</strong>
        </button>)}
      </nav>
      <p className="archive-coming">New issues appear here each month.</p>
    </aside>
    <section className={expanded ? 'newsletter-page expanded' : 'newsletter-page'}>
    <div className="newsletter-clean">
      <div className="newsletter-intro">
        <p className="eyebrow">{selectedIssue.month.toUpperCase()} · ISSUE {selectedIssue.number}</p>
        <p className="newsletter-label">CLUB NEWSLETTER</p>
        {isOctober ? <>
          <h1>We’re <span>official.</span> Bridges are first.</h1>
          <p className="newsletter-deck">Build a Better Bedford is now an official BHS club. We introduced it at the activity fair, held our first meeting, and voted on our first project. Bridges won.</p>
          <div className="newsletter-quote">Next up: bridge types, forces, materials, and our first load tests.</div>
        </> : <>
          <h1>Can you design <span>danger</span> out of a road?</h1>
          <p className="newsletter-deck">A look at how design, urbanism and engineering can make safer behavior easier and more intuitive.</p>
          <div className="newsletter-quote">If the environment influences behavior, engineering can help make the safer choice the easier choice.</div>
        </>}
      </div>

      <div className="newsletter-notes">
        <div className="newsletter-notes-head"><span>THE STORY</span><span>BUILD A BETTER BEDFORD</span></div>
        {activeSections.map(([number,title,text]) => <article className="newsletter-note" key={number}>
          <span>{number}</span>
          <div><h2>{title}</h2><p>{text}</p></div>
        </article>)}
        {isOctober ? <div className="newsletter-disclaimer">
          <strong>Club leadership</strong>
          <p>Alex Pominova · Club leader (11th grade)<br />Farah Semy · Co-leader (11th grade)<br />Julia Richards · Club advisor</p>
        </div> : <div className="newsletter-disclaimer">
          <strong>Design exploration, not an engineering plan.</strong>
          <p>A real design would require site measurements, accessibility and drainage requirements, traffic data, sight-distance analysis, utilities and right-of-way constraints.</p>
        </div>}
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
      {isOctober ? <>
        <section className="design-problem">
          <p className="expand-kicker">01 · WE’RE OFFICIAL</p>
          <div className="expand-grid">
            <div>
              <h2>Build a Better Bedford is officially a BHS club.</h2>
              <p>BBB is officially a BHS club. We'll learn engineering through case studies, models, measurements, and local infrastructure questions.</p>
            </div>
            <div className="design-principle">
              <span>LEADERSHIP TEAM</span>
              <strong>Alex Pominova · Farah Semy · Julia Richards</strong>
              <p>Alex Pominova (club leader, 11th grade), Farah Semy (co-leader, 11th grade) and Julia Richards (club advisor) will help organize projects, meetings and opportunities throughout the year.</p>
            </div>
          </div>
        </section>

        <section className="bedford-context">
          <p className="expand-kicker">02 · ACTIVITY FAIR</p>
          <div className="expand-grid">
            <div>
              <h2>At the activity fair</h2>
              <p>We introduced BBB at the activity fair, talked about bridge building and other project ideas, and invited students to join.</p>
            </div>
            <div>
              <h3>What students can expect</h3>
              <ul>
                <li>design and build physical models</li>
                <li>test structures and compare results</li>
                <li>learn the physics and math behind designs</li>
                <li>explore sustainability and materials</li>
                <li>look at real engineering challenges in Bedford</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="solution-section">
          <p className="expand-kicker">03 · OUR FIRST PROJECT</p>
          <div className="solution-layout">
            <div>
              <h2>First up: bridges</h2>
              <p>Bridges pull together statics, tension and compression, material properties, geometry, environmental constraints, cost, and failure analysis. We'll start with those basics and then build and test models.</p>
              <p>At our next meeting on <strong>Thursday, October 29</strong>, we’ll look at famous bridges around the world and ask why engineers chose particular shapes, materials and structural systems.</p>
              <p className="solution-note">After that: spaghetti bridge models and load testing.</p>
            </div>
            <div className="design-principle">
              <span>THE CHALLENGE</span>
              <strong>How much load can your bridge carry?</strong>
              <p>We’ll compare different shapes, watch where structures bend or fail, and use the results to redesign. Later, we’ll apply what we learn to a larger model inspired by the Golden Gate Bridge.</p>
            </div>
          </div>
        </section>

        <section className="inspiration-section">
          <p className="expand-kicker">04 · MEETINGS + WHAT’S NEXT</p>
          <div className="inspiration-grid">
            <article className="inspiration-card">
              <div className="inspiration-top"><span>WEEKLY MEETINGS</span><span>THURSDAYS</span></div>
              <h3>2:30–3:30 PM · Guidance Office</h3>
              <p>A recurring calendar invitation will be sent out. No prior engineering experience is needed — students can join with curiosity, creativity and a willingness to try something new.</p>
            </article>

            <article className="inspiration-card">
              <div className="inspiration-top"><span>BEYOND BRIDGES</span><span>THIS YEAR</span></div>
              <h3>After bridges</h3>
              <p>Bridges are the starting point. Throughout the year we’ll explore more areas of civil engineering, experiment with different designs and investigate real-world challenges in Bedford that engineering might help us understand.</p>
            </article>
          </div>
        </section>
      </> : <>
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
      </>}
      </div>}
  </section>
  </div>
}
