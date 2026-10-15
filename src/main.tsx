import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { loadLookFonts } from '@/app/looks'
import { launchApp } from '@/app/store'
import { followTheme } from '@/app/theme'
import { stopWhenAudioInterrupted } from '@/features/playback/transport'
import { keepAwakeWhilePlaying } from '@/features/playback/wakeLock'
import type { Look } from '@/core'
import '@/styles/index.css'

// The inline script's look, whose fonts can load while the settings do.
loadLookFonts(document.documentElement.dataset.look as Look)

keepAwakeWhilePlaying()
stopWhenAudioInterrupted()

launchApp().then(() => {
  followTheme()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
