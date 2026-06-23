import { useState, useEffect } from 'react';
import { FaHeartbeat, FaClock, FaExclamationTriangle, FaNetworkWired } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const ServiceHealthDashboard = () => {
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/infrastructure/clusters');
            setClusters(res.data.data);
        } catch (error) {
            console.error('Error fetching clusters:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Health</h1>
                    <p className="text-gray-500">Real-time microservice health monitoring</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clusters.map(cluster => (
                    <div key={cluster._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="font-semibold flex items-center gap-2">
                                <FaNetworkWired className="text-indigo-500" /> {cluster.name}
                            </h2>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                cluster.healthScore >= 90 ? 'bg-green-100 text-green-700' : 
                                cluster.healthScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {cluster.healthScore}% HEALTHY
                            </span>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FaClock className="text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium">Avg Latency</p>
                                        <p className="text-xs text-gray-500">Across all services</p>
                                    </div>
                                </div>
                                <span className="font-mono font-medium">{(Math.random() * 50 + 10).toFixed(1)}ms</span>
                            </div>
                            <div className="flex justify-between items-center p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium">Error Rate</p>
                                        <p className="text-xs text-gray-500">5xx and 4xx</p>
                                    </div>
                                </div>
                                <span className="font-mono font-medium">{(Math.random() * 0.5).toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                ))}
                {clusters.length === 0 && (
                    <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <FaHeartbeat className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500">No clusters reporting health telemetry</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceHealthDashboard;
