import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth, LoginButton, ProtectedRoute } from 'gaxis-react';

const Home = () => {
    const { isAuthenticated, user } = useAuth();
    
    return (
        <div style={{ padding: '2rem' }}>
            <h1>HRMS Integration Example</h1>
            {isAuthenticated ? (
                <div>
                    <p>Welcome back, {user?.firstName} {user?.lastName}!</p>
                    <Link to="/dashboard">Go to Dashboard</Link>
                </div>
            ) : (
                <div>
                    <p>You are not logged in.</p>
                    <LoginButton style={{ padding: '10px', fontSize: '16px' }} />
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { user, logout, logoutAll, permissions } = useAuth();
    
    return (
        <div style={{ padding: '2rem' }}>
            <h1>HRMS Dashboard</h1>
            <p>Protected Route - Only visible to authenticated users.</p>
            
            <div style={{ background: '#f5f5f5', padding: '1rem', margin: '1rem 0' }}>
                <h3>User Profile</h3>
                <pre>{JSON.stringify(user, null, 2)}</pre>
                
                <h3>Permissions</h3>
                <ul>
                    {permissions.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
            </div>
            
            <button onClick={logout} style={{ marginRight: '1rem' }}>Logout</button>
            <button onClick={logoutAll}>Logout from all devices</button>
        </div>
    );
};

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />
        </Routes>
    );
};

export default App;
