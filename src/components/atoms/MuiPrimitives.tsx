import type { ComponentProps } from 'react'
import { Box, Card, CardContent, IconButton, Paper, Slider, Stack, Tab, Tabs, Typography } from '@mui/material'

/** Atomic MUI boundary. Screens and organisms must import wrappers, never MUI directly. */
const classes = {
  box:'bbb-ui-box', surface:'bbb-ui-surface', card:'bbb-ui-card',
  cardContent:'bbb-ui-card-content', iconButton:'bbb-ui-icon-button', stack:'bbb-ui-stack', text:'bbb-ui-text',
  slider:'bbb-ui-slider', tab:'bbb-ui-tab', tabs:'bbb-ui-tabs',
}
const cx=(base:string, custom?:string)=>[base,custom].filter(Boolean).join(' ')
export function UiBox({className,...props}:ComponentProps<typeof Box>){return <Box {...props} className={cx(classes.box,className)} />}
export function UiSurface({className,...props}:ComponentProps<typeof Paper>){return <Paper {...props} className={cx(classes.surface,className)} />}
export function UiCard({className,...props}:ComponentProps<typeof Card>){return <Card {...props} className={cx(classes.card,className)} />}
export function UiCardContent({className,...props}:ComponentProps<typeof CardContent>){return <CardContent {...props} className={cx(classes.cardContent,className)} />}
export function UiStack({className,...props}:ComponentProps<typeof Stack>){return <Stack {...props} className={cx(classes.stack,className)} />}
export function UiText({className,...props}:ComponentProps<typeof Typography>){return <Typography {...props} className={cx(classes.text,className)} />}
export function UiSlider({className,...props}:ComponentProps<typeof Slider>){return <Slider {...props} className={cx(classes.slider,className)} />}
export function UiTab({className,...props}:ComponentProps<typeof Tab>){return <Tab {...props} className={cx(classes.tab,className)} />}
export function UiTabs({className,...props}:ComponentProps<typeof Tabs>){return <Tabs {...props} className={cx(classes.tabs,className)} />}

export function UiIconButton({className,...props}:ComponentProps<typeof IconButton>){return <IconButton {...props} className={cx(classes.iconButton,className)} />}
