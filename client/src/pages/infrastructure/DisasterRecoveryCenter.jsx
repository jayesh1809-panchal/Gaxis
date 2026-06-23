import { useState, useEffect } from 'react';
import { FaShieldAlt, FaHistory, FaPlayCircle } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const DisasterRecoveryCenter = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            const res = await api.get('/infrastructure/backups');
            setBackups(res.data.data);
        } catch (error) {
            console.error('Error fetching backups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        // In reality, user would select a region
        try {
            setGenerating(true);
            await api.post('/infrastructure/backups', { type: 'full', regionId: 'temp_id_will_fail' }).catch(e => {
                // Just a mock UI action for now, ignoring 400s if regions are empty
                console.log(e);
            });
            setTimeout(() => fetchBackups(), 1000);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Disaster Recovery</h1>
                    <p className="text-gray-500">Manage backups, snapshots, and recovery drills</p>
                </div>
                <button 
                    onClick={handleCreateBackup}
                    disabled={generating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                    <FaShieldAlt />
                    <span>{generating ? 'Creating...' : 'Trigger Backup'}</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaHistory className="text-gray-400" /> Recent Snapshots
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Region</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {backups.map(b => (
                                <tr key={b._id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm">{new Date(b.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium">{b.regionId?.code || 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{b.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            b.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                                            <FaPlayCircle /> Restore
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {backups.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No backups available
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

export default DisasterRecoveryCenter;
