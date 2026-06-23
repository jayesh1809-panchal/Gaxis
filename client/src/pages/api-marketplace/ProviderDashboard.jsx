import { useState, useEffect } from 'react';
import { FaChartLine, FaBoxOpen, FaDollarSign, FaUsers } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProviderDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [orgName, setOrgName] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = () => {
        api.get('/api-provider/dashboard').then(res => {
            setData(res.data.data);
            setLoading(false);
        }).catch((e) => {
            if (e.response && e.response.status === 404) {
                // Not a provider yet
                setData({ notRegistered: true });
            }
            setLoading(false);
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegistering(true);
        try {
            await api.post('/api-provider/register', { organizationName: orgName, providerType: 'external' });
            fetchDashboard();
        } catch (e) {
            alert("Registration failed");
            setRegistering(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (data?.notRegistered) {
        return (
            <div className="p-8 max-w-2xl mx-auto mt-12 bg-slate-800 rounded-2xl border border-slate-700 text-center">
                <FaBoxOpen className="text-6xl text-emerald-500 mx-auto mb-6 opacity-80" />
                <h1 className="text-2xl font-bold text-white mb-2">Become an API Provider</h1>
                <p className="text-slate-400 mb-8">Monetize your services by publishing APIs to the G-Axis Marketplace.</p>
                
                <form onSubmit={handleRegister} className="space-y-4 max-w-sm mx-auto">
                    <div>
                        <input 
                            type="text" required
                            value={orgName}
                            onChange={e => setOrgName(e.target.value)}
                            placeholder="Organization Name"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <button 
                        disabled={registering}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {registering ? 'Registering...' : 'Register as Provider'}
                    </button>
                </form>
            </div>
        );
    }

    const { provider, products } = data;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FaChartLine className="text-indigo-500" /> Provider Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2">{provider.organizationName} | API Monetization Hub</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                    Publish New API
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl">
                        <FaDollarSign />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm font-medium">Total Revenue</div>
                        <div className="text-2xl font-bold text-white">${provider.totalRevenue.toFixed(2)}</div>
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xl">
                        <FaBoxOpen />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm font-medium">Published APIs</div>
                        <div className="text-2xl font-bold text-white">{products.length}</div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xl">
                        <FaUsers />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm font-medium">Total Subscribers</div>
                        <div className="text-2xl font-bold text-white">
                            {products.reduce((acc, p) => acc + p.subscriberCount, 0)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-700 mt-8 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white">Your Published APIs</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-300 text-sm">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Product Name</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold">Category</th>
                            <th className="px-6 py-3 font-semibold text-right">Subscribers</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                    You haven't published any APIs yet.
                                </td>
                            </tr>
                        ) : products.map(product => (
                            <tr key={product._id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded uppercase font-bold">
                                        {product.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{product.category}</td>
                                <td className="px-6 py-4 text-right font-mono text-emerald-400">{product.subscriberCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProviderDashboard;
