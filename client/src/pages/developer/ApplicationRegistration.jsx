import { useState, useEffect } from 'react';
import { FaLaptopCode, FaPlus, FaKey } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const ApplicationRegistration = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', environment: 'sandbox' });

    useEffect(() => {
        api.get('/developer/applications').then(res => {
            setApps(res.data.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/developer/applications', formData);
            setApps([...apps, res.data.data]);
            setShowForm(false);
            setFormData({ name: '', description: '', environment: 'sandbox' });
        } catch (error) {
            console.error("App creation failed", error);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FaLaptopCode className="text-amber-500" /> Registered Applications
                    </h1>
                    <p className="text-slate-400 mt-2">Manage OAuth clients and API applications.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <FaPlus /> Create App
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">New Application</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Application Name</label>
                            <input 
                                type="text" required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea 
                                rows="2"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Environment</label>
                            <select 
                                value={formData.environment}
                                onChange={e => setFormData({...formData, environment: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="sandbox">Sandbox</option>
                                <option value="production">Production</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white">
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg">
                                Create Application
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apps.length === 0 && !showForm && (
                    <div className="col-span-full p-8 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700">
                        No applications found. Create one to get started.
                    </div>
                )}
                {apps.map(app => (
                    <div key={app._id} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-white">{app.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-md font-medium ${app.environment === 'production' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {app.environment.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">{app.description || "No description provided."}</p>
                        
                        <div className="flex gap-3">
                            <button className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                                <FaKey /> Generate API Key
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApplicationRegistration;
