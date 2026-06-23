import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GAxisProvider } from 'gaxis-react'
import App from './App.jsx'

const gaxisConfig = {
    baseUrl: import.meta.env.VITE_GAXIS_URL,
    clientId: import.meta.env.VITE_GAXIS_CLIENT_ID,
    redirectUri: import.meta.env.VITE_GAXIS_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email', 'hrms.*']
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GAxisProvider config={gaxisConfig}>
        <App />
      </GAxisProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
