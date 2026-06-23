import { useAuth } from '../contexts/AuthContext';

export const usePermission = () => {
    const { hasPermission } = useAuth();
    
    const can = (permissionCode) => {
        return hasPermission(permissionCode);
    };

    return { can };
};
