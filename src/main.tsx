import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { InvestmentProvider } from './context/InvestmentContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <InvestmentProvider>
        <App />
      </InvestmentProvider>
    </BrowserRouter>
  </StrictMode>,
)
