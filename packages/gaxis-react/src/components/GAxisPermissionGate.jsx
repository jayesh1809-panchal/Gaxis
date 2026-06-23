import React from 'react';
import { useGAxis } from '../hooks/useGAxis';

export const GAxisPermissionGate = ({ 
    permission, 
    role, 
    children, 
    fallback = null 
}) => {
    const { hasPermission, hasRole, isLoading } = useGAxis();

    if (isLoading) {
        return null;
    }

    let isAuthorized = false;

    if (permission && hasPermission(permission)) {
        isAuthorized = true;
    }

    if (role && hasRole(role)) {
        isAuthorized = true;
    }

    // If neither was provided but the component is used, we default to rendering children 
    // unless strictly unauthorized based on the provided props
    if (!permission && !role) {
        isAuthorized = true;
    }

    if (!isAuthorized) {
        return fallback;
    }

    return <>{children}</>;
};
