import { useContext } from 'react';
import { GAxisContext } from '../components/GAxisProvider.jsx';

export const useGAxis = () => {
    const context = useContext(GAxisContext);
    if (context === undefined || context === null) {
        throw new Error('useGAxis must be used within a GAxisProvider');
    }
    
    // Add convenience methods for permissions
    const hasPermission = (permissionCode) => {
        return context.permissions.includes(permissionCode);
    };

    const hasRole = (roleCode) => {
        return context.roles.includes(roleCode);
    };

    return {
        ...context,
        hasPermission,
        hasRole
    };
};
