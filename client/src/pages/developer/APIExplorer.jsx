import { useState } from 'react';
import { FaPlay, FaTerminal, FaCode, FaExchangeAlt } from 'react-icons/fa';

const APIExplorer = () => {
    const [activeEndpoint, setActiveEndpoint] = useState('/api/gateway/external/health');
    const [method, setMethod] = useState('GET');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const testRequest = async () => {
        setLoading(true);
        try {
            // Simulating API Key request through our proxy
            const res = await fetch(`http://localhost:5000${activeEndpoint}`, {
                method,
                headers: {
                    'x-api-key': 'demo_key_testing'
                }
            });
            const data = await res.json();
            setResponse(data);
        } catch (e) {
            setResponse({ error: e.message });
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FaTerminal className="text-fuchsia-500" /> API Explorer
                </h1>
                <p className="text-slate-400 mt-2">Interactive Swagger-style console to test API endpoints.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-2 overflow-y-auto max-h-[70vh] pr-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Endpoints</div>
                    
                    <button 
                        onClick={() => { setActiveEndpoint('/api/gateway/external/health'); setMethod('GET'); }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeEndpoint === '/api/gateway/external/health' ? 'bg-slate-800 border border-slate-600' : 'hover:bg-slate-800/50'}`}
                    >
                        <span className="text-xs font-bold text-blue-400 w-10">GET</span>
                        <span className="text-sm text-slate-300 truncate">/external/health</span>
                    </button>

                    <button 
                        onClick={() => { setActiveEndpoint('/api/gateway/simulate-webhook'); setMethod('POST'); }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeEndpoint === '/api/gateway/simulate-webhook' ? 'bg-slate-800 border border-slate-600' : 'hover:bg-slate-800/50'}`}
                    >
                        <span className="text-xs font-bold text-emerald-400 w-10">POST</span>
                        <span className="text-sm text-slate-300 truncate">/simulate-webhook</span>
                    </button>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="flex items-center bg-slate-800 px-4 py-3 border-b border-slate-700">
                            <span className={`px-2 py-1 rounded text-xs font-bold mr-3 ${method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {method}
                            </span>
                            <span className="text-slate-300 font-mono text-sm flex-1">{activeEndpoint}</span>
                            <button 
                                onClick={testRequest}
                                disabled={loading}
                                className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <FaPlay className="text-xs" /> {loading ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>

                        <div className="p-4">
                            <h4 className="text-slate-400 text-xs font-semibold mb-2 uppercase">Headers</h4>
                            <div className="bg-slate-950 p-3 rounded-lg font-mono text-sm text-slate-300 border border-slate-800">
                                x-api-key: [YOUR_API_KEY]
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-700 flex flex-col h-96">
                        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <FaExchangeAlt className="text-slate-500" /> Response
                            </span>
                        </div>
                        <div className="p-4 flex-1 overflow-auto">
                            {response ? (
                                <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap">
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-3">
                                    <FaCode className="text-4xl opacity-20" />
                                    <span>Click Send Request to view response</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APIExplorer;
