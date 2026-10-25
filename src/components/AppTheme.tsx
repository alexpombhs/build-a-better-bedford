import { createTheme, ThemeProvider } from '@mui/material/styles'
import type { ReactNode } from 'react'

const theme=createTheme({
  palette:{primary:{main:'#173f2d'},secondary:{main:'#2f684b'},background:{default:'#ffffff'},text:{primary:'#17211b',secondary:'#61766a'}},
  shape:{borderRadius:10},
  typography:{fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',button:{textTransform:'none',fontWeight:750}},
  components:{
    MuiButton:{defaultProps:{disableElevation:true}},
    MuiPaper:{styleOverrides:{root:{backgroundImage:'none'}}},
    MuiTabs:{styleOverrides:{indicator:{backgroundColor:'#2f684b'}}},
  },
})
export function AppTheme({children}:{children:ReactNode}){return <ThemeProvider theme={theme}>{children}</ThemeProvider>}
