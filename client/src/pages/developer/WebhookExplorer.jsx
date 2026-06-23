import { useState } from 'react';
import { FaSatelliteDish, FaPlus, FaCheckCircle } from 'react-icons/fa';
import api from '../../api/axios';

const WebhookExplorer = () => {
    const [webhooks, setWebhooks] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ url: '', events: '', secret: '' });

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/developer/webhooks', {
                applicationId: '60d21b4667d0d8992e610c85', // Mock ID for UI
                url: formData.url,
                events: formData.events.split(',').map(e => e.trim()),
                secret: formData.secret
            });
            setWebhooks([...webhooks, res.data.data]);
            setShowForm(false);
            setFormData({ url: '', events: '', secret: '' });
        } catch (error) {
            console.error("Registration failed", error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FaSatelliteDish className="text-cyan-500" /> Webhook Explorer
                    </h1>
                    <p className="text-slate-400 mt-2">Register webhooks to receive real-time event notifications.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <FaPlus /> Register Webhook
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">New Webhook Endpoint</h2>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Payload URL</label>
                            <input 
                                type="url" required
                                value={formData.url}
                                onChange={e => setFormData({...formData, url: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                placeholder="https://your-server.com/webhook"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Events (comma separated)</label>
                            <input 
                                type="text" required
                                value={formData.events}
                                onChange={e => setFormData({...formData, events: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                placeholder="user.created, subscription.updated"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Secret Key</label>
                            <input 
                                type="text" required
                                value={formData.secret}
                                onChange={e => setFormData({...formData, secret: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                placeholder="Cryptographic secret for HMAC signing"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white">
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
                                Save Endpoint
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-300 text-sm">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold">URL</th>
                            <th className="px-6 py-3 font-semibold">Events</th>
                            <th className="px-6 py-3 font-semibold">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {webhooks.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                    No webhooks registered. Click 'Register Webhook' to add one.
                                </td>
                            </tr>
                        ) : (
                            webhooks.map((hook, i) => (
                                <tr key={i} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <FaCheckCircle /> Active
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">{hook.url}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {hook.events.map(ev => (
                                                <span key={ev} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                                                    {ev}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">Just now</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WebhookExplorer;
