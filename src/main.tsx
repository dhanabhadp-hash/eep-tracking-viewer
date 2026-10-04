import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { TRPCProvider } from '@/providers/trpc'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA (production only)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app still works normally
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TRPCProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TRPCProvider>
  </StrictMode>,
)
