import type { ReactNode } from 'react'
import PageHeading from '../components/PageHeading'
import ProjectCard from '../components/ProjectCard'
import { UiBox, UiSlider, UiStack, UiTab, UiTabs, UiText } from '../components/atoms/MuiPrimitives'

export const labColors = { ink:'#10222e', accent:'#294b63', muted:'#465d70', border:'#d3dce2' }

export function SectionHeading({eyebrow,title,description,actions}:{eyebrow?:string;title:string;description:string;actions?:ReactNode}) {
  return <PageHeading eyebrow={eyebrow} title={title} description={description} actions={actions} className="bbb-section-heading" />
}

export function LabCard({eyebrow,title,children}:{eyebrow:string;title:string;children:ReactNode}) {
  return <ProjectCard>
    <UiText variant="overline" sx={{color:labColors.accent,fontSize:11,fontWeight:700,letterSpacing:1}}>{eyebrow}</UiText>
    <UiText variant="h6" sx={{fontFamily:"'Space Grotesk', Arial, sans-serif",fontSize:18,fontWeight:600,color:labColors.ink,my:1}}>{title}</UiText>
    <UiText variant="body2" sx={{color:labColors.muted,lineHeight:1.55,fontSize:14}}>{children}</UiText>
  </ProjectCard>
}

export function LabSlider({label,value,min,max,step=1,unit,onChange}:{label:string;value:number;min:number;max:number;step?:number;unit:string;onChange:(value:number)=>void}){
  return <UiStack spacing={1}>
    <UiStack direction="row" justifyContent="space-between" alignItems="center">
      <UiText sx={{fontWeight:700,fontSize:14}}>{label}</UiText><UiText sx={{fontWeight:800,color:labColors.accent,fontSize:14}}>{value} {unit}</UiText>
    </UiStack>
    <UiSlider aria-label={label} min={min} max={max} step={step} value={value} onChange={(_,v)=>onChange(v as number)} sx={{color:labColors.accent}} />
  </UiStack>
}

export function LabTabs({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <UiTabs value={value} onChange={(_,v)=>onChange(v)} variant="scrollable" scrollButtons="auto" aria-label="Engineering workspace sections" sx={{borderBottom:'1px solid '+labColors.border,mb:3,'& .MuiTabs-indicator':{backgroundColor:labColors.accent},'& .Mui-selected':{color:labColors.ink+' !important',fontWeight:800}}}>
    <UiTab value="simulators" label="Simulators"/><UiTab value="ideas" label="Ideas"/><UiTab value="lab" label="Lab"/><UiTab value="hands-on" label="Hands-on"/>
  </UiTabs>
}
