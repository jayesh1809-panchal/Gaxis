import React, { useState, useEffect } from "react";
import { getEvents, getSubscriptions, createSubscription, deleteSubscription } from "../services/eventBusService";
import { toast } from "react-hot-toast";
import { FaTrash, FaPlus, FaCheckCircle, FaProjectDiagram } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

const EventDashboard = () => {
    const [events, setEvents] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showSubModal, setShowSubModal] = useState(false);
    const [newSub, setNewSub] = useState({ eventCode: '', applicationId: '', endpoint: '', transport: 'webhook' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [evRes, subRes] = await Promise.all([
                getEvents(),
                getSubscriptions()
            ]);
            setEvents(evRes.data.data);
            setSubscriptions(subRes.data.data);
        } catch (error) {
            toast.error("Failed to load Event Bus data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSub = async (e) => {
        e.preventDefault();
        try {
            await createSubscription(newSub);
            toast.success("Subscription created");
            setShowSubModal(false);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create subscription");
        }
    };

    const handleDeleteSub = async (id) => {
        if (!window.confirm("Delete this subscription?")) return;
        try {
            await deleteSubscription(id);
            toast.success("Subscription deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete subscription");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 border-b border-slate-200 pb-5 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <FaProjectDiagram className="mr-3 text-blue-600" /> Event Bus Catalog
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Discover available events and manage inter-application subscriptions via webhooks.
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => window.location.href='/event-bus/deliveries'}
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-300 px-3 py-1.5 rounded"
                    >
                        Delivery Monitor
                    </button>
                    <button 
                        onClick={() => window.location.href='/event-bus/dlq'}
                        className="text-sm font-medium text-red-600 hover:text-red-800 bg-white border border-red-300 px-3 py-1.5 rounded"
                    >
                        Dead Letter Queue
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Events Catalog */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Event Catalog</h2>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
                        <ul className="divide-y divide-slate-200">
                            {events.map(ev => (
                                <li key={ev._id} className="px-4 py-4 sm:px-6 hover:bg-slate-50 cursor-pointer">
                                    <p className="text-sm font-semibold text-blue-600">{ev.name}</p>
                                    <p className="text-xs text-slate-500 mt-1 font-mono">{ev.code}</p>
                                    <div className="mt-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                            {ev.category}
                                        </span>
                                    </div>
                                </li>
                            ))}
                            {events.length === 0 && <li className="p-4 text-sm text-slate-500">No events defined.</li>}
                        </ul>
                    </div>
                </div>

                {/* Subscriptions */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Active Subscriptions</h2>
                        <button 
                            onClick={() => setShowSubModal(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <FaPlus className="mr-2" /> Add Subscription
                        </button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
                        <ul className="divide-y divide-slate-200">
                            {subscriptions.map(sub => (
                                <li key={sub._id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{sub.eventCode}</p>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                <span className="font-semibold mr-1">App:</span> {sub.applicationId?.name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 font-mono">{sub.endpoint}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="flex items-center text-xs text-green-600 font-medium">
                                                <FaCheckCircle className="mr-1" /> Active
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteSub(sub._id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {subscriptions.length === 0 && <li className="p-4 text-sm text-slate-500">No active subscriptions found.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Basic Modal for creation */}
            {showSubModal && (
                <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">New Webhook Subscription</h3>
                        <form onSubmit={handleCreateSub} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Application ID</label>
                                <input required type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={newSub.applicationId} onChange={e => setNewSub({...newSub, applicationId: e.target.value})} placeholder="60d...a3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Event Code</label>
                                <select required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={newSub.eventCode} onChange={e => setNewSub({...newSub, eventCode: e.target.value})}>
                                    <option value="">Select Event...</option>
                                    {events.map(ev => <option key={ev.code} value={ev.code}>{ev.code} ({ev.name})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Webhook URL</label>
                                <input required type="url" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={newSub.endpoint} onChange={e => setNewSub({...newSub, endpoint: e.target.value})} placeholder="https://myapp.com/webhook" />
                            </div>
                            <div className="mt-5 sm:mt-6 flex space-x-3">
                                <button type="button" onClick={() => setShowSubModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:text-sm">Cancel</button>
                                <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:text-sm">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDashboard;
