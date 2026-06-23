import { FaCopy, FaCheck } from "react-icons/fa";
import { useState } from "react";

const SecretModal = ({ isOpen, onClose, secret }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Application Created</h3>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <p className="text-sm text-yellow-700 font-medium">
                        Important: Please copy this client secret now. It is shown only once and cannot be retrieved again.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Client Secret</label>
                    <div className="flex mt-1 relative rounded-md shadow-sm">
                        <input
                            type="text"
                            readOnly
                            value={secret}
                            className="flex-1 block w-full rounded-md border-slate-300 bg-slate-50 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-slate-600"
                        />
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                        >
                            {copied ? <FaCheck className="mr-2" /> : <FaCopy className="mr-2" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 border border-transparent rounded-md text-sm font-medium text-white hover:bg-slate-900 focus:outline-none"
                    >
                        I have copied the secret
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecretModal;
