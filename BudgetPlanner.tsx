import React, { useState } from "react";
import { Budget, Transaction } from "../types";
import { CATEGORY_THEMES } from "../data";
import { AlertTriangle, Plus, Target, PiggyBank, RefreshCw, PenSquare } from "lucide-react";

interface BudgetPlannerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onUpdateLimit: (category: string, limit: number) => void;
}

export default function BudgetPlanner({ budgets, transactions, onUpdateLimit }: BudgetPlannerProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState("");

  // Aggregate expenditures by Category
  const categorySpentMap: Record<string, number> = {};
  transactions
    .filter(t => t.status !== "pending") // Ignore unapproved spends
    .forEach((t) => {
      categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + t.amount;
    });

  const handleEditClick = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setTempLimit(currentLimit.toString());
  };

  const handleSaveClick = (category: string) => {
    const lim = parseFloat(tempLimit);
    if (!isNaN(lim) && lim >= 0) {
      onUpdateLimit(category, lim);
    }
    setEditingCategory(null);
  };

  return (
    <div id="budget-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full shadow-xs transition-colors">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-405" />
            Core Budget Limits
          </h2>
          <span className="text-[9px] uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-850">
            Active Sub-budgets
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-light leading-normal">
          Manage monthly spending boundaries for specific categories to automate savings alerts.
        </p>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {budgets.map((b) => {
            const spent = categorySpentMap[b.category] || 0;
            const targetColor = CATEGORY_THEMES[b.category]?.text || "text-slate-500";
            const spentPercent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            const isOver = spent > b.limit;
            const isEditing = editingCategory === b.category;

            return (
              <div key={b.category} className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg border border-slate-200/80 dark:border-slate-850/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${targetColor}`}>
                    {b.category}
                  </span>

                  {/* Limit Editor */}
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">₹</span>
                        <input
                          type="number"
                          value={tempLimit}
                          onChange={(e) => setTempLimit(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveClick(b.category)}
                          className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-3xs"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">Limit:</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">₹{b.limit}</span>
                        <button
                          onClick={() => handleEditClick(b.category, b.limit)}
                          className="p-1 text-slate-400 hover:text-slate-705 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-805 transition-colors"
                        >
                          <PenSquare className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-baseline justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="font-mono text-[10px]">
                    Spent: <b className="text-slate-800 dark:text-slate-100 font-bold">₹{spent.toFixed(2)}</b>
                  </div>
                  <div className="font-mono text-right text-[10px]">
                    {spentPercent.toFixed(0)}% Utilized
                  </div>
                </div>

                {/* Bar Chart Representation */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-550 rounded-full ${
                      isOver ? "bg-rose-600 animate-pulse" : spentPercent > 80 ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${Math.min(100, spentPercent)}%` }}
                  />
                </div>

                {/* Budget overflow triggers */}
                {isOver && (
                  <p className="text-[10px] text-rose-700 dark:text-rose-400 flex items-center gap-1 leading-none font-bold mt-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Budget breached by (₹{(spent - b.limit).toFixed(2)})!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Aggregate Saving Indicators */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/25 p-3.5 rounded-lg flex items-center gap-3">
        <PiggyBank className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <div>
          <b className="text-slate-850 dark:text-slate-100 text-xs block font-bold">Goal Planning Policy</b>
          <p className="text-[10px] text-indigo-955 dark:text-indigo-305 font-normal leading-normal">
            Adjusting a single index to be tighter yields an average of 14% increment in seasonal net margins. Use Gemini recommendations to audit.
          </p>
        </div>
      </div>
    </div>
  );
}
