import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const LogoutButton = ({ className, children }) => {
    const { logout } = useAuth();

    return (
        <button className={className} onClick={logout}>
            {children || 'Logout'}
        </button>
    );
};
