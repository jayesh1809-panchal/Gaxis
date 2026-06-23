import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [currentTenant, setCurrentTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize tenant from user object or stored preference
        if (currentUser) {
            const storedTenantId = localStorage.getItem('gaxis_active_tenant');
            
            // If user has a tenantId, set it as default if none selected
            if (!storedTenantId && currentUser.tenantId) {
                switchTenant(currentUser.tenantId, currentUser.tenantCode);
            } else if (storedTenantId) {
                // Ideally fetch full tenant details here
                setCurrentTenant({
                    _id: storedTenantId,
                    code: localStorage.getItem('gaxis_active_tenant_code'),
                    name: localStorage.getItem('gaxis_active_tenant_name') || 'Current Tenant',
                    logo: localStorage.getItem('gaxis_active_tenant_logo') || null,
                    settings: JSON.parse(localStorage.getItem('gaxis_active_tenant_settings') || '{}')
                });
            }
        }
        setLoading(false);
    }, [currentUser]);

    // Apply Dynamic Branding
    useEffect(() => {
        if (currentTenant?.settings?.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', currentTenant.settings.primaryColor);
        } else {
            document.documentElement.style.removeProperty('--primary-color');
        }
    }, [currentTenant]);

    const switchTenant = (tenantId, tenantCode, tenantName = '', logo = '', settings = {}) => {
        localStorage.setItem('gaxis_active_tenant', tenantId);
        localStorage.setItem('gaxis_active_tenant_code', tenantCode);
        localStorage.setItem('gaxis_active_tenant_name', tenantName);
        if (logo) localStorage.setItem('gaxis_active_tenant_logo', logo);
        localStorage.setItem('gaxis_active_tenant_settings', JSON.stringify(settings));
        
        setCurrentTenant({ _id: tenantId, code: tenantCode, name: tenantName, logo, settings });
        
        // Update API default header
        api.defaults.headers.common['x-tenant-id'] = tenantId;
        
        // Hard refresh to reload all dashboard data
        window.location.reload();
    };

    return (
        <TenantContext.Provider value={{ currentTenant, switchTenant, loading }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
