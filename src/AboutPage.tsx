import { UiBox, UiCard, UiCardContent, UiText } from './components/atoms/MuiPrimitives'
import './about.css'

type Detail = { label: string; value: string; note?: string }
const team: Detail[] = [
  {label:'Club leader',value:'Alex Pominova',note:'11th grade'},
  {label:'Co-leader',value:'Farah Semy',note:'11th grade'},
  {label:'Club advisor',value:'Julia Richards'},
]
const schedule: Detail[] = [
  {label:'When',value:'Thursdays, 2:30–3:30 PM'},
  {label:'Where',value:'Guidance Office'},
  {label:'Next meeting',value:'Thursday, October 29, 2026'},
]

function DetailRows({items}:{items:Detail[]}) {
  return <UiBox className="bbb-about-rows">
    {items.map(item=><UiBox key={item.label} className="bbb-about-row">
      <UiText variant="body2" className="bbb-about-row-label">{item.label}</UiText>
      <UiBox className="bbb-about-row-value">
        <UiText variant="body1" className="bbb-about-value">{item.value}</UiText>
        {item.note && <UiText variant="caption" className="bbb-about-note">{item.note}</UiText>}
      </UiBox>
    </UiBox>)}
  </UiBox>
}

function InfoPanel({title,items}:{title:string;items:Detail[]}) {
  return <UiCard variant="outlined" className="bbb-about-panel">
    <UiCardContent className="bbb-about-panel-content">
      <UiText variant="h6" className="bbb-about-panel-title">{title}</UiText>
      <DetailRows items={items}/>
    </UiCardContent>
  </UiCard>
}

export default function AboutPage({onJoin}:{onJoin:()=>void}) {
  return <UiBox className="bbb-about-page">
    <UiBox className="bbb-about-intro">
      <UiText variant="h3" className="bbb-about-title">The club</UiText>
      <UiText variant="body1" className="bbb-about-description">
        Build a Better Bedford is a student-led civil engineering club. We study real structures and infrastructure, build models, run tests, and learn from people working in the field.
      </UiText>
    </UiBox>
    <UiBox className="bbb-about-grid">
      <InfoPanel title="Club leadership" items={team}/>
      <InfoPanel title="Meetings" items={schedule}/>
    </UiBox>
    <UiBox className="bbb-about-cta">
      <UiText variant="body1">Want to join?</UiText>
      <button className="bbb-about-join" onClick={onJoin}>Join the club <span aria-hidden="true">→</span></button>
    </UiBox>
    <UiText variant="body2" className="bbb-about-disclaimer">
      This is an independent, student-run website.
    </UiText>
  </UiBox>
}
