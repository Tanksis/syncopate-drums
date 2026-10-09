import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { launchApp } from '@/app/store'
import { followTheme } from '@/app/theme'
import { keepAwakeWhilePlaying } from '@/features/playback/wakeLock'
import '@/styles/index.css'

keepAwakeWhilePlaying()

launchApp().then(() => {
  followTheme()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
