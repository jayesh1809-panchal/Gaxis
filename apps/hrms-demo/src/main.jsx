import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GAxisProvider } from 'gaxis-react';

const gaxisConfig = {
    clientId: 'HRMS_DEMO_CLIENT_ID', // Replace with an actual client ID from G-Axis DB
    authority: 'http://localhost:5000',
    redirectUri: 'http://localhost:5174', // Vite default port might be 5173 or 5174
    scopes: 'openid profile email users.read'
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <GAxisProvider config={gaxisConfig}>
        <App />
    </GAxisProvider>
);
