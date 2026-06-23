import React, { useState, useEffect } from "react";
import { getDeadLetters, replayDeadLetter } from "../services/eventBusService";
import { toast } from "react-hot-toast";
import { FaRedo, FaExclamationTriangle, FaEye } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

const EventDeadLetterQueue = () => {
    const [dlqs, setDlqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replayingIds, setReplayingIds] = useState(new Set());
    const [selectedDlq, setSelectedDlq] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getDeadLetters();
            setDlqs(res.data.data);
        } catch (error) {
            toast.error("Failed to load dead letter queue");
        } finally {
            setLoading(false);
        }
    };

    const handleReplay = async (id) => {
        setReplayingIds(prev => new Set(prev).add(id));
        try {
            await replayDeadLetter(id);
            toast.success("Replay triggered successfully");
            loadData();
        } catch (error) {
            toast.error("Failed to trigger replay");
        } finally {
            setReplayingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 border-b border-red-200 pb-5">
                <h1 className="text-3xl font-bold text-red-700 flex items-center">
                    <FaExclamationTriangle className="mr-3" /> Dead Letter Queue
                </h1>
                <p className="mt-2 text-sm text-red-600">
                    Events that have permanently failed after exceeding maximum retry attempts.
                </p>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-red-200">
                <ul className="divide-y divide-red-100">
                    {dlqs.map((dlq) => (
                        <li key={dlq._id} className="p-4 sm:px-6 hover:bg-red-50">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-red-700 truncate">
                                            {dlq.eventCode}
                                        </p>
                                        <div className="ml-2 flex-shrink-0 flex space-x-2">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                FAILED
                                            </span>
                                            {dlq.manualReplayStatus !== 'pending' && (
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    dlq.manualReplayStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    REPLAY {dlq.manualReplayStatus.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex flex-col">
                                            <p className="flex items-center text-sm text-slate-500">
                                                <span className="font-semibold mr-1">App:</span> {dlq.subscriptionId?.applicationId?.name || 'Unknown'}
                                            </p>
                                            <p className="mt-1 flex items-center text-xs text-red-600 truncate max-w-2xl">
                                                {dlq.failureReason}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0 gap-3">
                                            <button
                                                onClick={() => setSelectedDlq(dlq)}
                                                className="text-slate-600 hover:text-blue-600 flex items-center"
                                            >
                                                <FaEye className="mr-1" /> View Details
                                            </button>
                                            <button
                                                onClick={() => handleReplay(dlq._id)}
                                                disabled={replayingIds.has(dlq._id)}
                                                className="text-red-600 hover:text-red-800 flex items-center disabled:opacity-50"
                                            >
                                                {replayingIds.has(dlq._id) ? <LoadingSpinner size="small" /> : <FaRedo className="mr-1" />} 
                                                Replay
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {dlqs.length === 0 && (
                        <li className="p-8 text-center text-sm text-slate-500">
                            The Dead Letter Queue is empty!
                        </li>
                    )}
                </ul>
            </div>

            {selectedDlq && (
                <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-slate-900">DLQ Details</h3>
                            <button onClick={() => setSelectedDlq(null)} className="text-slate-500 hover:text-slate-700">Close</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-slate-700">Failure Reason</h4>
                                <p className="text-sm text-red-600 mt-1 p-3 bg-red-50 rounded border border-red-100">{selectedDlq.failureReason}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-1">Failed Payload</h4>
                                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md text-xs overflow-x-auto">
                                    {JSON.stringify(selectedDlq.failedEventPayload, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-2">Retry History</h4>
                                <div className="space-y-2">
                                    {selectedDlq.retryHistory.map((retry, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded text-sm">
                                            <div className="flex justify-between text-slate-500 mb-1 text-xs">
                                                <span>Attempt #{retry.attempt}</span>
                                                <span>{new Date(retry.attemptedAt).toLocaleString()}</span>
                                            </div>
                                            <p className="font-mono text-red-600">{retry.error}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDeadLetterQueue;
