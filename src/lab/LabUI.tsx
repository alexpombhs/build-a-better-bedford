import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import PageHeading from '../components/PageHeading'
import ProjectCard from '../components/ProjectCard'
import { UiBox, UiButton, UiSlider, UiStack, UiTab, UiTabs, UiText } from '../components/atoms/MuiPrimitives'

export const labColors = { ink:'#10222e', accent:'#294b63', muted:'#465d70', border:'#d3dce2' }

export function SectionHeading({eyebrow,title,description,actions,compact=false}:{eyebrow?:string;title:string;description:string;actions?:ReactNode;compact?:boolean}) {
  // Compact project heading: one shared, accessible label without the oversized
  // editorial title and subtitle. Tab-specific content supplies its own hierarchy.
  if (compact) return <UiBox sx={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:1,mb:0,minHeight:40}}>
    <UiText component="h1" sx={{m:0,fontSize:11,fontWeight:800,lineHeight:1.35,letterSpacing:'.09em',textTransform:'uppercase',color:labColors.muted}}>
      {eyebrow || title}
    </UiText>
    {actions && <UiBox sx={{ml:'auto'}}>{actions}</UiBox>}
  </UiBox>
  return <PageHeading eyebrow={eyebrow} title={title} description={description} actions={actions} className="bbb-section-heading" />
}

export function LabCard({eyebrow,title,children}:{eyebrow:string;title:string;children:ReactNode}) {
  return <ProjectCard>
    <UiText variant="overline" sx={{color:labColors.accent,fontSize:11,fontWeight:700,letterSpacing:1}}>{eyebrow}</UiText>
    <UiText variant="h6" sx={{fontFamily:"'Space Grotesk', Arial, sans-serif",fontSize:18,fontWeight:600,color:labColors.ink,my:1}}>{title}</UiText>
    <UiText variant="body2" sx={{color:labColors.muted,lineHeight:1.55,fontSize:14}}>{children}</UiText>
  </ProjectCard>
}

export function LabSlider({label,value,min,max,step=1,unit,onChange,disabled=false,compact=false}:{label:string;value:number;min:number;max:number;step?:number;unit:string;onChange:(value:number)=>void;disabled?:boolean;compact?:boolean}){
  if(compact) return <UiBox sx={{display:'grid',gridTemplateColumns:{xs:'minmax(118px,1.1fr) minmax(68px,1fr) 58px',md:'minmax(132px,1.2fr) minmax(74px,1fr) 60px'},alignItems:'center',gap:1,minHeight:35}}>
    <UiText sx={{fontSize:12.5,fontWeight:650,lineHeight:1.2,color:labColors.ink}}>{label}</UiText>
    <UiSlider aria-label={label} min={min} max={max} step={step} value={value} disabled={disabled} onChange={(_,v)=>onChange(v as number)} size="small"
      sx={{color:labColors.accent,py:1,'& .MuiSlider-thumb':{width:14,height:14},'& .MuiSlider-rail':{height:3},'& .MuiSlider-track':{height:3}}} />
    <UiText sx={{fontSize:12.5,color:labColors.accent,fontWeight:800,textAlign:'right',whiteSpace:'nowrap'}}>{value} {unit}</UiText>
  </UiBox>
  return <UiStack spacing={1}>
    <UiStack direction="row" justifyContent="space-between" alignItems="center">
      <UiText sx={{fontWeight:700,fontSize:14}}>{label}</UiText><UiText sx={{fontWeight:800,color:labColors.accent,fontSize:14}}>{value} {unit}</UiText>
    </UiStack>
    <UiSlider aria-label={label} min={min} max={max} step={step} value={value} disabled={disabled} onChange={(_,v)=>onChange(v as number)} sx={{color:labColors.accent}} />
  </UiStack>
}

export function LabTabs({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <UiTabs value={value} onChange={(_,v)=>onChange(v)} variant="scrollable" scrollButtons="auto" aria-label="Engineering workspace sections" sx={{borderBottom:'1px solid '+labColors.border,mb:0,'& .MuiTabs-indicator':{backgroundColor:labColors.accent},'& .Mui-selected':{color:labColors.ink+' !important',fontWeight:800}}}>
    <UiTab value="ideas" label="Ideas"/><UiTab value="simulators" label="Simulators"/><UiTab value="hands-on" label="Hands-on"/>
  </UiTabs>
}

/** Engineering-lab molecule: shared cable status and prominent reset action.
 * Composed entirely from the site's MUI atoms, never raw MUI imports. */
export function CableStatusBar({
  status, tension, strength, segment, onReset, warningTitle, warningDetail,
}: {
  status: 'intact' | 'warning' | 'broken'
  tension: number
  strength: number
  segment?: number
  onReset?: () => void
  warningTitle?: string
  warningDetail?: string
}) {
  const palette = status === 'broken'
    ? { bg: '#fff0eb', border: '#df9e89', ink: '#9b3825' }
    : status === 'warning'
      ? { bg: '#fff7e9', border: '#e7d3a4', ink: '#8c5c1c' }
      : { bg: '#edf5f1', border: '#c5dacf', ink: '#276957' }
  const label = status === 'broken'
    ? 'Cable broken' + (segment === undefined ? '' : ' · segment ' + segment)
    : status === 'warning' ? (warningTitle ?? 'Approaching breaking strength') : 'Cable intact'

  return <UiBox
    role={status === 'broken' ? 'alert' : 'status'}
    sx={{
      border: '1px solid ' + palette.border,
      bgcolor: palette.bg,
      borderRadius: 'var(--bbb-card-radius, 4px)',
      px: 2,
      py: 0.75,
      mb: 0,
      display: 'flex',
      alignItems: { xs: 'stretch', sm: 'center' },
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 1,
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
      {warningDetail && <UiText sx={{ color: palette.ink, fontSize: 12, lineHeight: 1.45, mt: 0.25 }}>
        {warningDetail}
      </UiText>}
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

/** Collapsible lab calculations, kept behind a simple MUI-based molecule.
 * Provides full force detail without pushing interactive controls below the fold. */
export function LabDetails({children,title='Force details'}:{children:ReactNode;title?:string}) {
  const [expanded,setExpanded] = useState(false)
  const id = useId()
  return <UiBox sx={{mt:0.5}}>
    <UiButton variant="text" size="small" onClick={() => setExpanded(value => !value)}
      aria-expanded={expanded} aria-controls={id} sx={{px:0,fontSize:12.5,color:labColors.accent}}>
      {expanded ? 'Hide' : 'Show'} {title.toLowerCase()} {expanded ? '▴' : '▾'}
    </UiButton>
    <UiBox id={id} sx={{display:expanded?'block':'none'}}>{children}</UiBox>
  </UiBox>
}
