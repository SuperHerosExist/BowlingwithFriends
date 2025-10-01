import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GamesLanding from './GamesLanding.jsx'
import { AuthProvider } from './AuthContext.jsx'
import './index.css'
import './theme.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <GamesLanding/>
    </AuthProvider>
  </StrictMode>,
)