import { UiActionButton, UiBox, UiText } from './components/atoms/MuiPrimitives'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded'
import './about.css'
import PageHeading from './components/PageHeading'
import ProjectCard from './components/ProjectCard'

type Detail = { label: string; value: string; note?: string }
const team: Detail[] = [
  {label:'Club leader',value:'Alex Pominova',note:'11th grade'},
  {label:'Co-leader',value:'Farah Semy',note:'11th grade'},
  {label:'Club advisor',value:'Julia Richards'},
]
const meetingDetails = (nextMeetingDate: string): Detail[] => [
  {label:'When',value:'Mondays, 2:30–3:30 PM'},
  {label:'Where',value:'Guidance Office'},
  {label:'Next meeting',value:nextMeetingDate},
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
  return <ProjectCard className="bbb-about-panel">
    <UiBox className="bbb-about-panel-content">
      <UiText variant="h6" className="bbb-about-panel-title">{title}</UiText>
      <DetailRows items={items}/>
    </UiBox>
  </ProjectCard>
}

export default function AboutPage({onJoin,nextMeetingDate}:{onJoin:()=>void;nextMeetingDate:string}) {
  return <UiBox className="bbb-about-page">
    <PageHeading className="bbb-about-intro" title="The club" description="Build a Better Bedford is a student-led civil engineering club. We study real structures and infrastructure, build models, run tests, and learn from people working in the field." />
    <UiBox className="bbb-about-grid">
      <InfoPanel title="Club leadership" items={team}/>
      <InfoPanel title="Meetings" items={meetingDetails(nextMeetingDate)}/>
    </UiBox>
    <UiBox className="bbb-about-connect" role="region" aria-label="Connect with Build a Better Bedford">
      <UiBox className="bbb-about-connect-copy">
        <UiText className="bbb-about-connect-kicker">GET INVOLVED</UiText>
        <UiText component="h2" className="bbb-about-connect-title">Keep building with us.</UiText>
        <UiText component="p" className="bbb-about-connect-description">
          See our experiments, follow new projects, or come to a meeting.
        </UiText>
      </UiBox>
      <UiBox className="bbb-about-connect-actions">
        <UiActionButton className="bbb-about-connect-join" onClick={onJoin}>
          <span>Join the club</span>
          <ArrowForwardRoundedIcon aria-hidden="true" fontSize="small"/>
        </UiActionButton>
        <UiBox className="bbb-about-connect-follow">
          <UiText className="bbb-about-connect-follow-label">FOLLOW THE CLUB</UiText>
          <UiBox className="bbb-about-connect-links">
            <a href="https://www.instagram.com/build_a_better_bedford_club/" target="_blank" rel="noopener noreferrer" className="bbb-about-connect-link" aria-label="Build a Better Bedford Instagram (opens in new tab)">
              <InstagramIcon aria-hidden="true" fontSize="small"/>
              Instagram
              <NorthEastRoundedIcon aria-hidden="true" className="bbb-about-connect-link-arrow"/>
            </a>
            <a href="https://www.linkedin.com/company/build-a-better-bedford/posts/" target="_blank" rel="noopener noreferrer" className="bbb-about-connect-link" aria-label="Build a Better Bedford LinkedIn (opens in new tab)">
              <LinkedInIcon aria-hidden="true" fontSize="small"/>
              LinkedIn
              <NorthEastRoundedIcon aria-hidden="true" className="bbb-about-connect-link-arrow"/>
            </a>
          </UiBox>
        </UiBox>
      </UiBox>
    </UiBox>
    <UiText variant="body2" className="bbb-about-disclaimer">
      Build a Better Bedford is an approved student club at Bedford High School. This website is created and maintained by students, rather than being an official Bedford Public Schools publication.
    </UiText>
  </UiBox>
}
