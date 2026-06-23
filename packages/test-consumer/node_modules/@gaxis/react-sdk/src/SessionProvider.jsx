import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from './AuthProvider';
import { sessionService } from './services/sessionService';
import { tokenService } from './services/tokenService';

export const SessionContext = createContext();

export const SessionProvider = ({ children, config, initialExpiresInSeconds }) => {
    const { sessionId, forceLogout } = useContext(AuthContext);
    const [expiresAt, setExpiresAt] = useState(null);
    const refreshTimerRef = useRef(null);

    useEffect(() => {
        if (sessionId && initialExpiresInSeconds) {
            scheduleRefresh(initialExpiresInSeconds);
            setExpiresAt(new Date(Date.now() + initialExpiresInSeconds * 1000));
        }
        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        }
    }, [sessionId]);

    const scheduleRefresh = (expiresInSeconds) => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        
        refreshTimerRef.current = tokenService.startSilentRefresh(
            config.baseUrl,
            sessionId,
            expiresInSeconds,
            (data) => {
                // On Success
                scheduleRefresh(data.expiresInSeconds || 300);
                setExpiresAt(new Date(Date.now() + (data.expiresInSeconds || 300) * 1000));
            },
            (err) => {
                // On Failure (Session expired or revoked)
                forceLogout();
            }
        );
    };

    const trackActivity = () => {
        if (sessionId) {
            sessionService.trackActivity(config.baseUrl, sessionId);
        }
    };

    return (
        <SessionContext.Provider value={{ sessionId, expiresAt, trackActivity }}>
            {children}
        </SessionContext.Provider>
    );
};
