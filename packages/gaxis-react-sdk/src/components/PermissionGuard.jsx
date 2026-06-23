import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

export const PermissionGuard = ({ permission, permissions = [], children, fallback = null }) => {
    const { hasPermission } = usePermissions();

    const permsToCheck = permission ? [permission] : permissions;
    const isAuthorized = permsToCheck.some(p => hasPermission(p));

    if (!isAuthorized) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
