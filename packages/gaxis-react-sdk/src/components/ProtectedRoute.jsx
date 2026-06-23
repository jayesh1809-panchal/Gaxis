import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, login } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            login(); // Automatically trigger login flow if not authenticated
        }
    }, [isAuthenticated, login]);

    if (!isAuthenticated) {
        // Optionally return a loading spinner or null while redirecting
        return null;
    }

    return <>{children}</>;
};
