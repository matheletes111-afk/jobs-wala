"use client";

import React, { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Users,
  Settings,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Save,
  Loader2,
  Briefcase,
  RefreshCw
} from "lucide-react";

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  tier: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  amount: number;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  package: Package;
}

export default function AdminCareerPackagesPage() {
  const [activeTab, setActiveTab] = useState<"crud" | "leads">("crud");
  
  // Data states
  const [packages, setPackages] = useState<Package[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Loading states
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [savingPackage, setSavingPackage] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgTier, setPkgTier] = useState("fresher");
  const [pkgFeaturesText, setPkgFeaturesText] = useState("");

  // Fetch package list
  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch("/api/career/packages");
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Fetch leads list
  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/career/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (activeTab === "leads") {
      fetchLeads();
    }
  }, [activeTab]);

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setPkgName(pkg.name);
    setPkgDescription(pkg.description || "");
    setPkgPrice(pkg.price.toString());
    setPkgTier(pkg.tier);
    setPkgFeaturesText(pkg.features.join("\n"));
  };

  const handleClearForm = () => {
    setEditingId(null);
    setPkgName("");
    setPkgDescription("");
    setPkgPrice("");
    setPkgTier("fresher");
    setPkgFeaturesText("");
  };

  const handleSubmitPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || !pkgPrice || !pkgTier) {
      alert("Name, Price, and Tier are required.");
      return;
    }

    setSavingPackage(true);
    const payload = {
      id: editingId || undefined,
      name: pkgName,
      description: pkgDescription,
      price: parseFloat(pkgPrice),
      tier: pkgTier,
      features: pkgFeaturesText.split("\n").map(f => f.trim()).filter(Boolean),
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const res = await fetch("/api/career/packages", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchPackages();
        handleClearForm();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save package");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const res = await fetch(`/api/career/packages?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPackages(packages.filter(p => p.id !== id));
      } else {
        alert("Failed to delete package.");
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        
        {/* Page Header */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Career Services</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Career Services <span className="text-blue-600">Administration</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Manage plans, prices, and monitor payments dashboard.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex w-fit items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab("crud")}
            className={`px-6 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "crud"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Settings className="h-4 w-4" />
            Manage Plans
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-6 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "leads"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="h-4 w-4" />
            Leads & Purchases
          </button>
        </div>

        {/* CRUD Tab Content */}
        {activeTab === "crud" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Editor / Price Editor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
              {editingId === null ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="bg-blue-50 p-4 rounded-xl text-blue-600 mb-4 border border-blue-100">
                    <Settings className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Select a Package to Edit Price
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                    Please select a package from the table on the right to edit its pricing. Creation of new packages is disabled.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    Edit Package Pricing
                  </h2>

                  <form onSubmit={handleSubmitPackage} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Package Name</label>
                      <input
                        type="text"
                        required
                        disabled
                        placeholder="e.g. Executive Premium Rewrite"
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 cursor-not-allowed text-slate-500 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tier / Classification</label>
                      <select
                        disabled
                        value={pkgTier}
                        onChange={(e) => setPkgTier(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 cursor-not-allowed text-slate-500 font-medium"
                      >
                        <option value="fresher">Fresher Plan</option>
                        <option value="mid_level">Mid-Level Plan</option>
                        <option value="executive">Executive Plan</option>
                        <option value="add_on">Power-Up Add-on</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Price (₹ INR)</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        placeholder="1499"
                        value={pkgPrice}
                        onChange={(e) => setPkgPrice(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Brief Description</label>
                      <textarea
                        disabled
                        rows={2}
                        placeholder="Describe target user demographics and features"
                        value={pkgDescription}
                        onChange={(e) => setPkgDescription(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 cursor-not-allowed text-slate-500 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Bullet Features (One per line)
                      </label>
                      <textarea
                        disabled
                        rows={4}
                        placeholder={"ATS compliant design\nFull LinkedIn rebuild\n24hr Delivery"}
                        value={pkgFeaturesText}
                        onChange={(e) => setPkgFeaturesText(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 cursor-not-allowed text-slate-500 font-mono"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={savingPackage}
                        className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span style={{ color: "white" }}>
                          {savingPackage ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          ) : (
                            "Update Price"
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Packages List */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Published Career Packages</h2>

              {loadingPackages ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : packages.length === 0 ? (
                <p className="text-slate-400 text-xs py-10 text-center font-medium">No packages configured yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                        <th className="py-3 px-4">Plan Details</th>
                        <th className="py-3 px-4">Tier</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {packages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-slate-50/30">
                          <td className="py-4 px-4 max-w-xs">
                            <p className="font-bold text-slate-800">{pkg.name}</p>
                            <p className="text-slate-400 text-[11px] truncate">{pkg.description || "No description"}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 capitalize">
                              {pkg.tier.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-extrabold text-slate-800">
                            ₹{pkg.price}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-55 text-blue-600 font-bold text-[11px] border border-slate-200 hover:border-blue-300 transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                              <Edit2 className="h-3 w-3" /> Edit Price
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEADS TAB CONTENT */}
        {activeTab === "leads" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Customer Leads & Direct Purchases</h2>
              <button
                onClick={fetchLeads}
                className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 bg-white text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Refresh List
              </button>
            </div>

            {loadingLeads ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : leads.length === 0 ? (
              <p className="text-slate-400 text-xs py-10 text-center font-medium">No career package purchases recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Chosen Package</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Razorpay Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/30">
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{lead.name}</p>
                          <p className="text-slate-500 text-[11px]">{lead.email}</p>
                          <p className="text-slate-500 text-[11px]">{lead.mobile}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-700">{lead.package?.name || "Deleted Package"}</p>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 capitalize">
                            {lead.package?.tier?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-slate-800">
                          ₹{lead.amount}
                        </td>
                        <td className="py-4 px-4">
                          {lead.status === "PAID" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Paid
                            </span>
                          ) : lead.status === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px] text-slate-400 text-right max-w-[120px] truncate">
                          {lead.razorpayPaymentId || lead.razorpayOrderId || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
