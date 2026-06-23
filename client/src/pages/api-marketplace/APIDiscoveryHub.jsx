import { useState, useEffect } from 'react';
import { FaSearch, FaFire, FaStar, FaStore } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const APIDiscoveryHub = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');

    const categories = ["Authentication", "Analytics", "Workflow", "Payments", "AI"];

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get(`/api-marketplace/discover?search=${search}&category=${category}`);
                setProducts(res.data.data);
            } catch (e) {
                console.error("Failed to fetch products", e);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [search, category]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto py-8">
                <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-4">
                    <FaStore className="text-emerald-500" /> Public API Marketplace
                </h1>
                <p className="text-slate-400 text-lg">
                    Discover, integrate, and monetize the world's best APIs. Build faster with powerful building blocks.
                </p>
                
                <div className="relative mt-8">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaSearch className="text-slate-500" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-full py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 shadow-xl"
                        placeholder="Search APIs (e.g., Face Detection, Weather...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button 
                        onClick={() => setCategory('')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === '' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        All
                    </button>
                    {categories.map(c => (
                        <button 
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            No APIs found matching your criteria.
                        </div>
                    )}
                    {products.map(product => (
                        <a key={product._id} href={`/api-marketplace/product/${product._id}`} className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 hover:border-emerald-500/50 hover:bg-slate-800 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 font-bold text-xl">
                                    {product.name.charAt(0)}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md mb-2">
                                        {product.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                                        <FaStar /> {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                            <p className="text-slate-400 text-sm mb-6 line-clamp-2">{product.description}</p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                <span className="text-xs text-slate-500">
                                    By {product.providerId?.organizationName || 'G-Axis'}
                                </span>
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                                    <FaFire /> {product.subscriberCount} Subscribers
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default APIDiscoveryHub;
