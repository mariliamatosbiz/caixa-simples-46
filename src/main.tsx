import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ADICIONE ESTA LINHA AQUI:
console.log('MINHA CHAVE:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)