import { useContext } from 'react';
import { SessionContext } from '../SessionProvider';

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }

    return {
        session: context.sessionId,
        expiresAt: context.expiresAt,
        trackActivity: context.trackActivity
    };
};
