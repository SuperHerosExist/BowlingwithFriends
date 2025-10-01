import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GamesLanding from './GamesLanding.jsx'
import './index.css'
import './theme.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GamesLanding/>
  </StrictMode>,
)