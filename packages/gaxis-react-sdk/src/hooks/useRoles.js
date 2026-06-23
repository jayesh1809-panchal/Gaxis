import { useContext } from 'react';
import { RBACContext } from '../RBACProvider';

export const useRoles = () => {
    const context = useContext(RBACContext);
    if (!context) {
        throw new Error('useRoles must be used within a RBACProvider');
    }

    return {
        roles: context.roles,
        hasRole: context.hasRole
    };
};
