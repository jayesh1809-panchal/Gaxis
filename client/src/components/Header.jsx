import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';
import TenantSwitcher from './layout/TenantSwitcher';

const Header = () => {
    const { logout } = useAuth();
    const { currentTenant } = useTenant();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="h-16 bg-[var(--primary-color,#ffffff)] shadow flex items-center justify-between px-6 transition-colors duration-300">

            <div className="flex items-center gap-4">
                {currentTenant?.logo && (
                    <img src={currentTenant.logo} alt="Tenant Logo" className="h-8 w-auto" />
                )}
                <h1 className="text-xl font-semibold text-slate-800">
                    {currentTenant?.name || 'Dashboard'} 
                    {currentTenant?.code && <span className="ml-2 text-sm text-slate-500 font-normal border px-2 py-0.5 rounded">{currentTenant.code}</span>}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <TenantSwitcher />
                <div className="font-medium text-slate-700">
                    Admin
                </div>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                >
                    Log Out
                </button>
            </div>

        </div>
    );
};

export default Header;