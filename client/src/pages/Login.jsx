import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FaLock, FaEnvelope, FaKey } from 'react-icons/fa';
import { verifyMfa } from '../services/mfaService';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // MFA States
    const [mfaRequired, setMfaRequired] = useState(false);
    const [preAuthToken, setPreAuthToken] = useState('');
    const [otp, setOtp] = useState('');

    const { login, processMfaLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            return toast.error("Please fill in all fields");
        }

        // Basic email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return toast.error("Please enter a valid email address");
        }

        try {
            setLoading(true);
            const data = await login(email, password);
            
            if (data?.mfaRequired) {
                setPreAuthToken(data.preAuthToken);
                setMfaRequired(true);
                toast('MFA Required. Please enter your code.', { icon: '🔐' });
                return;
            }

            toast.success("Successfully logged in!");
            
            const searchParams = new URLSearchParams(location.search);
            const returnTo = searchParams.get('returnTo');
            console.log("RETURN TO:", returnTo);
            if (returnTo) {
                if (returnTo.startsWith('/api/')) {
                    window.location.href = `http://localhost:5011${returnTo}`;
                } else {
                    window.location.href = returnTo;
                }
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to log in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        if (!otp) return toast.error("Please enter your MFA code");

        try {
            setLoading(true);
            const { data } = await verifyMfa(preAuthToken, otp);
            processMfaLogin(data);
            toast.success("Successfully logged in!");

            const searchParams = new URLSearchParams(location.search);
            const returnTo = searchParams.get('returnTo');
            console.log("RETURN TO:", returnTo);
            if (returnTo) {
                if (returnTo.startsWith('/api/')) {
                    window.location.href = `http://localhost:5011${returnTo}`;
                } else {
                    window.location.href = returnTo;
                }
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid MFA code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">G</span>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Sign in to G-Axis
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {!mfaRequired ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className="text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleMfaSubmit}>
                            <div className="text-center mb-6">
                                <FaKey className="mx-auto text-3xl text-blue-600 mb-2" />
                                <h3 className="text-lg font-medium text-slate-900">Two-Factor Authentication</h3>
                                <p className="text-sm text-slate-500 mt-1">Enter your 6-digit Authenticator code or an 8-character backup code.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Authentication Code
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center tracking-widest text-lg font-mono"
                                        placeholder="123456"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>
                            
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMfaRequired(false);
                                        setOtp('');
                                        setPreAuthToken('');
                                    }}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                >
                                    Back to login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
