import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../api/axios';

const TenantSwitcher = () => {
    const { hasPermission } = useAuth();
    const { currentTenant, switchTenant } = useTenant();
    const [tenants, setTenants] = useState([]);

    // Only SUPER_ADMIN can see the tenant switcher. Here we can check for a specific permission or just allow access if they have 'tenants.manage'
    if (!hasPermission('tenants.manage')) {
        return null;
    }

    useEffect(() => {
        // Fetch all tenants for super admin
        const fetchTenants = async () => {
            try {
                // Mock or real API call to get all tenants
                const response = await api.get('/api/tenants').catch(() => ({ data: { data: [] }}));
                // If endpoint doesn't exist yet, we can fallback to default
                if (response.data.data && response.data.data.length > 0) {
                    setTenants(response.data.data);
                } else {
                    setTenants([{ _id: currentTenant?._id || 'default', name: 'Default Organization', code: 'DEFAULT' }]);
                }
            } catch (err) {
                console.error("Failed to load tenants", err);
            }
        };
        fetchTenants();
    }, [currentTenant]);

    const handleChange = (e) => {
        const selectedId = e.target.value;
        const tenant = tenants.find(t => t._id === selectedId);
        if (tenant) {
            switchTenant(tenant._id, tenant.code, tenant.name, tenant.logo, tenant.settings);
        }
    };

    return (
        <div className="flex items-center gap-2 mr-4">
            <label className="text-sm text-slate-500 font-medium">Tenant:</label>
            <select
                value={currentTenant?._id || ''}
                onChange={handleChange}
                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer shadow-sm"
            >
                {tenants.map(t => (
                    <option key={t._id} value={t._id}>
                        {t.name} ({t.code})
                    </option>
                ))}
            </select>
        </div>
    );
};

export default TenantSwitcher;
