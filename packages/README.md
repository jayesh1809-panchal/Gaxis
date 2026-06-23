# G-Axis Application Connector SDK

This SDK allows ecosystem applications (HRMS, CRM, etc.) to seamlessly connect to the G-Axis Identity Provider for Single Sign-On (SSO).

## Installation

Add the local packages to your `package.json`:
```json
"dependencies": {
  "gaxis-client-js": "file:../../packages/gaxis-client-js",
  "gaxis-react": "file:../../packages/gaxis-react"
}
```

## React Integration

### 1. Wrap your application with `GAxisProvider`

```jsx
import { GAxisProvider } from 'gaxis-react';

const config = {
    clientId: 'YOUR_CLIENT_ID', // Register your app in G-Axis Admin
    authority: 'http://localhost:5000',
    redirectUri: 'http://localhost:5174', // Your app URL
    scopes: 'openid profile email users.read'
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <GAxisProvider config={config}>
        <App />
    </GAxisProvider>
);
```

### 2. Use Hooks for Authentication and Permissions

```jsx
import { useAuth, usePermission } from 'gaxis-react';

function App() {
    const { isAuthenticated, user, login, logout, getAccessToken } = useAuth();
    const { can, hasRole } = usePermission();

    if (!isAuthenticated) {
        return <button onClick={login}>Login with G-Axis</button>;
    }

    return (
        <div>
            <h1>Welcome {user.given_name}</h1>
            
            {can('users.read') && <p>You have permission to read users.</p>}

            <button onClick={logout}>Logout</button>
        </div>
    );
}
```

## Security
This SDK implements the **OAuth2 Authorization Code Flow with PKCE**, which is the industry standard for Public Clients (like SPAs). No client secret is required or exposed in the browser. Tokens are stored securely and PKCE challenges are generated dynamically per login attempt.
