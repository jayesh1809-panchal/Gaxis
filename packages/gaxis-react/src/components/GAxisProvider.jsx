import React, { useState, useEffect, createContext } from 'react';
import { GAxisClient } from 'gaxis-client-js';

export const GAxisContext = createContext(null);

export const GAxisProvider = ({ config, children }) => {
    const [client] = useState(() => new GAxisClient(config));
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        permissions: [],
        roles: [],
        tenant: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const result = await client.initialize();
                if (isMounted) {
                    if (result.isAuthenticated) {
                        const user = client.getUser();
                        setAuthState({
                            isAuthenticated: true,
                            user: user,
                            permissions: client.getPermissions(),
                            roles: client.getRoles(),
                            tenant: user?.tenantId || null,
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        setAuthState(prev => ({ ...prev, isLoading: false }));
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setAuthState({
                        isAuthenticated: false,
                        user: null,
                        permissions: [],
                        roles: [],
                        tenant: null,
                        isLoading: false,
                        error: error.message,
                    });
                }
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [client]);

    const login = () => client.login();
    const logout = () => client.logout();
    const logoutAll = () => client.logoutAll();

    const refreshSession = async () => {
        try {
            await client.refreshSession();
            const user = client.getUser();
            setAuthState({
                isAuthenticated: true,
                user: user,
                permissions: client.getPermissions(),
                roles: client.getRoles(),
                tenant: user?.tenantId || null,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            setAuthState(prev => ({ ...prev, isAuthenticated: false, error: error.message }));
        }
    };

    const value = {
        ...authState,
        login,
        logout,
        logoutAll,
        refreshSession,
        client
    };

    return (
        <GAxisContext.Provider value={value}>
            {children}
        </GAxisContext.Provider>
    );
};
