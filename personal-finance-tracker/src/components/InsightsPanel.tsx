import React from "react";
import { FinancialInsight, Transaction } from "../types";
import { Sparkles, AlertTriangle, Lightbulb, CheckCircle, ShieldAlert, TrendingUp, HelpCircle, AlertCircle } from "lucide-react";

interface InsightsPanelProps {
  insights: FinancialInsight[];
  transactions: Transaction[];
  onResolveAnomaly: (id: string) => void;
  isAiMode: boolean;
}

export default function InsightsPanel({
  insights,
  transactions,
  onResolveAnomaly,
  isAiMode
}: InsightsPanelProps) {
  
  // Find anomalous flagged items for outstanding anomaly auditor cards
  const anomalies = transactions.filter((t) => t.status === "flagged");

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />;
      case "tip":
        return <Lightbulb className="w-4.5 h-4.5 text-emerald-600 shrink-0" />;
      case "success":
        return <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />;
      default:
        return <HelpCircle className="w-4.5 h-4.5 text-indigo-600 shrink-0" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 text-rose-905 dark:text-rose-300";
      case "tip":
        return "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-900/40 text-emerald-955 dark:text-emerald-300";
      case "success":
        return "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-255 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-300";
      default:
        return "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-300";
    }
  };

  return (
    <div id="insights-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-full flex flex-col justify-between shadow-xs transition-colors">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-650 dark:text-indigo-400 animate-pulse" />
            AI Wealth Insights
          </h2>
          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${isAiMode ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900" : "bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-205 dark:border-slate-800"}`}>
            {isAiMode ? "Gemini AI Live" : "Heuristic Rules"}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-light leading-normal">
          Contextual analysis of spend velocity, recurring licenses, and savings trajectories compiled by financial models.
        </p>

        {/* 1. ANOMALY DETECTOR AUDITOR CARD (Spending Anomaly Review workflow) */}
        {anomalies.length > 0 && (
          <div className="mb-4 p-3.5 bg-rose-50/40 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/40 rounded-lg space-y-2.5">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-450 shrink-0" />
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Anomaly Audit Checklist
              </h3>
            </div>
            <p className="text-[10px] text-rose-950 dark:text-rose-300 font-normal leading-normal">
              The following transaction deviates substantially from typical monthly indices. Verify policies to suppress alert.
            </p>

            <div className="space-y-1.5">
              {anomalies.map((anom) => (
                <div key={`anom-${anom.id}`} className="bg-white dark:bg-slate-950 rounded border border-rose-200/60 dark:border-rose-900/30 p-2.5 flex items-center justify-between gap-2.5 flex-wrap shadow-3xs">
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs">{anom.merchant}</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-405 font-medium">
                      Amount: <b className="font-mono text-rose-70s dark:text-rose-400 font-bold">₹{anom.amount.toFixed(2)}</b> • Date: {anom.date}
                    </p>
                  </div>
                  <button
                    onClick={() => onResolveAnomaly(anom.id)}
                    className="cursor-pointer bg-rose-50 dark:bg-rose-950/40 text-rose-705 dark:text-rose-400 hover:bg-rose-105 border border-rose-250 dark:border-rose-800 rounded px-2 py-0.5 text-[10px] font-bold shadow-3xs"
                  >
                    Resolve Flag
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. MAIN RECOMMENDATION LOOP */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`flex gap-3 p-3 rounded-lg border text-xs leading-normal shadow-3xs transition-all duration-150 ${getInsightBg(
                ins.type
              )}`}
            >
              {getInsightIcon(ins.type)}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-0.5">{ins.title}</h4>
                <p className="text-slate-650 dark:text-slate-350 font-normal leading-relaxed">{ins.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aggregate Growth projections */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-650 dark:text-indigo-400" /> Model Sync Accuracy
        </span>
        <span className="text-slate-800 dark:text-slate-200">99.4% Verified</span>
      </div>
    </div>
  );
}
