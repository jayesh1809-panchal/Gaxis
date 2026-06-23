import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { FaCreditCard, FaRegCheckCircle, FaExclamationTriangle, FaDownload, FaHistory } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

const TenantBillingDashboard = () => {
    const [billingAccount, setBillingAccount] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingInvoiceId, setPayingInvoiceId] = useState(null);

    const loadBillingData = async () => {
        try {
            setLoading(true);
            const [accRes, invRes, licRes] = await Promise.all([
                api.get("/billing/account"),
                api.get("/billing/invoices"),
                api.get("/licensing/my-licenses")
            ]);
            
            setBillingAccount(accRes.data.data);
            setInvoices(invRes.data.data);
            setLicenses(licRes.data.data);
        } catch (error) {
            console.error("Failed to load billing metrics", error);
            toast.error("Failed to load billing details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBillingData();
    }, []);

    const handlePayInvoice = async (invoiceId) => {
        setPayingInvoiceId(invoiceId);
        try {
            await api.post(`/billing/invoices/${invoiceId}/pay`, { source: "default_card" });
            toast.success("Payment processed successfully!");
            loadBillingData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Payment processing failed");
        } finally {
            setPayingInvoiceId(null);
        }
    };

    const triggerMockBilling = async () => {
        try {
            toast.loading("Simulating end-of-period billing engine...", { id: "cycle" });
            await api.post("/billing/trigger-cycle", {});
            toast.success("Billing cycle calculated!", { id: "cycle" });
            loadBillingData();
        } catch (error) {
            toast.error("Failed to run billing engine", { id: "cycle" });
        }
    };

    if (loading) return <LoadingSpinner />;

    // Calculate outstanding balance
    const outstandingInvoices = invoices.filter(inv => ['unpaid', 'past_due'].includes(inv.status));
    const outstandingBalance = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Billing & Entitlements</h1>
                    <p className="text-slate-500 mt-1">Manage payment profiles, track active app licenses, and settle invoices.</p>
                </div>
                <button
                    onClick={triggerMockBilling}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Trigger Billing Cycle Run
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
                        <div className="text-4xl font-black text-slate-900 mt-2">
                            ${outstandingBalance.toFixed(2)}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaCreditCard className="text-slate-400" />
                        <span>Autopay active via card ending in 4242</span>
                    </div>
                </div>

                {/* Account details */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Billing Account</span>
                        <div className="text-lg font-bold text-slate-900 mt-2">
                            {billingAccount?.billingEmail || "N/A"}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Currency: {billingAccount?.currency || 'USD'}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${billingAccount?.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {billingAccount?.status || 'active'}
                        </span>
                        <span className="text-slate-400">Account status</span>
                    </div>
                </div>

                {/* License counts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">App Entitlements</span>
                        <div className="text-4xl font-black text-slate-900 mt-2">
                            {licenses.filter(l => l.status === 'active').length} Active
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaRegCheckCircle className="text-green-500" />
                        <span>All applications valid and current</span>
                    </div>
                </div>
            </div>

            {/* Active Licenses Detail */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">Application Licenses</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Entitlements, seats, and monthly capacity allocations.</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {licenses.map((lic) => (
                        <div key={lic._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg uppercase shadow-sm">
                                    {lic.marketplaceAppId?.code?.slice(0, 2) || 'AP'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{lic.marketplaceAppId?.name}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Plan: <span className="font-semibold text-slate-700">{lic.planId?.name}</span></p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-medium">Expires</span>
                                    <p className="font-semibold text-slate-700 mt-0.5">{new Date(lic.expiryDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-medium">Seats Capacity</span>
                                    <p className="font-semibold text-slate-700 mt-0.5">{lic.seats === -1 ? 'Unlimited' : lic.seats}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-medium">API Calls Limit</span>
                                    <p className="font-semibold text-slate-700 mt-0.5">{lic.usageLimits?.apiCallsPerMonth === -1 ? 'Unlimited' : `${lic.usageLimits?.apiCallsPerMonth}/mo`}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs uppercase font-medium">Status</span>
                                    <p className="mt-0.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase ${lic.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {lic.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {licenses.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No active software application licenses found. Subscribe to apps in the Marketplace.
                        </div>
                    )}
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Billing History</h2>
                        <p className="text-slate-500 text-sm mt-0.5">Invoices, billing cycles, payments, and invoices downloads.</p>
                    </div>
                    <FaHistory className="text-slate-400 text-xl" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                                <th className="p-4 font-semibold">Invoice ID</th>
                                <th className="p-4 font-semibold">Application</th>
                                <th className="p-4 font-semibold">Period</th>
                                <th className="p-4 font-semibold">Subtotal</th>
                                <th className="p-4 font-semibold">Tax</th>
                                <th className="p-4 font-semibold">Total</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {invoices.map((inv) => (
                                <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                                    <td className="p-4 text-slate-700 font-medium">{inv.marketplaceAppId?.name || "Platform-wide"}</td>
                                    <td className="p-4 text-slate-600">{inv.billingPeriod}</td>
                                    <td className="p-4 text-slate-600">${inv.amount.toFixed(2)}</td>
                                    <td className="p-4 text-slate-600">${inv.tax.toFixed(2)}</td>
                                    <td className="p-4 font-bold text-slate-800">${inv.total.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                            inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                                            inv.status === 'unpaid' ? 'bg-yellow-50 text-yellow-700' :
                                            inv.status === 'past_due' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            {['unpaid', 'past_due'].includes(inv.status) && (
                                                <button
                                                    onClick={() => handlePayInvoice(inv._id)}
                                                    disabled={payingInvoiceId === inv._id}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-lg text-xs shadow-sm transition-colors"
                                                >
                                                    {payingInvoiceId === inv._id ? "Paying..." : "Pay Now"}
                                                </button>
                                            )}
                                            <button className="text-slate-600 hover:text-blue-600 p-1 transition-colors">
                                                <FaDownload />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">
                                        No invoice records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TenantBillingDashboard;
