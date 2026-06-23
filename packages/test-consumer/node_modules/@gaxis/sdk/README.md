# @gaxis/sdk

The OFFICIAL G-Axis SDK package that allows any application (Node.js, Express, React.js) to connect to the G-Axis Ecosystem Operating System with a plug-in/plug-out architecture.

## Features

- **Authentication**: Seamless login, OAuth2 Authorization Code Flow, PKCE.
- **User Provisioning**: Automatic profile syncing between G-Axis and local DB.
- **Role & Permission Synchronization**: Sync G-Axis roles to your local application.
- **Session Management**: Session heartbeat tracking and Single Logout (SLO).

## Installation

```bash
npm install @gaxis/sdk
```

## Express.js Integration (Backend)

```javascript
const express = require('express');
const { GAxisSDK } = require('@gaxis/sdk');

const app = express();

// 1. Initialize SDK
const gaxis = new GAxisSDK({
    baseUrl: process.env.GAXIS_URL, // e.g., 'http://localhost:5000'
    clientId: process.env.GAXIS_CLIENT_ID,
    clientSecret: process.env.GAXIS_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/api/auth/callback',
    successRedirect: 'http://localhost:3000/dashboard',
    
    // Optional hooks to save user/roles to your local DB
    onUserProvision: async (gaxisUser) => {
        // Example: const user = await User.findOneAndUpdate({ gaxisId: gaxisUser.id }, { ...gaxisUser }, { upsert: true });
        // return user;
        return gaxisUser;
    },
    onSingleLogout: async ({ userId, sessionId }) => {
        // Example: await redis.del(`session:${sessionId}`);
    }
});

// 2. Mount Authentication Router (/login, /callback, /logout)
app.use('/api/auth', gaxis.middleware());

// 3. Protect Routes
const { requireAuth } = require('@gaxis/sdk/src/middleware/auth');
const { requirePermission } = require('@gaxis/sdk/src/middleware/permissions');

app.get('/api/protected', requireAuth(gaxis), requirePermission('dashboard.view'), (req, res) => {
    res.json({ message: "You are authenticated and have permission!" });
});
```

## React.js Integration (Frontend)

```jsx
import React from 'react';
import { GAxisProvider, ProtectedRoute, useGAxis, useRoles } from '@gaxis/sdk/src/providers/reactProvider';

const gaxisConfig = {
    loginUrl: 'http://localhost:3000/api/auth/login',
    logoutUrl: 'http://localhost:3000/api/auth/logout'
};

function App() {
    return (
        <GAxisProvider config={gaxisConfig}>
            <ProtectedRoute fallback={<LoginScreen />}>
                <Dashboard />
            </ProtectedRoute>
        </GAxisProvider>
    );
}

function Dashboard() {
    const { user, logout } = useGAxis();
    const { hasRole } = useRoles();

    return (
        <div>
            <h1>Welcome, {user.name}</h1>
            {hasRole('ADMIN') && <button>Admin Panel</button>}
            <button onClick={logout}>Logout</button>
        </div>
    );
}
```

## Testing Guide

1. Use mocked tokens to unit-test your protected endpoints.
2. Do not hit the real G-Axis server during CI/CD. Mock the `@gaxis/sdk` methods.
3. Verify `onUserProvision` hooks properly sync metadata.

## Migration Guide

If you are migrating an existing application to `@gaxis/sdk`:
1. Remove local Passport.js or custom JWT strategies.
2. Remove local registration forms. All users MUST register through G-Axis.
3. Add a `gaxisUserId` column/field to your User model to map local users to their global G-Axis identity.
