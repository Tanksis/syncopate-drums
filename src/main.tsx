import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { launchApp } from '@/app/store'
import '@/styles/index.css'

// Without storage (a blocked or failed IndexedDB) the app still opens, on an unsaved new exercise.
launchApp()
  .catch((error) => console.error('Could not open saved exercises', error))
  .finally(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
