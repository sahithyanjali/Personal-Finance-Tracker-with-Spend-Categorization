import React from "react";
import { Subscription } from "../types";
import { CreditCard, Bell, Sparkles, Check, ToggleLeft, AlertCircle, XCircle } from "lucide-react";

interface SubscriptionTrackerProps {
  subscriptions: Subscription[];
  onChangeSubStatus: (id: string, state: 'active' | 'cancelled_recommended' | 'kept') => void;
}

export default function SubscriptionTracker({ subscriptions, onChangeSubStatus }: SubscriptionTrackerProps) {
  
  // Total subscription outflow calculation (ignore cancelled recommended ones)
  const activeSubs = subscriptions.filter(s => s.status !== "cancelled_recommended");
  const totalMonthlyCost = activeSubs.reduce((sum, s) => {
    return sum + (s.billingCycle === "monthly" ? s.cost : s.cost / 12);
  }, 0);

  // Check upcoming renewals (next 7 days from today 2026-05-25)
  const today = new Date("2026-05-25");
  const getSubBadgeStatus = (nextDateStr: string) => {
    const nextDate = new Date(nextDateStr);
    const diffTime = Math.abs(nextDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (nextDateStr === "2026-05-28" || diffDays <= 3) return "Urgent Alert";
    if (diffDays <= 7) return "Renewing Soon";
    return "";
  };

  return (
    <div id="subscription-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full shadow-xs transition-colors">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Recurring Subscriptions
          </h2>
          <span className="text-[10px] text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-900/60 font-bold font-mono">
            Outflow: ₹{totalMonthlyCost.toFixed(2)}/mo
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-light leading-normal">
          Monitor recurring licensing services, track upcoming payment triggers, and cancel under-utilized bundles.
        </p>

        {/* Upcomings and alerts list */}
        <div className="mb-4">
          <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-2 tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Active Payment Triggers
          </label>
          <div className="space-y-1.5">
            {subscriptions.map((s) => {
              const alert = getSubBadgeStatus(s.nextBillingDate);
              if (!alert || s.status === "cancelled_recommended") return null;

              return (
                <div key={`alert-${s.id}`} className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 rounded-lg p-2.5 border border-amber-200 dark:border-amber-900/60 text-xs flex items-center justify-between gap-2 shadow-3xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{s.name} renewal</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">Due on {s.nextBillingDate}</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-700 dark:text-rose-450 font-mono text-[10px]">
                    -₹{s.cost.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Subscriptions Checklist */}
        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2 tracking-wider">
          Managed Subscription Stack
        </label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {subscriptions.map((s) => {
            const isCancelled = s.status === "cancelled_recommended";
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border duration-100 ${
                  isCancelled ? "bg-rose-50/20 dark:bg-rose-950/10 border-dashed border-rose-200 dark:border-rose-900/40 text-rose-955 dark:text-rose-400" : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850/60 text-slate-800 dark:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${isCancelled ? "line-through text-slate-400 dark:text-slate-550" : "text-slate-800 dark:text-slate-100"}`}>
                      {s.name}
                    </span>
                    {s.status === "cancelled_recommended" && (
                      <span className="text-[9px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-440 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60 font-bold">
                        AI Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-405 font-mono font-bold">
                    ₹{s.cost.toFixed(2)} • {s.billingCycle}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {isCancelled ? (
                    <button
                      onClick={() => onChangeSubStatus(s.id, "active")}
                      className="cursor-pointer text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-250 dark:border-emerald-800 rounded px-2 py-0.5 font-bold shadow-3xs"
                    >
                      Keep Active
                    </button>
                  ) : (
                    <button
                      onClick={() => onChangeSubStatus(s.id, "cancelled_recommended")}
                      className="cursor-pointer text-[10px] bg-rose-50 dark:bg-rose-955/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-250 dark:border-rose-900 rounded px-2 py-0.5 font-bold shadow-3xs"
                    >
                      Cancel Outflow
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 bg-pink-50/40 dark:bg-pink-950/15 p-3.5 rounded-lg flex items-center gap-3">
        <Bell className="w-7 h-7 text-pink-600 dark:text-pink-400 shrink-0" />
        <div>
          <b className="text-slate-850 dark:text-slate-100 text-xs block font-bold">AI Subscription Guard</b>
          <p className="text-[10px] text-pink-950 dark:text-pink-300 font-normal leading-normal">
            We review duplicate license streams using Gemini to flag overlapping services (e.g. Adobe vs Canva).
          </p>
        </div>
      </div>
    </div>
  );
}
