import React from 'react';
import { useAuth, usePermission } from 'gaxis-react';

function App() {
    const { isAuthenticated, isLoading, user, login, logout, getAccessToken } = useAuth();
    const { can } = usePermission();

    if (isLoading) {
        return <div>Loading HRMS Identity...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h1>HRMS Portal</h1>
                <p>Welcome to the ecosystem HRMS portal. Please log in using G-Axis SSO.</p>
                <button onClick={login} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Login with G-Axis
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>HRMS Portal Dashboard</h1>
            <p>Welcome, {user?.given_name} {user?.family_name} ({user?.email})!</p>
            
            <div style={{ background: '#f5f5f5', padding: '1rem', marginTop: '1rem', borderRadius: '8px' }}>
                <h3>Your Permissions:</h3>
                <ul>
                    {user?.permissions?.map(p => <li key={p}>{p}</li>)}
                </ul>

                {can('users.read') ? (
                    <div style={{ color: 'green', marginTop: '1rem' }}>
                        ✅ You have 'users.read' permission! You can view HRMS employees.
                    </div>
                ) : (
                    <div style={{ color: 'red', marginTop: '1rem' }}>
                        ❌ You lack 'users.read' permission.
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <button onClick={logout} style={{ padding: '10px 20px', cursor: 'pointer', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Logout (Single Logout)
                </button>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h4>Access Token (For API calls)</h4>
                <textarea readOnly value={getAccessToken()} style={{ width: '100%', height: '100px' }} />
            </div>
        </div>
    );
}

export default App;
