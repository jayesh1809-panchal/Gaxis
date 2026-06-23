import React, { useEffect } from 'react';
import { useGAxis } from '../hooks/useGAxis';

export const GAxisProtectedRoute = ({ 
    children, 
    fallback = <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading authentication...</div>
}) => {
    const { isAuthenticated, isLoading, login } = useGAxis();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            login();
        }
    }, [isLoading, isAuthenticated, login]);

    if (isLoading || !isAuthenticated) {
        return fallback;
    }

    return <>{children}</>;
};
