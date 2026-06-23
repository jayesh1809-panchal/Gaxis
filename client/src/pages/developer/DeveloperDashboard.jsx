import { useState, useEffect } from 'react';
import { FaCode, FaKey, FaChartArea, FaRocket } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const DeveloperDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/developer/profile').then(res => {
            setProfile(res.data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FaCode className="text-indigo-500" /> Developer Portal
                    </h1>
                    <p className="text-slate-400 mt-2">Build, manage, and scale your integrations.</p>
                </div>
                <div className="flex gap-3">
                    <span className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg font-medium border border-indigo-500/30">
                        Tier: {profile?.tier?.toUpperCase() || 'FREE'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                            <FaRocket className="text-xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Applications</h3>
                    </div>
                    <p className="text-slate-400 mb-4">Manage your registered OAuth and API applications.</p>
                    <a href="/developer/apps" className="text-blue-400 hover:text-blue-300 font-medium">View Applications &rarr;</a>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                            <FaKey className="text-xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">API Keys</h3>
                    </div>
                    <p className="text-slate-400 mb-4">Generate and rotate keys for accessing the G-Axis API.</p>
                    <a href="/developer/apps" className="text-green-400 hover:text-green-300 font-medium">Manage Keys &rarr;</a>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                            <FaChartArea className="text-xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">API Explorer</h3>
                    </div>
                    <p className="text-slate-400 mb-4">Test requests and explore the interactive Swagger documentation.</p>
                    <a href="/developer/explorer" className="text-purple-400 hover:text-purple-300 font-medium">Open Explorer &rarr;</a>
                </div>
            </div>
        </div>
    );
};

export default DeveloperDashboard;
