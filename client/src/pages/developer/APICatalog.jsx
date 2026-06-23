import { useState, useEffect } from 'react';
import { FaBook, FaCheckCircle, FaLock } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const APICatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/developer/api-products').then(res => {
            setProducts(res.data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FaBook className="text-emerald-500" /> API Catalog
                </h1>
                <p className="text-slate-400 mt-2">Discover available public APIs and their integration capabilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 && <p className="text-slate-400">No public API products available.</p>}
                {products.map(product => (
                    <div key={product._id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-white">{product.name}</h3>
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">
                                {product.version}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">{product.description || "A core platform API product."}</p>
                        
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <FaCheckCircle className="text-emerald-500" /> REST / JSON
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <FaLock className="text-slate-500" /> Requires API Key
                            </div>
                        </div>

                        <a href={`/developer/explorer?product=${product._id}`} className="block w-full py-2 text-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                            Explore Documentation
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default APICatalog;
