import { useState } from 'react';
import { FaUser, FaShieldAlt, FaCreditCard, FaBell, FaPalette } from 'react-icons/fa';

const UnifiedSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <FaUser /> },
        { id: 'security', label: 'Security & MFA', icon: <FaShieldAlt /> },
        { id: 'billing', label: 'Billing & Plans', icon: <FaCreditCard /> },
        { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
        { id: 'appearance', label: 'Appearance', icon: <FaPalette /> }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Unified Settings</h1>
                <p className="text-slate-400 mt-2">Manage your ecosystem preferences across all applications.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-64 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-3xl p-8 min-h-[500px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white">Profile Details</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" defaultValue="John" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" defaultValue="Doe" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                                <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" defaultValue="john@example.com" disabled />
                            </div>
                        </div>
                    )}
                    {activeTab !== 'profile' && (
                        <div className="text-slate-400 text-center py-20">
                            Settings panel for {activeTab} is under construction.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedSettings;
