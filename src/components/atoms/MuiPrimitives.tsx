import { useId } from 'react'
import type { ComponentProps } from 'react'
import { Box, Button, ButtonBase, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Slider, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

/** Atomic MUI boundary. Screens and organisms must import wrappers, never MUI directly. */
const classes = {
  box:'bbb-ui-box', action:'bbb-ui-action', select:'bbb-ui-select', surface:'bbb-ui-surface', card:'bbb-ui-card',
  cardContent:'bbb-ui-card-content', iconButton:'bbb-ui-icon-button', stack:'bbb-ui-stack', text:'bbb-ui-text',
  slider:'bbb-ui-slider', tab:'bbb-ui-tab', tabs:'bbb-ui-tabs',
}
const cx=(base:string, custom?:string)=>[base,custom].filter(Boolean).join(' ')
export function UiBox({className,...props}:ComponentProps<typeof Box>){return <Box {...props} className={cx(classes.box,className)} />}
export function UiSurface({className,...props}:ComponentProps<typeof Paper>){return <Paper {...props} className={cx(classes.surface,className)} />}
export function UiCard({className,...props}:ComponentProps<typeof Card>){return <Card {...props} className={cx(classes.card,className)} />}
export function UiCardContent({className,...props}:ComponentProps<typeof CardContent>){return <CardContent {...props} className={cx(classes.cardContent,className)} />}
export function UiStack({className,...props}:ComponentProps<typeof Stack>){return <Stack {...props} className={cx(classes.stack,className)} />}
export function UiText({className,...props}:ComponentProps<typeof Typography> & {component?: React.ElementType}){return <Typography {...props} className={cx(classes.text,className)} />}
export function UiSlider({className,...props}:ComponentProps<typeof Slider>){return <Slider {...props} className={cx(classes.slider,className)} />}
export function UiTab({className,...props}:ComponentProps<typeof Tab>){return <Tab {...props} className={cx(classes.tab,className)} />}
export function UiTabs({className,...props}:ComponentProps<typeof Tabs>){return <Tabs {...props} className={cx(classes.tabs,className)} />}

export function UiIconButton({className,...props}:ComponentProps<typeof IconButton>){return <IconButton {...props} className={cx(classes.iconButton,className)} />}

/** Visual icon atom for an arrow in an already-clickable surface.
 * Do not nest an IconButton inside another button. */
export function UiArrowForwardIcon({className,...props}:ComponentProps<typeof ArrowForwardRoundedIcon>){
  return <ArrowForwardRoundedIcon {...props} className={cx('bbb-ui-arrow-forward',className)} />
}

/** Accessible button atom. ButtonBase preserves native button semantics while
 * leaving presentation to the existing BBB class names and theme. */
export function UiActionButton({className,type='button',...props}:ComponentProps<typeof ButtonBase>){
  return <ButtonBase {...props} component="button" type={type} className={cx(classes.action,className)} />
}

/** A labeled, controlled MUI Select atom, with consistent value-only events.
 * Use this instead of a native <select> in editor molecules. */
export type UiSelectOption = { value: string; label: string; disabled?: boolean }
export type UiSelectProps = {
  label: string
  value: string
  options: readonly UiSelectOption[]
  onValueChange: (value: string) => void
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
}
export function UiSelect({ label, value, options, onValueChange, className, disabled, fullWidth = true, size = 'small' }: UiSelectProps) {
  const labelId = useId()
  return <FormControl className={cx(classes.select, className)} fullWidth={fullWidth} size={size} variant="outlined" disabled={disabled}>
    <InputLabel id={labelId}>{label}</InputLabel>
    <Select labelId={labelId} label={label} value={value} onChange={event => onValueChange(event.target.value)}>
      {options.map(option => <MenuItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</MenuItem>)}
    </Select>
  </FormControl>
}

/** Dialog atoms keep editorial workflows inside the shared MUI layer. */
export function UiDialog(props: ComponentProps<typeof Dialog>){return <Dialog {...props} />}
export function UiDialogTitle(props: ComponentProps<typeof DialogTitle>){return <DialogTitle {...props} />}
export function UiDialogContent(props: ComponentProps<typeof DialogContent>){return <DialogContent {...props} />}
export function UiDialogActions(props: ComponentProps<typeof DialogActions>){return <DialogActions {...props} />}

export function UiTextField(props: ComponentProps<typeof TextField>){return <TextField {...props} />}

/** Configurable MUI button atom; variants remain available to molecules. */
export function UiButton({className,...props}:ComponentProps<typeof Button>){
  return <Button {...props} className={cx('bbb-ui-button',className)} />
}
