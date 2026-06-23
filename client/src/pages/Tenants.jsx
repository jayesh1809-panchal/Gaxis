import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const TenantStatusBadge = ({ status }) => {
    let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
    if (status === 'active') colorClass = 'bg-green-100 text-green-800 border-green-200';
    if (status === 'suspended') colorClass = 'bg-red-100 text-red-800 border-red-200';
    if (status === 'trial') colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status === 'expired') colorClass = 'bg-red-100 text-red-800 border-red-200';

    return <span className={`px-2 py-1 text-xs font-medium border rounded-full uppercase ${colorClass}`}>{status}</span>;
};

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadTenants = async () => {
        try {
            const res = await api.get('/api/tenants').catch(() => ({ data: { data: [] } }));
            if (res.data.data && res.data.data.length > 0) {
                setTenants(res.data.data);
            } else {
                // Dummy fallback if backend doesn't have /api/tenants yet
                setTenants([{ _id: 'default', name: 'Default Organization', code: 'DEFAULT', domain: 'default.g-axis.com', plan: 'enterprise', status: 'active' }]);
            }
        } catch (error) {
            console.error("Failed to load tenants", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">
                    Tenant Management
                </h1>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow transition-colors">
                    Create Tenant
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                                <th className="p-4 font-semibold">Tenant Name</th>
                                <th className="p-4 font-semibold">Code</th>
                                <th className="p-4 font-semibold">Domain</th>
                                <th className="p-4 font-semibold">Plan</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {tenants.map((tenant) => (
                                <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-800 font-medium">{tenant.name}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded text-xs font-mono">
                                            {tenant.code}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{tenant.domain || 'N/A'}</td>
                                    <td className="p-4 text-slate-600 capitalize">{tenant.plan || 'enterprise'}</td>
                                    <td className="p-4">
                                        <TenantStatusBadge status={tenant.status} />
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {tenants.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No tenants found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Tenants;
