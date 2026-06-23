import { useState, useEffect } from 'react';
import { FaDownload, FaBook, FaBoxOpen } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const SDKCatalog = () => {
    const [sdks, setSdks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/developer/sdks').then(res => {
            setSdks(res.data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FaBoxOpen className="text-rose-500" /> SDK Registry
                </h1>
                <p className="text-slate-400 mt-2">Official client libraries for integrating with G-Axis in your preferred language.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sdks.map(sdk => (
                    <div key={sdk.id} className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{sdk.name}</h3>
                                <span className="text-sm text-slate-400">Language: {sdk.language}</span>
                            </div>
                            <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full font-mono">
                                v{sdk.version}
                            </span>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-3 mb-6 font-mono text-sm text-rose-300 border border-slate-700 overflow-x-auto">
                            {sdk.installCommand}
                        </div>

                        <div className="mt-auto flex gap-3">
                            <a href={sdk.repoUrl} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                <FaDownload className="text-xs" /> Source
                            </a>
                            <button className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                <FaBook className="text-xs" /> Docs
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SDKCatalog;
