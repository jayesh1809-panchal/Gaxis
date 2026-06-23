import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaBook, FaCode, FaKey, FaCheckCircle } from 'react-icons/fa';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const APIProductDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        api.get(`/api-marketplace/products/${id}`).then(res => {
            setData(res.data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const handleSubscribe = async (planId) => {
        setSubscribing(true);
        try {
            await api.post('/api-marketplace/subscribe', { productId: id, planId });
            alert("Successfully subscribed! Check your Consumer Dashboard.");
        } catch (e) {
            alert(e.response?.data?.error || "Subscription failed");
        }
        setSubscribing(false);
    };

    if (loading) return <LoadingSpinner />;
    if (!data) return <div className="p-8 text-center text-white">Product not found.</div>;

    const { product, plans } = data;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-8 flex flex-col md:flex-row gap-8 items-start">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 font-bold text-4xl shrink-0">
                    {product.name.charAt(0)}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                            <p className="text-slate-400 text-lg mb-4">{product.description}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">Provided by</div>
                            <div className="text-white font-medium">{product.providerId?.organizationName || 'Platform'}</div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md text-sm">v{product.version}</span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-sm font-medium">{product.category}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="border-b border-slate-800 p-4 flex gap-4 bg-slate-800/50">
                            <button className="flex items-center gap-2 text-emerald-400 font-medium px-4 py-2 border-b-2 border-emerald-500">
                                <FaBook /> Documentation
                            </button>
                            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-300 font-medium px-4 py-2">
                                <FaCode /> Swagger / Open API
                            </button>
                        </div>
                        <div className="p-8 prose prose-invert max-w-none">
                            <h3>Getting Started</h3>
                            <p>To use this API, you must first subscribe to a pricing plan and generate an API key in your developer portal.</p>
                            
                            <h4>Base URL</h4>
                            <pre><code>https://api.g-axis.com{product.baseEndpoint}</code></pre>

                            <h4>Authentication</h4>
                            <p>Pass your API key in the headers:</p>
                            <pre><code>x-api-key: your_api_key_here</code></pre>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaKey className="text-slate-400" /> Pricing Plans
                    </h3>
                    
                    {plans.map(plan => (
                        <div key={plan._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
                            <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                            <div className="text-3xl font-bold text-emerald-400 mb-4">
                                {plan.price === 0 ? 'Free' : `$${plan.price}`}
                                <span className="text-sm text-slate-500 font-normal">
                                    {plan.type === 'monthly' ? '/mo' : ''}
                                    {plan.type === 'usage_based' ? '/req' : ''}
                                </span>
                            </div>
                            
                            <ul className="space-y-3 mb-8 text-sm text-slate-300 flex-1">
                                <li className="flex items-center gap-2">
                                    <FaCheckCircle className="text-emerald-500" /> 
                                    {plan.quotaLimits?.requestsPerMonth ? `${plan.quotaLimits.requestsPerMonth} reqs/mo` : 'Unlimited Quota'}
                                </li>
                                <li className="flex items-center gap-2">
                                    <FaCheckCircle className="text-emerald-500" /> 
                                    {plan.rateLimits?.requestsPerSecond} requests/second
                                </li>
                            </ul>

                            <button 
                                onClick={() => handleSubscribe(plan._id)}
                                disabled={subscribing}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {subscribing ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default APIProductDetails;
