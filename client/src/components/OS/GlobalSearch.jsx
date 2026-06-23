import { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaProjectDiagram, FaCube, FaTimes } from 'react-icons/fa';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const ICONS = {
    FaUser: <FaUser />,
    FaProjectDiagram: <FaProjectDiagram />,
    FaCube: <FaCube />
};

const GlobalSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            api.get(`/search?q=${query}`).then(res => {
                setResults(res.data.data);
            }).catch(e => console.error("Search failed", e));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-slate-700">
                    <FaSearch className="text-slate-400 text-xl" />
                    <input 
                        autoFocus
                        type="text" 
                        className="w-full bg-transparent border-none text-white text-xl ml-4 focus:outline-none"
                        placeholder="Search users, workflows, apps, projects..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button onClick={onClose} className="text-slate-400 hover:text-white ml-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                {results.length > 0 && (
                    <div className="max-h-96 overflow-y-auto p-2">
                        {results.map((result, idx) => (
                            <button 
                                key={idx}
                                onClick={() => {
                                    onClose();
                                    navigate(result.url);
                                }}
                                className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-900 text-slate-300 flex items-center justify-center">
                                    {ICONS[result.icon] || <FaCube />}
                                </div>
                                <div>
                                    <div className="text-white font-medium">{result.title}</div>
                                    <div className="text-sm text-slate-400">{result.subtitle} • {result.type}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {query && results.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No results found for "{query}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
