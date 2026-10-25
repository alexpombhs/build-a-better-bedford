import { useState } from 'react'
import './engineeringLab.css'

type Tab = 'simulators' | 'ideas' | 'lab' | 'hands-on'

export function EngineeringTabs({active,onChange}:{active:Tab;onChange:(tab:Tab)=>void}) {
  const tabs: {id:Tab;label:string}[] = [
    {id:'simulators',label:'Simulators'},{id:'ideas',label:'Ideas'},
    {id:'lab',label:'Lab'},{id:'hands-on',label:'Hands-on'},
  ]
  return <nav className="engineering-tabs" aria-label="Projects sections">
    {tabs.map(t=><button type="button" key={t.id} aria-current={active===t.id?'page':undefined}
      className={active===t.id?'engineering-tab selected':'engineering-tab'}
      onClick={()=>onChange(t.id)}>{t.label}</button>)}
  </nav>
}

export function EngineeringWorkspace({tab}:{tab:Exclude<Tab,'ideas'>}) {
  const [load,setLoad]=useState(10)
  const [position,setPosition]=useState(50)
  const [span,setSpan]=useState(6)
  const a=span*position/100
  const left=load*(span-a)/span
  const right=load*a/span
  const maxMoment=left*a
  if(tab==='lab') return <div className="engineering-workspace">
    <div className="engineering-workspace-head"><p className="eyebrow">ENGINEERING LAB</p><h2>Try it. Measure it. Improve it.</h2><p>Use the lab as a place to document tests, compare designs, and explain what changed.</p></div>
    <div className="engineering-resource-grid">
      <article><span>01 / QUESTION</span><h3>Make a prediction</h3><p>Choose a problem and decide what you expect to happen before testing.</p></article>
      <article><span>02 / TEST</span><h3>Change one variable</h3><p>Keep the other conditions the same, record measurements, and repeat trials.</p></article>
      <article><span>03 / REVIEW</span><h3>Share what you learned</h3><p>Make a simple graph, explain any unexpected results, and sketch your next iteration.</p></article>
    </div>
  </div>
  if(tab==='hands-on') return <div className="engineering-workspace">
    <div className="engineering-workspace-head"><p className="eyebrow">HANDS-ON ENGINEERING</p><h2>Build something you can test.</h2><p>Easy starting activities for club meetings. Use classroom-safe materials and ask a teacher to supervise testing.</p></div>
    <div className="engineering-resource-grid">
      <article><span>BRIDGES</span><h3>Paper beam challenge</h3><p>Compare a flat sheet, folded channel, and accordion fold spanning the same gap. Test with small, gradually added weights.</p></article>
      <article><span>STRUCTURES</span><h3>Triangle vs. square</h3><p>Build two small straw frames and gently push sideways to compare how their shapes resist deformation.</p></article>
      <article><span>ROAD DESIGN</span><h3>Crosswalk model</h3><p>Create two tabletop street layouts and compare crossing distance, visibility, and pedestrian waiting space using toy cars.</p></article>
    </div>
  </div>
  return <div className="engineering-workspace">
    <div className="engineering-workspace-head"><p className="eyebrow">INTERACTIVE SIMULATORS / 01</p><h2>How does a bridge carry a load?</h2><p>Explore a simplified, simply supported beam. Move the load and change the span to see how the support reactions and bending moment change.</p></div>
    <div className="simulator-layout">
      <div className="simulator-visual">
        <svg viewBox="0 0 640 310" role="img" aria-label="A simply supported beam with an adjustable point load and reactions at both ends">
          <line x1="64" y1="155" x2="576" y2="155" stroke="#234b39" strokeWidth="12" strokeLinecap="round"/>
          <path d="M64 165 L43 196 L85 196 Z M576 165 L555 196 L597 196 Z" fill="#9fb6a6" stroke="#234b39" strokeWidth="2"/>
          <line x1="35" y1="201" x2="99" y2="201" stroke="#234b39" strokeWidth="3"/>
          <circle cx="564" cy="203" r="7" fill="#9fb6a6" stroke="#234b39" strokeWidth="2"/>
          <circle cx="588" cy="203" r="7" fill="#9fb6a6" stroke="#234b39" strokeWidth="2"/>
          <line x1={64+512*position/100} y1="44" x2={64+512*position/100} y2="128" stroke="#bd613d" strokeWidth="5"/>
          <path d={`M${64+512*position/100-12} 111 L${64+512*position/100} 135 L${64+512*position/100+12} 111 Z`} fill="#bd613d"/>
          <text x={64+512*position/100} y="29" textAnchor="middle" fill="#974d31" fontSize="19" fontWeight="700">{load} kN</text>
          <line x1="64" y1="265" x2="576" y2="265" stroke="#789587" strokeWidth="2"/>
          <path d="M64 257 V273 M576 257 V273" stroke="#789587" strokeWidth="2"/>
          <text x="320" y="291" textAnchor="middle" fill="#405b4b" fontSize="18">{span} m span</text>
          <text x="64" y="231" textAnchor="middle" fill="#2e6c4b" fontSize="17">A</text>
          <text x="576" y="231" textAnchor="middle" fill="#2e6c4b" fontSize="17">B</text>
        </svg>
        <p>Concept model: assumes a weightless beam, a single static point load, and simple supports. Not for designing real bridges.</p>
      </div>
      <div className="simulator-controls">
        <label>Load <strong>{load} kN</strong><input type="range" min="1" max="30" value={load} onChange={e=>setLoad(Number(e.target.value))}/></label>
        <label>Load position <strong>{position}% from A</strong><input type="range" min="10" max="90" step="5" value={position} onChange={e=>setPosition(Number(e.target.value))}/></label>
        <label>Bridge span <strong>{span} m</strong><input type="range" min="2" max="12" value={span} onChange={e=>setSpan(Number(e.target.value))}/></label>
        <div className="simulator-metrics">
          <div><small>Reaction at A</small><strong>{left.toFixed(1)} kN</strong></div>
          <div><small>Reaction at B</small><strong>{right.toFixed(1)} kN</strong></div>
          <div><small>Peak bending moment</small><strong>{maxMoment.toFixed(1)} kN·m</strong></div>
        </div>
        <p className="simulator-tip">Try moving the same load toward one support. Which support carries more of it?</p>
      </div>
    </div>
  </div>
}
