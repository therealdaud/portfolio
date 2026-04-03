import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// ── Console Easter Egg ──
console.log(
  '%c\n  Hey there, fellow developer! 👋\n',
  'font-size: 16px; color: #00d4ff; font-weight: bold; background: #08080f; padding: 8px 16px; border-radius: 6px;'
);
console.log(
  '%c  Built with React + TypeScript + Vite + Framer Motion\n' +
  '%c  Design & code by Daud Ahmad Nisar\n' +
  '%c  Let\'s connect → daudnisar1@gmail.com\n',
  'color: #7c3aed; font-size: 12px;',
  'color: #06d6a0; font-size: 12px;',
  'color: #00d4ff; font-size: 12px;',
);
console.log(
  '%c  Pro tip: Press Ctrl+K to open the command palette ⌘',
  'color: #7a8499; font-size: 11px; font-style: italic;'
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
