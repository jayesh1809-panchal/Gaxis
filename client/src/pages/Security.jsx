import { useState, useEffect } from "react";
import { setupMfa, verifySetup, disableMfa, regenerateBackupCodes } from "../services/mfaService";
import { getMySessions } from "../services/sessionService";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { FaShieldAlt, FaKey, FaTimes, FaDesktop, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const Security = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Status
    const [mfaEnabled, setMfaEnabled] = useState(false); // We don't have a direct endpoint to get this yet, but we'll assume false initially. Actually, we should fetch it or it should be in the JWT. For now, we'll try to generate backup codes to check if it's enabled.
    const [activeSessions, setActiveSessions] = useState([]);
    
    // Modals
    const [setupModalOpen, setSetupModalOpen] = useState(false);
    const [disableModalOpen, setDisableModalOpen] = useState(false);
    const [backupModalOpen, setBackupModalOpen] = useState(false);
    
    // Wizard state
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [otp, setOtp] = useState("");
    const [backupCodes, setBackupCodes] = useState([]);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch sessions to see last login and active count
                const { data: sessionsData } = await getMySessions();
                setActiveSessions(sessionsData.filter(s => s.status === 'active'));

                // Ideally we'd have a GET /api/mfa/status endpoint.
                // We'll rely on the user object or just let the user try to enable it.
                // If the user's status is returned in the auth endpoint, we'd use it.
            } catch (error) {
                toast.error("Failed to load security settings");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Setup Wizard
    const handleStartSetup = async () => {
        try {
            setSubmitting(true);
            const { data } = await setupMfa();
            setQrCode(data.qrCodeUrl);
            setSecret(data.secret);
            setStep(1);
            setSetupModalOpen(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to start MFA setup");
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifySetup = async () => {
        if (!otp) return toast.error("Please enter the OTP");
        try {
            setSubmitting(true);
            const { data } = await verifySetup(otp);
            setBackupCodes(data.backupCodes);
            setMfaEnabled(true);
            setStep(3); // Move to backup codes step
            toast.success("MFA successfully enabled!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP code");
        } finally {
            setSubmitting(false);
        }
    };

    // Disable MFA
    const handleDisableMfa = async () => {
        if (!otp) return toast.error("Please enter the OTP");
        try {
            setSubmitting(true);
            await disableMfa(otp);
            setMfaEnabled(false);
            setDisableModalOpen(false);
            setOtp("");
            toast.success("MFA successfully disabled");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP code");
        } finally {
            setSubmitting(false);
        }
    };

    // Regenerate Backup Codes
    const handleRegenerateBackup = async () => {
        if (!otp) return toast.error("Please enter the OTP");
        try {
            setSubmitting(true);
            const { data } = await regenerateBackupCodes(otp);
            setBackupCodes(data.backupCodes);
            setStep(3); // Reuse the backup codes display
            setBackupModalOpen(false);
            setSetupModalOpen(true); // Open the display modal
            toast.success("Backup codes regenerated");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP code");
        } finally {
            setSubmitting(false);
            setOtp("");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Security Settings</h1>
                <p className="text-slate-500 mt-1">Manage your Multi-Factor Authentication and active sessions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* MFA Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4 text-slate-800">
                        <FaShieldAlt className="text-xl text-blue-600" />
                        <h3 className="font-semibold text-lg">Two-Factor Authentication</h3>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-6">
                        Protect your account with an additional layer of security. Once configured, you'll be required to enter both your password and an authentication code from your mobile phone.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={handleStartSetup}
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            Setup MFA
                        </button>
                        
                        <button
                            onClick={() => { setOtp(""); setDisableModalOpen(true); }}
                            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded hover:bg-slate-200 transition-colors"
                        >
                            Disable MFA
                        </button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => { setOtp(""); setBackupModalOpen(true); }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Regenerate Backup Codes
                        </button>
                    </div>
                </div>

                {/* Sessions Overview Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4 text-slate-800">
                        <FaDesktop className="text-xl text-emerald-600" />
                        <h3 className="font-semibold text-lg">Session Overview</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                            <span className="text-sm text-slate-600">Active Sessions</span>
                            <span className="font-bold text-slate-900">{activeSessions.length}</span>
                        </div>
                        
                        {activeSessions.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-100">
                                <p className="text-xs text-blue-600 font-semibold mb-1">CURRENT DEVICE</p>
                                <p className="text-sm font-medium text-slate-800">{activeSessions[0].deviceInfo}</p>
                                <p className="text-xs text-slate-500 mt-1">IP: {activeSessions[0].ipAddress}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MFA Setup Wizard Modal */}
            {setupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                            <h2 className="text-xl font-bold text-slate-900">Configure MFA</h2>
                            {step === 3 ? null : (
                                <button onClick={() => setSetupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <FaTimes className="text-xl" />
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            {step === 1 && (
                                <div className="text-center space-y-4">
                                    <h3 className="font-medium text-slate-900">Step 1: Scan QR Code</h3>
                                    <p className="text-sm text-slate-500">Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator.</p>
                                    <div className="flex justify-center p-4 bg-white border rounded">
                                        <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                                    </div>
                                    <p className="text-xs text-slate-500 break-all">Or enter code manually: <span className="font-mono font-bold text-slate-800">{secret}</span></p>
                                    <button
                                        onClick={() => setStep(2)}
                                        className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                                    >
                                        Next Step
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="text-center space-y-4">
                                    <h3 className="font-medium text-slate-900">Step 2: Verify Setup</h3>
                                    <p className="text-sm text-slate-500">Enter the 6-digit code generated by your authenticator app.</p>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full text-center text-2xl tracking-widest font-mono py-3 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        autoComplete="off"
                                    />
                                    <div className="flex gap-3">
                                        <button onClick={() => setStep(1)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">Back</button>
                                        <button onClick={handleVerifySetup} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50">Verify</button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-600 justify-center mb-2">
                                        <FaCheckCircle className="text-2xl" />
                                        <h3 className="font-bold text-lg">Setup Complete!</h3>
                                    </div>
                                    
                                    <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
                                        <div className="flex gap-2 text-amber-800 mb-2 font-medium items-center">
                                            <FaExclamationTriangle />
                                            Save Your Backup Codes
                                        </div>
                                        <p className="text-xs text-amber-700 mb-3">If you lose access to your authenticator app, you can use these backup codes to sign in. <strong>They will only be shown once.</strong> Keep them somewhere safe.</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {backupCodes.map((code, index) => (
                                                <div key={index} className="bg-white px-3 py-2 border border-amber-200 rounded text-center font-mono text-sm tracking-wider text-slate-800">{code}</div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSetupModalOpen(false);
                                            setBackupCodes([]);
                                            setStep(1);
                                        }}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                                    >
                                        I have saved my codes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Disable MFA Modal */}
            {disableModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col">
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Disable MFA?</h3>
                            <p className="text-sm text-slate-500 mb-6">Enter your current authenticator code to confirm.</p>
                            
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                className="w-full text-center text-xl tracking-widest font-mono py-2 mb-6 border border-slate-300 rounded focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                            />
                            
                            <div className="flex gap-3">
                                <button onClick={() => setDisableModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">Cancel</button>
                                <button onClick={handleDisableMfa} disabled={submitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50">Disable</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Regenerate Backup Codes Modal */}
            {backupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col">
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Regenerate Codes</h3>
                            <p className="text-sm text-slate-500 mb-4">This will invalidate all existing backup codes. Enter your authenticator code to proceed.</p>
                            
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                className="w-full text-center text-xl tracking-widest font-mono py-2 mb-6 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            
                            <div className="flex gap-3">
                                <button onClick={() => setBackupModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">Cancel</button>
                                <button onClick={handleRegenerateBackup} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50">Generate</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Security;
