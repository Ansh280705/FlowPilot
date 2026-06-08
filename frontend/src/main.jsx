import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

if (import.meta.env.VITE_BACKEND_API_URL) {
  // Strip trailing /api so that calls to /api/auth/... resolve correctly
  axios.defaults.baseURL = import.meta.env.VITE_BACKEND_API_URL.replace(/\/api\/?$/, '');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

