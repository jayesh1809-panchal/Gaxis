import { useState, useEffect } from 'react';
import { FaTh, FaTimes, FaCube, FaUsers, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const ICONS = {
    FaUsers: <FaUsers />,
    FaChartLine: <FaChartLine />,
    FaShieldAlt: <FaShieldAlt />,
    FaCube: <FaCube />
};

const UniversalLauncher = ({ isOpen, onClose }) => {
    const [apps, setApps] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            api.get('/os/workspace').then(res => {
                setApps(res.data.data.availableApps || []);
            }).catch(e => console.error("Failed to load apps", e));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-4xl p-8 shadow-2xl relative animate-fade-in-up">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                >
                    <FaTimes size={24} />
                </button>

                <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
                    <FaTh className="text-indigo-500" /> Universal App Launcher
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {apps.map(app => (
                        <button 
                            key={app._id}
                            onClick={() => {
                                onClose();
                                if (app.launchUrl.startsWith('http')) {
                                    window.open(app.launchUrl, '_blank');
                                } else {
                                    navigate(app.launchUrl);
                                }
                            }}
                            className="flex flex-col items-center p-4 rounded-2xl hover:bg-slate-700 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                {ICONS[app.icon] || <FaCube />}
                            </div>
                            <div className="text-sm font-medium text-white text-center">
                                {app.name}
                            </div>
                            <div className="text-xs text-slate-400 text-center mt-1">
                                {app.type}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UniversalLauncher;
