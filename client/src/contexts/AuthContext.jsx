import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadUserFromToken = useCallback(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // In a real app, you might fetch full user details if not stored in token
                // Here, we'll store basic info. We might need to store user details in localStorage during login
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setCurrentUser(JSON.parse(storedUser));
                } else {
                    setCurrentUser({ id: decoded.id });
                }
                setPermissions(decoded.permissions || []);
                setRoles(decoded.roles || []);
            } catch (err) {
                console.error("Invalid token", err);
                logout();
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadUserFromToken();

        // Listen for unauthorized events from axios interceptor
        const handleUnauthorized = () => logout();
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [loadUserFromToken]);

    const login = async (email, password) => {
        const { data } = await apiLogin(email, password);
        
        if (data.mfaRequired) {
            return data; // Return mfaRequired and preAuthToken to the caller
        }

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        loadUserFromToken();
        return data;
    };

    const processMfaLogin = (data) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        loadUserFromToken();
    };

    const logout = async () => {
        try {
            await apiLogout();
        } catch (err) {
            console.error("Logout API failed, continuing local clear", err);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setCurrentUser(null);
            setPermissions([]);
        }
    };

    const hasPermission = (permissionCode) => {
        return permissions.includes(permissionCode);
    };

    const hasRole = (roleCode) => {
        return roles.includes(roleCode);
    };

    const value = {
        currentUser,
        permissions,
        roles,
        loading,
        login,
        logout,
        hasPermission,
        hasRole,
        processMfaLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
