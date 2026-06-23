import React, { createContext, useState, useEffect } from 'react';
import { authService } from './services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children, config, initialUser, initialSessionId }) => {
    const [user, setUser] = useState(initialUser || null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!initialUser);
    const [sessionId, setSessionId] = useState(initialSessionId || null);

    const login = () => {
        authService.login(config.baseUrl, config.loginUrl);
    };

    const logout = async () => {
        if (sessionId) {
            await authService.logout(config.baseUrl, sessionId);
        }
        setUser(null);
        setIsAuthenticated(false);
        setSessionId(null);
        if (config.onLogout) {
            config.onLogout();
        }
    };

    const forceLogout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setSessionId(null);
        if (config.onLogout) {
            config.onLogout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, sessionId, login, logout, forceLogout, setUser, setIsAuthenticated, setSessionId }}>
            {children}
        </AuthContext.Provider>
    );
};
