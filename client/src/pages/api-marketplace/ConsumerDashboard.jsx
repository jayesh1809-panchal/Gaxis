import { useState, useEffect } from 'react';
import { FaFileInvoiceDollar, FaChartBar, FaLink } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const ConsumerDashboard = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api-marketplace/my-subscriptions').then(res => {
            setSubscriptions(res.data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FaChartBar className="text-amber-500" /> Consumer Dashboard
                </h1>
                <p className="text-slate-400 mt-2">Manage your API subscriptions and billing.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaLink className="text-slate-400" /> Active Subscriptions
                    </h2>
                    
                    {subscriptions.length === 0 ? (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
                            <p className="text-slate-400 mb-4">You have not subscribed to any APIs.</p>
                            <a href="/api-marketplace/discover" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium inline-block">
                                Browse Marketplace
                            </a>
                        </div>
                    ) : (
                        subscriptions.map(sub => (
                            <div key={sub._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">{sub.productId?.name || 'Unknown API'}</h3>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-emerald-400">{sub.planId?.name} Plan</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-slate-400">{sub.currentUsage?.requestsThisCycle || 0} reqs this cycle</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded uppercase font-bold mb-2">
                                        {sub.status}
                                    </span>
                                    <div className="text-xs text-slate-500">
                                        Renews: {new Date(sub.billingCycleEnd).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 sticky top-8">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <FaFileInvoiceDollar className="text-amber-500" /> Current Usage
                        </h2>
                        
                        <div className="space-y-4">
                            {subscriptions.map(sub => (
                                <div key={sub._id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                                    <span className="text-slate-400">{sub.productId?.name}</span>
                                    <span className="font-mono text-emerald-400">
                                        ${sub.planId?.price === 0 ? '0.00' : sub.planId?.price}
                                    </span>
                                </div>
                            ))}
                            
                            <div className="pt-4 flex justify-between items-center">
                                <span className="text-white font-medium">Estimated Total</span>
                                <span className="text-xl font-bold text-white">
                                    ${subscriptions.reduce((acc, sub) => acc + (sub.planId?.price || 0), 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsumerDashboard;
