import React, { useState, useEffect } from "react";
import { getDeliveries } from "../services/eventBusService";
import { toast } from "react-hot-toast";
import { FaCheckCircle, FaTimesCircle, FaClock, FaSync } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

const EventDeliveryMonitor = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Auto-refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const res = await getDeliveries();
            setDeliveries(res.data.data);
        } catch (error) {
            toast.error("Failed to load deliveries");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 border-b border-slate-200 pb-5 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Delivery Monitor</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Real-time tracking of webhook and internal event deliveries.
                    </p>
                </div>
                <button onClick={loadData} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <FaSync className="mr-1" /> Refresh
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event Code</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subscriber</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Latency</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {deliveries.map((delivery) => (
                                <tr key={delivery._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                        {delivery.eventId.substring(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {delivery.eventCode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {delivery.subscriptionId?.applicationId?.name || 'Internal'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                            delivery.status === 'failed' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {delivery.status === 'delivered' && <FaCheckCircle className="mr-1.5" />}
                                            {delivery.status === 'failed' && <FaTimesCircle className="mr-1.5" />}
                                            {(delivery.status === 'pending' || delivery.status === 'retrying') && <FaClock className="mr-1.5" />}
                                            {delivery.status.toUpperCase()}
                                        </span>
                                        {delivery.status === 'retrying' && (
                                            <span className="ml-2 text-xs text-slate-400">({delivery.attempts}/5)</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {delivery.response?.durationMs ? `${delivery.response.durationMs}ms` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(delivery.createdAt).toLocaleTimeString()}
                                    </td>
                                </tr>
                            ))}
                            {deliveries.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-slate-500">
                                        No recent deliveries.
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

export default EventDeliveryMonitor;
