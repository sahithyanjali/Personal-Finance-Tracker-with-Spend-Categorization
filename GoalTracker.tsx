import React, { useState } from "react";
import { SavingsGoal } from "../types";
import { PiggyBank, Target, Calendar, Plus, ChevronRight, Check } from "lucide-react";

interface GoalTrackerProps {
  goals: SavingsGoal[];
  onDepositGoal: (id: string, amount: number) => void;
  onAddGoal: (name: string, target: number, deadline: string) => void;
}

export default function GoalTracker({ goals, onDepositGoal, onAddGoal }: GoalTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("2026-12-31");

  // Helper deposit state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const handleSubmitNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = parseFloat(newGoalTarget);
    if (!newGoalName.trim() || isNaN(tgt) || tgt <= 0) return;

    onAddGoal(newGoalName, tgt, newGoalDeadline);
    setNewGoalName("");
    setNewGoalTarget("");
    setShowAddForm(false);
  };

  const handleApplyDeposit = (id: string) => {
    const amt = parseFloat(depositAmount);
    if (!isNaN(amt) && amt > 0) {
      onDepositGoal(id, amt);
    }
    setDepositGoalId(null);
    setDepositAmount("");
  };

  // Aggregates
  const totalSaved = goals.reduce((sum, g) => sum + g.current, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const overallProgPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div id="goals-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full shadow-xs transition-colors">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase flex items-center gap-1.5">
            <PiggyBank className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Active Savings Goals
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="cursor-pointer text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-850 font-bold transition-all shadow-3xs"
          >
            {showAddForm ? "Cancel Form" : "Create New Goal"}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-light leading-normal">
          Configure capital reserves and track progressive balances. Over {overallProgPercent.toFixed(0)}% of cumulative objectives secured.
        </p>

        {/* Create Goal Form */}
        {showAddForm && (
          <form onSubmit={handleSubmitNewGoal} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded mb-3 space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Budget Target</h4>
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Target Name (e.g. Vacation Fund)"
                required
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  placeholder="Target Sum (₹)"
                  required
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-mono focus:border-indigo-500"
                />
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className="w-full bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-850 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors shadow-xs border border-indigo-700"
              >
                Inject Target Goal
              </button>
            </div>
          </form>
        )}

        {/* Goals Progress Stack */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {goals.map((g) => {
            const isDepositing = depositGoalId === g.id;
            const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;

            return (
              <div key={g.id} className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/80 dark:border-slate-850/60 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[150px]">{g.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-605 dark:text-slate-400 font-mono font-bold">
                      ₹{g.current.toLocaleString()} of ₹{g.target.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress bar visually */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-550"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-350 dark:text-slate-500" /> End: {g.deadline}
                  </span>
                  <span className="font-bold text-slate-705 dark:text-slate-300">{Math.round(progress)}% Secure</span>
                </div>

                {/* Deposit Mini Workflow */}
                {isDepositing ? (
                  <div className="flex items-center gap-1.5 mt-1.5 bg-indigo-50/30 dark:bg-indigo-950/20 p-1.5 rounded border border-indigo-200 dark:border-indigo-805">
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="Amt"
                      autoFocus
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-16 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => handleApplyDeposit(g.id)}
                      className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-3xs"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setDepositGoalId(null)}
                      className="cursor-pointer bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] px-1.5 py-0.5 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setDepositGoalId(g.id);
                      setDepositAmount("");
                    }}
                    className="cursor-pointer text-[10px] bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 rounded border border-slate-220 dark:border-slate-800 shadow-3xs transition-all flex items-center gap-0.5 w-fit"
                  >
                    <Plus className="w-3 h-3" /> Fund Deposit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Aggregate */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono font-bold">
          <span>Overall Savings Stack</span>
          <span className="text-slate-805 dark:text-slate-100 font-bold">₹{totalSaved.toLocaleString()} Saved</span>
        </div>
        <div className="w-full bg-slate-250 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1 relative">
          <div
            className="h-full bg-indigo-600 rounded-full"
            style={{ width: `${Math.min(100, overallProgPercent)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-medium">
          <span>Completion: {overallProgPercent.toFixed(1)}%</span>
          <span>Cumulative Goal Target: ₹{totalTarget.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
