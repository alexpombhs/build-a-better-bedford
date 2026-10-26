import type { ReactNode } from 'react'
import { UiBox, UiCard, UiCardContent, UiSlider, UiStack, UiTab, UiTabs, UiText } from '../components/atoms/MuiPrimitives'

export const labColors = { ink:'#173f2d', accent:'#2f684b', muted:'#61766a', border:'#d7e0da' }

export function SectionHeading({eyebrow,title,description}:{eyebrow:string;title:string;description:string}) {
  return <UiBox sx={{maxWidth:850,mb:3}}>
    <UiText variant="overline" sx={{color:labColors.accent,fontWeight:800,letterSpacing:2}}>{eyebrow}</UiText>
    <UiText variant="h3" sx={{fontFamily:'Georgia, serif',fontWeight:500,color:labColors.ink,fontSize:{xs:34,md:50},my:1}}>{title}</UiText>
    <UiText sx={{color:labColors.muted,lineHeight:1.7}}>{description}</UiText>
  </UiBox>
}

export function LabCard({eyebrow,title,children}:{eyebrow:string;title:string;children:ReactNode}) {
  return <UiCard variant="outlined" sx={{borderColor:labColors.border,borderRadius:3,height:'100%',boxShadow:'none'}}>
    <UiCardContent sx={{p:3,'&:last-child':{pb:3}}}>
      <UiText variant="overline" sx={{color:labColors.accent,fontWeight:800}}>{eyebrow}</UiText>
      <UiText variant="h6" sx={{fontWeight:750,color:labColors.ink,my:1}}>{title}</UiText>
      <UiText variant="body2" sx={{color:labColors.muted,lineHeight:1.7}}>{children}</UiText>
    </UiCardContent>
  </UiCard>
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
