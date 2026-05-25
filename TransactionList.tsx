import React, { useState } from "react";
import { Transaction } from "../types";
import { CATEGORY_THEMES, STANDARD_CATEGORIES } from "../data";
import { Search, Filter, CheckCircle2, ShieldQuestion, Calendar, AlertTriangle, Check, Trash2, ShieldCheck, HelpCircle } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onApproveTransaction: (id: string) => void;
  onRejectTransaction: (id: string) => void;
  onResolveAnomaly: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function TransactionList({
  transactions,
  onApproveTransaction,
  onRejectTransaction,
  onResolveAnomaly,
  onDeleteTransaction
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const matchesSearch = t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    
    let matchesStatus = true;
    if (selectedStatus === "Approved") matchesStatus = t.isApproved;
    else if (selectedStatus === "Pending Approval") matchesStatus = !t.isApproved;
    else if (selectedStatus === "Flagged / Anomalies") matchesStatus = t.status === "flagged";

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div id="ledger-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
      {/* Header and Filter Bars */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-indigo-400 tracking-wider uppercase">
              Intelligent Ledger Table
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Audit transaction states, approve split claims, and address flags & anomalies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-slate-100 dark:bg-slate-850 text-slate-705 dark:text-slate-300 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-bold font-mono shadow-3xs">
              Total Recorded: {filtered.length} Items
            </span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Search Area */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search merchants or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-3xs placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 shadow-3xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1.5 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-755 dark:text-slate-300 focus:outline-none border-none py-0.5 h-full cursor-pointer"
            >
              <option value="All" className="text-slate-800 dark:bg-slate-900">All Categories</option>
              {STANDARD_CATEGORIES.map((cat, idx) => (
                <option key={idx} value={cat} className="text-slate-805 dark:bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Workflow Status Dropdown */}
          <div className="flex items-center bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded px-2 py-1 shadow-3xs">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1.5 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-705 dark:text-slate-300 focus:outline-none border-none py-0.5 h-full cursor-pointer"
            >
              <option value="All" className="text-slate-800 dark:bg-slate-900">All Workflow States</option>
              <option value="Approved" className="text-slate-800 dark:bg-slate-900">Verified / Approved</option>
              <option value="Pending Approval" className="text-slate-800 dark:bg-slate-900">Pending Approval (Split Claims)</option>
              <option value="Flagged / Anomalies" className="text-slate-800 dark:bg-slate-900">Flagged (Spending Anomalies)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
            <ShieldQuestion className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-705 mb-2" />
            <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">No transactions match your current query parameters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-250 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                <th className="px-5 py-2.5">Audit Date</th>
                <th className="px-5 py-2.5">Merchant / Retailer</th>
                <th className="px-5 py-2.5">Spend Category</th>
                <th className="px-5 py-2.5">Method</th>
                <th className="px-5 py-2.5 text-right">Sum (₹)</th>
                <th className="px-5 py-2.5">Workflow State</th>
                <th className="px-5 py-2.5 text-right">Policies / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {filtered.map((t) => {
                const theme = CATEGORY_THEMES[t.category] || CATEGORY_THEMES["Other"];
                return (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-705 dark:text-slate-300 text-xs transition-colors duration-75">
                    {/* 1. Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600" />
                        {t.date}
                      </div>
                    </td>

                    {/* 2. Merchant */}
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t.merchant}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 max-w-xs truncate">{t.description}</p>
                      </div>
                    </td>

                    {/* 3. Category Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${theme.color} dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-805`}>
                        {t.category}
                      </span>
                    </td>

                    {/* 4. Payment Method */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                      {t.paymentMethod}
                    </td>

                    {/* 5. Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-bold text-slate-800 dark:text-slate-100 font-mono text-xs">
                      ₹{t.amount.toFixed(2)}
                    </td>

                    {/* 6. Workflow Status Badging */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {/* Transaction Anomaly state */}
                        {t.status === "flagged" && (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60 w-fit">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-450" />
                            Anomaly Alert
                          </span>
                        )}

                        {/* Approval workflow state */}
                        {t.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-250 dark:border-emerald-900/60 w-fit font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-450" />
                            Verified Claims
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 dark:bg-amber-950/25 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-250 dark:border-amber-900/60 w-fit font-bold animate-pulse">
                            <ShieldQuestion className="w-2.5 h-2.5 text-amber-600 dark:text-amber-450" />
                            Awaiting Verify
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. Action Policies (Approve, Resolve Anomaly, Reject/Delete) */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Resolve Pending Verification */}
                        {!t.isApproved && (
                          <>
                            <button
                              onClick={() => onApproveTransaction(t.id)}
                              title="Approve / Reimburse"
                              className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-250 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-800 cursor-pointer text-[10px] flex items-center gap-0.5 transition-all font-bold shadow-3xs"
                            >
                              <ShieldCheck className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => onRejectTransaction(t.id)}
                              title="Reject Claim"
                              className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded border border-rose-250 dark:border-rose-905 hover:bg-rose-100 dark:hover:bg-rose-900 hover:text-rose-800 cursor-pointer text-[10px] flex items-center gap-0.5 transition-all font-bold shadow-3xs"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Settle Spending Anomaly flags */}
                        {t.status === "flagged" && t.isApproved && (
                          <button
                            onClick={() => onResolveAnomaly(t.id)}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded border border-indigo-250 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-800 cursor-pointer text-[10px] flex items-center gap-1 transition-all font-bold shadow-3xs"
                          >
                            Resolve Alert
                          </button>
                        )}

                        {/* Traditional Delete */}
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          title="Purge transaction record"
                          className="p-1 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-550 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:border-rose-800 rounded border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center gap-1 transition-all shadow-3xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
