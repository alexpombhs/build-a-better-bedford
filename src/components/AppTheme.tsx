import { createTheme, ThemeProvider } from '@mui/material/styles'
import GlobalStyles from '@mui/material/GlobalStyles'
import type { ReactNode } from 'react'

// Shared radius token for MUI surfaces AND legacy CSS-based Ideas cards.
// The CSS variable is provided by this theme, not duplicated per page.
const cardRadius = 4
const theme=createTheme({
  palette:{primary:{main:'#173f2d'},secondary:{main:'#2f684b'},background:{default:'#ffffff'},text:{primary:'#17211b',secondary:'#61766a'}},
  shape:{borderRadius:cardRadius},
  typography:{fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',button:{textTransform:'none',fontWeight:750}},
  components:{
    MuiButton:{defaultProps:{disableElevation:true}},
    MuiPaper:{styleOverrides:{root:{backgroundImage:'none'}}},
    MuiTabs:{styleOverrides:{indicator:{backgroundColor:'#2f684b'}}},
  },
})
export function AppTheme({children}:{children:ReactNode}){
  return <ThemeProvider theme={theme}>
    <GlobalStyles styles={{':root':{'--bbb-card-radius': theme.shape.borderRadius + 'px'}}} />
    {children}
  </ThemeProvider>
}
