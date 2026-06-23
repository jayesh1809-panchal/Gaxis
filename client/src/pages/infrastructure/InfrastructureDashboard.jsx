import { useState, useEffect } from 'react';
import { FaServer, FaGlobe, FaNetworkWired, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const InfrastructureDashboard = () => {
    const [regions, setRegions] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [regionsRes, clustersRes] = await Promise.all([
                api.get('/infrastructure/regions'),
                api.get('/infrastructure/clusters')
            ]);
            setRegions(regionsRes.data.data);
            setClusters(clustersRes.data.data);
        } catch (error) {
            console.error('Error fetching infrastructure:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Infrastructure</h1>
                    <p className="text-gray-500">Global regions and deployment clusters</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <FaGlobe className="text-xl" />
                        </div>
                        <h2 className="text-xl font-semibold">Regions</h2>
                    </div>
                    <div className="space-y-4">
                        {regions.map(r => (
                            <div key={r._id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{r.name} ({r.code})</h3>
                                    <span className="text-sm text-gray-500">{r.provider} - {r.isPrimary ? 'Primary' : 'Secondary'}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {r.status}
                                </span>
                            </div>
                        ))}
                        {regions.length === 0 && <p className="text-gray-500 text-sm">No regions configured.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FaServer className="text-xl" />
                        </div>
                        <h2 className="text-xl font-semibold">Clusters</h2>
                    </div>
                    <div className="space-y-4">
                        {clusters.map(c => (
                            <div key={c._id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{c.name}</h3>
                                    <span className="text-sm text-gray-500">{c.regionId?.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {c.healthScore >= 90 ? <FaCheckCircle className="text-green-500" /> : <FaExclamationTriangle className="text-amber-500" />}
                                    <span className="font-medium">{c.healthScore}/100</span>
                                </div>
                            </div>
                        ))}
                        {clusters.length === 0 && <p className="text-gray-500 text-sm">No clusters configured.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfrastructureDashboard;
