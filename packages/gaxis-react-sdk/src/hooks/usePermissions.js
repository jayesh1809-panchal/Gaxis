import { useContext } from 'react';
import { RBACContext } from '../RBACProvider';

export const usePermissions = () => {
    const context = useContext(RBACContext);
    if (!context) {
        throw new Error('usePermissions must be used within a RBACProvider');
    }

    return {
        permissions: context.permissions,
        hasPermission: context.hasPermission,
        can: context.can
    };
};
