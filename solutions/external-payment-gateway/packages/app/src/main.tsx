import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CheckoutPage } from './pages/CheckoutPage'
import { ReturnPage } from './pages/ReturnPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CheckoutPage />} />
        <Route path="/return" element={<ReturnPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
