import React, { createContext } from 'react';
import { AuthProvider } from './AuthProvider';
import { SessionProvider } from './SessionProvider';
import { RBACProvider } from './RBACProvider';

export const GAxisContext = createContext();

/**
 * The master context provider for G-Axis.
 * @param {Object} config - { baseUrl, loginUrl, onLogout }
 * @param {Object} initialState - { user, sessionId, roles, permissions, expiresInSeconds }
 */
export const GAxisProvider = ({ children, config, initialState = {} }) => {
    if (!config || !config.baseUrl) {
        console.error('GAxisProvider requires a config.baseUrl');
    }

    return (
        <GAxisContext.Provider value={{ config }}>
            <AuthProvider config={config} initialUser={initialState.user} initialSessionId={initialState.sessionId}>
                <SessionProvider config={config} initialExpiresInSeconds={initialState.expiresInSeconds}>
                    <RBACProvider initialRoles={initialState.roles} initialPermissions={initialState.permissions}>
                        {children}
                    </RBACProvider>
                </SessionProvider>
            </AuthProvider>
        </GAxisContext.Provider>
    );
};
