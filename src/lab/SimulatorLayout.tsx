import type { ReactNode } from 'react'
import { UiBox, UiButton, UiSurface, UiText } from '../components/atoms/MuiPrimitives'
import { labColors } from './LabUI'

// Shared engineering simulator organisms: the same composition, spacing,
// surfaces and status treatment for every experiment.
export function SimulatorWorkspace({ status, visual, controls }: {
  status: ReactNode
  visual: ReactNode
  controls: ReactNode
}) {
  return <UiBox sx={{
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.27fr) minmax(335px,.73fr)' },
    columnGap: 2, rowGap: 1.25, pb: 2, alignItems: 'start',
  }}>
    <UiBox sx={{ display:'flex', flexDirection:'column', gap:1.25, minWidth:0 }}>
      {status}
      {visual}
    </UiBox>
    {controls}
  </UiBox>
}

export function SimulatorStatus({ title, detail, tone = 'neutral', actionLabel, onAction }: {
  title: ReactNode
  detail: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'failure'
  actionLabel?: string
  onAction?: () => void
}) {
  const palette = {
    neutral: { bg:'#f2f6f8', border:labColors.border, ink:labColors.ink },
    success: { bg:'#edf5f1', border:'#c5dacf', ink:'#276957' },
    warning: { bg:'#fff7e9', border:'#e7d3a4', ink:'#8c5c1c' },
    failure: { bg:'#fff0eb', border:'#df9e89', ink:'#9b3825' },
  }[tone]
  return <UiBox role="status" aria-live="polite" sx={{
    px:2, py:.75, border:'1px solid '+palette.border, bgcolor:palette.bg,
    borderRadius:'var(--bbb-card-radius, 4px)',
    display:'flex', alignItems:{xs:'stretch',sm:'center'},
    justifyContent:'space-between', flexDirection:{xs:'column',sm:'row'}, gap:1,
  }}>
    <UiBox sx={{minWidth:0}}>
      <UiText sx={{fontSize:14,fontWeight:800,color:palette.ink}}>{title}</UiText>
      <UiText variant="body2" sx={{fontSize:12,lineHeight:1.5,color:labColors.muted}}>{detail}</UiText>
    </UiBox>
    {actionLabel && onAction && <UiButton variant="contained" size="small" onClick={onAction}
      sx={{bgcolor:labColors.accent,whiteSpace:'nowrap',textTransform:'none',
        alignSelf:{xs:'flex-start',sm:'center'},'&:hover':{bgcolor:labColors.ink}}}>
      {actionLabel}
    </UiButton>}
  </UiBox>
}

export function SimulatorVisual({ title, children, height }: {
  title: ReactNode
  children: ReactNode
  height?: number
}) {
  return <UiSurface variant="outlined" sx={{
    p:{xs:1.5,md:2}, bgcolor:'#f5f8fa', borderColor:labColors.border,
    height:height ?? 450, boxSizing:'border-box', overflow:'hidden',
    display:'flex', flexDirection:'column', minHeight:0,
  }}>
    <UiText sx={{fontSize:14,fontWeight:700,color:labColors.ink,mb:.5}}>{title}</UiText>
    <UiBox sx={{flex:1,minHeight:0,width:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
      {children}
    </UiBox>
  </UiSurface>
}

export function SimulatorControls({ children }: { children:ReactNode }) {
  return <UiSurface variant="outlined" sx={{
    p:{xs:1.5,md:2}, borderColor:labColors.border,
    display:'flex', flexDirection:'column', gap:1,
    boxSizing:'border-box', minWidth:0,
  }}>{children}</UiSurface>
}
