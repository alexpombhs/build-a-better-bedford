import type { ReactNode } from 'react'
import { Box, Card, CardContent, Slider, Stack, Tab, Tabs, Typography } from '@mui/material'

export const labColors = { ink:'#173f2d', accent:'#2f684b', muted:'#61766a', border:'#d7e0da' }

export function SectionHeading({eyebrow,title,description}:{eyebrow:string;title:string;description:string}) {
  return <Box sx={{maxWidth:850,mb:3}}>
    <Typography variant="overline" sx={{color:labColors.accent,fontWeight:800,letterSpacing:2}}>{eyebrow}</Typography>
    <Typography variant="h3" component="h2" sx={{fontFamily:'Georgia, serif',fontWeight:500,color:labColors.ink,fontSize:{xs:34,md:50},my:1}}>{title}</Typography>
    <Typography sx={{color:labColors.muted,lineHeight:1.7}}>{description}</Typography>
  </Box>
}

export function LabCard({eyebrow,title,children}:{eyebrow:string;title:string;children:ReactNode}) {
  return <Card variant="outlined" sx={{borderColor:labColors.border,borderRadius:3,height:'100%',boxShadow:'none'}}>
    <CardContent sx={{p:3,'&:last-child':{pb:3}}}>
      <Typography variant="overline" sx={{color:labColors.accent,fontWeight:800}}>{eyebrow}</Typography>
      <Typography variant="h6" component="h3" sx={{fontWeight:750,color:labColors.ink,my:1}}>{title}</Typography>
      <Typography variant="body2" sx={{color:labColors.muted,lineHeight:1.7}}>{children}</Typography>
    </CardContent>
  </Card>
}

export function LabSlider({label,value,min,max,step=1,unit,onChange}:{label:string;value:number;min:number;max:number;step?:number;unit:string;onChange:(value:number)=>void}){
  return <Stack spacing={1}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{fontWeight:700,fontSize:14}}>{label}</Typography><Typography sx={{fontWeight:800,color:labColors.accent,fontSize:14}}>{value} {unit}</Typography>
    </Stack>
    <Slider aria-label={label} min={min} max={max} step={step} value={value} onChange={(_,v)=>onChange(v as number)} sx={{color:labColors.accent}} />
  </Stack>
}

export function LabTabs({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <Tabs value={value} onChange={(_,v)=>onChange(v)} variant="scrollable" scrollButtons="auto" aria-label="Engineering workspace sections" sx={{borderBottom:'1px solid '+labColors.border,mb:3,'& .MuiTabs-indicator':{backgroundColor:labColors.accent},'& .Mui-selected':{color:labColors.ink+' !important',fontWeight:800}}}>
    <Tab value="simulators" label="Simulators"/><Tab value="ideas" label="Ideas"/><Tab value="lab" label="Lab"/><Tab value="hands-on" label="Hands-on"/>
  </Tabs>
}
