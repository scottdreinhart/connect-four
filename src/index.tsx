import './styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { SoundProvider } from '@/app/SoundContext'
import { ThemeProvider } from '@/app/ThemeContext'
import { ErrorBoundary } from '@/ui/atoms/ErrorBoundary'
import App from '@/ui/organisms/App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      <SoundProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SoundProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
