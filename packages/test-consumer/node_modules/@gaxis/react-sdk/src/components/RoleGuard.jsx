import React from 'react';
import { useRoles } from '../hooks/useRoles';

export const RoleGuard = ({ roles = [], children, fallback = null }) => {
    const { hasRole } = useRoles();

    const isAuthorized = roles.some(role => hasRole(role));

    if (!isAuthorized) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
