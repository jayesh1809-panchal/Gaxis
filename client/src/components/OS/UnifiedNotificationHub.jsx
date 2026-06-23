import { useState } from 'react';
import { FaBell, FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'alert', title: 'Security Alert', message: 'New login from unknown IP address.', time: '5m ago', icon: <FaExclamationTriangle className="text-amber-500" /> },
    { id: 2, type: 'success', title: 'Workflow Completed', message: 'Employee onboarding for John Doe finished.', time: '1h ago', icon: <FaCheckCircle className="text-emerald-500" /> },
    { id: 3, type: 'info', title: 'App Installed', message: 'Jira Integration was installed by admin.', time: '2h ago', icon: <FaInfoCircle className="text-blue-500" /> }
];

const UnifiedNotificationHub = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-800 border-l border-slate-700 shadow-2xl animate-fade-in-right flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaBell className="text-indigo-500" /> Notifications
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <FaTimes size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notifications.map(notif => (
                    <div key={notif.id} className="p-4 rounded-xl bg-slate-700/50 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">{notif.icon}</div>
                            <div className="flex-1">
                                <div className="text-white font-medium">{notif.title}</div>
                                <div className="text-sm text-slate-400 mt-1">{notif.message}</div>
                                <div className="text-xs text-slate-500 mt-2">{notif.time}</div>
                            </div>
                        </div>
                    </div>
                ))}
                {notifications.length === 0 && (
                    <div className="text-center text-slate-500 py-8">
                        No new notifications
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-4 border-t border-slate-700">
                    <button 
                        onClick={() => setNotifications([])}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
};

export default UnifiedNotificationHub;
