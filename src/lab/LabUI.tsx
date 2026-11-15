import type { ReactNode } from 'react'
import PageHeading from '../components/PageHeading'
import ProjectCard from '../components/ProjectCard'
import { UiBox, UiButton, UiSlider, UiStack, UiTab, UiTabs, UiText } from '../components/atoms/MuiPrimitives'

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

export function LabSlider({label,value,min,max,step=1,unit,onChange,disabled=false}:{label:string;value:number;min:number;max:number;step?:number;unit:string;onChange:(value:number)=>void;disabled?:boolean}){
  return <UiStack spacing={1}>
    <UiStack direction="row" justifyContent="space-between" alignItems="center">
      <UiText sx={{fontWeight:700,fontSize:14}}>{label}</UiText><UiText sx={{fontWeight:800,color:labColors.accent,fontSize:14}}>{value} {unit}</UiText>
    </UiStack>
    <UiSlider aria-label={label} min={min} max={max} step={step} value={value} disabled={disabled} onChange={(_,v)=>onChange(v as number)} sx={{color:labColors.accent}} />
  </UiStack>
}

export function LabTabs({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <UiTabs value={value} onChange={(_,v)=>onChange(v)} variant="scrollable" scrollButtons="auto" aria-label="Engineering workspace sections" sx={{borderBottom:'1px solid '+labColors.border,mb:value === 'ideas' ? 0 : 3,'& .MuiTabs-indicator':{backgroundColor:labColors.accent},'& .Mui-selected':{color:labColors.ink+' !important',fontWeight:800}}}>
    <UiTab value="ideas" label="Ideas"/><UiTab value="simulators" label="Simulators"/><UiTab value="hands-on" label="Hands-on"/>
  </UiTabs>
}

/** Engineering-lab molecule: shared cable status and prominent reset action.
 * Composed entirely from the site's MUI atoms, never raw MUI imports. */
export function CableStatusBar({
  status, tension, strength, segment, onReset,
}: {
  status: 'intact' | 'warning' | 'broken'
  tension: number
  strength: number
  segment?: number
  onReset?: () => void
}) {
  const palette = status === 'broken'
    ? { bg: '#fff0eb', border: '#df9e89', ink: '#9b3825' }
    : status === 'warning'
      ? { bg: '#fff7e9', border: '#e7d3a4', ink: '#8c5c1c' }
      : { bg: '#edf5f1', border: '#c5dacf', ink: '#276957' }
  const label = status === 'broken'
    ? 'Cable broken' + (segment === undefined ? '' : ' · segment ' + segment)
    : status === 'warning' ? 'Approaching breaking strength' : 'Cable intact'

  return <UiBox
    role={status === 'broken' ? 'alert' : 'status'}
    sx={{
      border: '1px solid ' + palette.border,
      bgcolor: palette.bg,
      borderRadius: 2,
      px: 2,
      py: 1.25,
      mb: 1.5,
      display: 'flex',
      alignItems: { xs: 'stretch', sm: 'center' },
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 1.5,
    }}
  >
    <UiBox sx={{ minWidth: 0 }}>
      <UiText sx={{ color: palette.ink, fontWeight: 800, fontSize: 14 }}>
        {label}
      </UiText>
      <UiText variant="body2" sx={{ color: labColors.muted, fontSize: 12, lineHeight: 1.5 }}>
        Peak tension {tension.toFixed(1)} kN / limit {strength.toFixed(1)} kN
        {status === 'broken' ? ' · Frozen until reset' : ''}
      </UiText>
    </UiBox>
    {status === 'broken' && onReset && <UiButton
      variant="contained"
      size="small"
      onClick={onReset}
      sx={{ bgcolor: labColors.accent, whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' }, '&:hover': { bgcolor: labColors.ink } }}
    >
      Replace cable
    </UiButton>}
  </UiBox>
}
