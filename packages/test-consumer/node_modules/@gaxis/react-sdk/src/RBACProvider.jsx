import React, { createContext, useState } from 'react';

export const RBACContext = createContext();

export const RBACProvider = ({ children, initialRoles = [], initialPermissions = [] }) => {
    const [roles, setRoles] = useState(initialRoles);
    const [permissions, setPermissions] = useState(initialPermissions);

    const hasRole = (role) => {
        return roles.includes(role);
    };

    const hasPermission = (permission) => {
        return permissions.includes(permission);
    };

    const can = (permission) => hasPermission(permission);

    return (
        <RBACContext.Provider value={{ roles, permissions, hasRole, hasPermission, can, setRoles, setPermissions }}>
            {children}
        </RBACContext.Provider>
    );
};
