import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from './constants';

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
    const { currentUser, loading, hasPermission, hasRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">403 Forbidden</h1>
                <p className="text-gray-600 mb-8">You do not have permission to access this resource.</p>
                <Navigate to={ROUTES.DASHBOARD} replace />
            </div>
        );
    }

    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">403 Forbidden</h1>
                <p className="text-gray-600 mb-8">You do not have the required role ({requiredRole}) to access this resource.</p>
                <Navigate to={ROUTES.DASHBOARD} replace />
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
