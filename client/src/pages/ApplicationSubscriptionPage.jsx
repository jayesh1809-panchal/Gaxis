import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { getPlans, subscribe, getUsage } from "../services/subscriptionService";
import { getMarketplaceApplicationDetails } from "../services/marketplaceService";
import LoadingSpinner from "../components/LoadingSpinner";

const ApplicationSubscriptionPage = () => {
    const { id } = useParams(); // marketplaceAppId
    const navigate = useNavigate();
    
    const [appDetails, setAppDetails] = useState(null);
    const [plans, setPlans] = useState([]);
    const [usage, setUsage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Mocking current plan for now since it's typically fetched via getMySubscriptions and filtering
    // In a real scenario we'd query /api/subscriptions/my-subscriptions and find the active one for this app.
    const [currentPlanId, setCurrentPlanId] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [appRes, plansRes, usageRes] = await Promise.all([
                getMarketplaceApplicationDetails(id),
                getPlans(id),
                getUsage(id)
            ]);
            
            setAppDetails(appRes.data.data.application);
            setPlans(plansRes.data.data);
            setUsage(usageRes.data.data);
            
            // Assume the user wants to see plans, we'd normally set the currentPlanId from their active subscription.
            // For now, if they don't have one, it stays null.
        } catch (error) {
            toast.error("Failed to load subscription details");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        setProcessing(true);
        try {
            await subscribe(id, planId);
            toast.success("Subscription updated successfully!");
            setCurrentPlanId(planId);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update subscription");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!appDetails) return <div>App not found</div>;

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
            >
                <FaArrowLeft className="mr-2" /> Back
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Manage Subscription: {appDetails.name}</h1>
                <p className="text-slate-500 mt-2">
                    Choose the right plan for your team and track your usage.
                </p>
            </div>

            {/* Usage Section */}
            {usage.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Current Usage</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {usage.map((metric, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{metric.metricType}</h3>
                                <p className="text-2xl font-bold text-slate-800 mt-2">{metric.value}</p>
                                <p className="text-xs text-slate-400 mt-1">Period: {metric.period}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Plans Section */}
            <div>
                <h2 className="text-xl font-bold mb-4">Available Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isCurrent = currentPlanId === plan._id;
                        return (
                            <div key={plan._id} className={`bg-white rounded-lg shadow-sm border ${isCurrent ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'} p-6 relative flex flex-col`}>
                                {isCurrent && (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                        CURRENT PLAN
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline text-slate-900">
                                    <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                                    <span className="ml-1 text-xl font-semibold">/{plan.currency}</span>
                                </div>
                                <p className="mt-4 text-sm text-slate-500 border-b pb-4">
                                    Includes limits: {plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} Users, {plan.limits.storageGB === -1 ? 'Unlimited' : plan.limits.storageGB} GB Storage.
                                </p>
                                <ul className="mt-6 space-y-4 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex">
                                            <FaCheck className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="ml-3 text-sm text-slate-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8">
                                    <button
                                        onClick={() => handleSubscribe(plan._id)}
                                        disabled={isCurrent || processing}
                                        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                                            isCurrent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-white bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {isCurrent ? "Active" : (processing ? "Processing..." : "Select Plan")}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {plans.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
                        <p className="text-slate-500">No subscription plans are available for this application yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationSubscriptionPage;
