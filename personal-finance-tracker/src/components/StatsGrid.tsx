import React from "react";
import { FinancialHealth, Transaction } from "../types";
import { ShieldCheck, TrendingDown, DollarSign, Activity, Sparkles, AlertCircle } from "lucide-react";

interface StatsGridProps {
  health: FinancialHealth;
  transactions: Transaction[];
  totalBudget: number;
  aiLoadingInsights: boolean;
  onRefreshInsights: () => void;
  isAiMode: boolean;
}

export default function StatsGrid({
  health,
  transactions,
  totalBudget,
  aiLoadingInsights,
  onRefreshInsights,
  isAiMode
}: StatsGridProps) {
  // Compute Month-to-date stats
  const totalSpent = transactions
    .filter(t => t.status !== "pending") // Ignore pending/unapproved expenses
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetRatio = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Compute pending approvals (Expense Approval workflow)
  const pendingApprovalsCount = transactions.filter(t => !t.isApproved).length;
  const pendingApprovalsAmount = transactions
    .filter(t => !t.isApproved)
    .reduce((sum, t) => sum + t.amount, 0);

  // SVG parameters for radial score loop
  const radius = 45;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (health.score / 100) * circumference;

  // Grade Colors
  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-emerald-400";
    if (grade.startsWith("B")) return "text-teal-400";
    if (grade.startsWith("C")) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreCircleColor = (score: number) => {
    if (score >= 90) return "stroke-emerald-400";
    if (score >= 80) return "stroke-teal-400";
    if (score >= 70) return "stroke-amber-400";
    return "stroke-rose-400";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* 1. FINANCIAL HEALTH SCORE (Radial Visual Loop) */}
      <div id="stat-health-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row gap-5 items-center shadow-xs transition-colors">
        <div className="absolute top-0 right-0 p-3">
          <Activity className="w-5 h-5 text-indigo-300 dark:text-indigo-500" />
        </div>

        {/* Circular indicator */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              className="stroke-slate-100 dark:stroke-slate-800"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius + stroke}
              cy={radius + stroke}
            />
            <circle
              className={`transition-all duration-1000 ease-out ${getScoreCircleColor(health.score)}`}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius + stroke}
              cy={radius + stroke}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-3xl font-extrabold font-mono ${getGradeColor(health.grade)}`}>
              {health.grade}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              Score: {health.score}
            </span>
          </div>
        </div>

        {/* Score Explainer */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
            <h3 className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Financial Health Score
            </h3>
            {isAiMode && (
              <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" /> Gemini AI
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light mb-3">
            {health.statusMessage}
          </p>

          {/* Sub-factor breakdowns */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {health.factors.map((f, i) => (
              <div key={i} className="text-center md:text-left">
                <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate tracking-tight font-bold uppercase">{f.name}</p>
                <div className="flex items-center justify-center md:justify-start gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${f.status === "good" ? "bg-emerald-500" : f.status === "moderate" ? "bg-amber-500" : "bg-rose-500"}`} />
                  <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">{f.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MONTH-TO-DATE SPENDING PANEL */}
      <div id="stat-spend-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs transition-colors">
        <div className="absolute -right-8 -bottom-8 p-6 text-slate-100 dark:text-slate-800/10 opacity-30 pointer-events-none">
          <TrendingDown className="w-28 h-28" />
        </div>

        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Active Spent / Budget
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${
              budgetRatio > 100 
                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40" 
                : budgetRatio > 80 
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" 
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
            }`}>
              {Math.round(budgetRatio)}% Limit
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              ₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              of ₹{totalBudget}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light mb-4">
            Pending approvals are shielded from active spent metrics.
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded overflow-hidden mb-1.5">
            <div
              className={`h-full transition-all duration-700 ease-out ${budgetRatio > 100 ? "bg-rose-500" : budgetRatio > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, budgetRatio)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Remaining: ₹{(totalBudget - totalSpent) < 0 ? 0 : Math.round(totalBudget - totalSpent)}</span>
            <span>Allocated Target</span>
          </div>
        </div>
      </div>

      {/* 3. WORKFLOW WORKLIST (Expense Approvals & Anomalies) */}
      <div id="stat-pending-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs transition-colors">
        <div className="absolute top-0 right-0 p-3">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
        </div>

        <div>
          <h3 className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">
            Active Workflow Queue
          </h3>

          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {pendingApprovalsCount}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              Items Pending Action
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-350 font-light mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Valued at <b className="font-mono text-slate-800 dark:text-slate-200">₹{pendingApprovalsAmount.toFixed(2)}</b> awaiting verify/split policies.</span>
          </div>
        </div>

        {/* Fast Insights Reload */}
        <button
          onClick={onRefreshInsights}
          disabled={aiLoadingInsights}
          id="btn-trigger-ai-refresh"
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded duration-150 disabled:opacity-50 cursor-pointer shadow-xs border border-indigo-750 dark:border-indigo-800"
        >
          {aiLoadingInsights ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Recalculating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Reload Operational Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
