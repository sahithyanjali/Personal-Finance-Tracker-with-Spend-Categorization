/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Transaction, Budget, SavingsGoal, Subscription, FinancialInsight, FinancialHealth } from "./types";
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_SUBSCRIPTIONS
} from "./data";

// Component Imports
import StatsGrid from "./components/StatsGrid";
import IntakePanel from "./components/IntakePanel";
import TransactionList from "./components/TransactionList";
import BudgetPlanner from "./components/BudgetPlanner";
import SubscriptionTracker from "./components/SubscriptionTracker";
import GoalTracker from "./components/GoalTracker";
import InsightsPanel from "./components/InsightsPanel";
import FinancialAnalytics from "./components/FinancialAnalytics";

// Icons and visuals
import { Sparkles, Terminal, BookOpen, Layers, ShieldCheck, Heart, User, Milestone, Sun, Moon } from "lucide-react";

export default function App() {
  // --- Theme Toggle state persistent ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("pega_finance_theme");
    return saved === "dark";
  });

  // --- Persistent React States ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("pega_finance_transactions");
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem("pega_finance_budgets");
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem("pega_finance_goals");
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem("pega_finance_subscriptions");
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS;
  });

  // Insights list & Health Score
  const [health, setHealth] = useState<FinancialHealth>({
    score: 82,
    grade: "B+",
    statusMessage: "Loading financial wellness index metrics...",
    factors: [
      { name: "Budget Discipline", score: 85, status: "good" },
      { name: "Subscription Efficiency", score: 70, status: "moderate" },
      { name: "Savings Intent", score: 90, status: "good" }
    ]
  });

  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("pega_finance_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("pega_finance_budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("pega_finance_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("pega_finance_subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions]);

  // Sync theme with body class
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("pega_finance_theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("pega_finance_theme", "light");
    }
  }, [isDarkMode]);

  // Fetch smart insights from Gemini API (or rules fallback)
  const fetchSmartInsights = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, budgets, goals, subscriptions })
      });
      const json = await res.json();
      if (json.data) {
        setHealth({
          score: json.data.healthScore,
          grade: json.data.healthGrade,
          statusMessage: json.data.healthMessage,
          factors: json.data.healthFactors
        });
        setInsights(json.data.insights);
        setIsAiMode(json.source === "gemini");
      }
    } catch (err) {
      console.error("Failed to generate system insights:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Run on mount and state changes
  useEffect(() => {
    fetchSmartInsights();
  }, [transactions, budgets, goals, subscriptions]);

  // Compute total budget limit
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

  // --- ACTIONS HANDLERS ---

  // 1. Transaction creation
  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    const id = `tx-${Date.now()}`;
    const tx: Transaction = {
      ...newTx,
      id
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  // 2. Expense Approvals workflow (Verify Claim)
  const handleApproveTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isApproved: true } : t))
    );
  };

  // 3. Expense Approvals workflow (Reject Claim)
  const handleRejectTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 4. Anomaly review workflow (Settle deviation warning)
  const handleResolveAnomaly = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed" as const } : t))
    );
  };

  // 5. Delete entry
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 6. Adjust budget bounds
  const handleUpdateLimit = (category: string, newLimit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit: newLimit } : b))
    );
  };

  // 7. Manage subscription licensing statuses
  const handleChangeSubStatus = (id: string, status: 'active' | 'cancelled_recommended' | 'kept') => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    // Sync subscription status helper into transaction list recurring field
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.merchant.toLowerCase() === sub.name.toLowerCase()) {
            return { ...t, isRecurring: status === "active" };
          }
          return t;
        })
      );
    }
  };

  // 8. Add savings fund deposits
  const handleDepositGoal = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updatedCurrent = g.current + amount;
          return { ...g, current: Math.min(g.target, updatedCurrent) };
        }
        return g;
      })
    );
  };

  // 9. Create capital targets
  const handleAddGoal = (name: string, target: number, deadline: string) => {
    const id = `g-${Date.now()}`;
    const newGoal: SavingsGoal = {
      id,
      name,
      target,
      current: 0,
      deadline
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  return (
    <div className={`min-h-screen bg-[#f1f5f9] dark:bg-[#0b0f19] text-[#1e293b] dark:text-slate-100 selection:bg-indigo-500/20 dark:selection:bg-indigo-500/30 selection:text-indigo-900 pb-16 transition-colors duration-150 ${isDarkMode ? "dark" : ""}`}>
      {/* Visual background ambient gradient meshes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Modern Dashboard Header */}
      <header className="border-b border-slate-205 dark:border-slate-800 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 sticky top-0 z-40 py-3.5 px-6 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-extrabold shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans uppercase">
                  Pega Finance Hub
                </h1>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900 uppercase">
                  BP-1892784
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold rounded uppercase">
                  Live Status
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light">
                AI-Powered Spend Categorization & Smart Budgeting Engine
              </p>
            </div>
          </div>

          {/* Sync & Active capabilities info */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="theme-toggle-btn"
              onClick={() => setIsDarkMode(prev => !prev)}
              aria-label="Toggle user interface visual theme"
              className="group cursor-pointer p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs shrink-0"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-sans px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono shadow-xs">
              <span className={`w-2 h-2 rounded-full ${isAiMode ? "bg-emerald-500 animate-pulse" : "bg-teal-500"}`} />
              <span>{isAiMode ? "Gemini AI Online" : "Rule Engine Stable"}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-300 font-sans px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono shadow-xs">
              <span>Time: 2026-05-25</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 pt-6">
        
        {/* Section 1: Dashboard high-level statistics indicators */}
        <StatsGrid
          health={health}
          transactions={transactions}
          totalBudget={totalBudget}
          aiLoadingInsights={aiLoading}
          onRefreshInsights={fetchSmartInsights}
          isAiMode={isAiMode}
        />

        {/* Section 1.5: SVG Analytics Charts & Real-Time Security Warning Feeds */}
        <div className="mb-8 mt-2">
          <FinancialAnalytics
            transactions={transactions}
            budgets={budgets}
            onAddTransaction={handleAddTransaction}
          />
        </div>

        {/* Section 2: Splitting major features into responsive columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT CONTAINER LAYER: Ingestion and Audit Ledger (Width: 7 / 12) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* module 1: Ingestion Intake Flow panel */}
            <IntakePanel onAddTransaction={handleAddTransaction} />

            {/* module 2: Structured Ledger panel */}
            <TransactionList
              transactions={transactions}
              onApproveTransaction={handleApproveTransaction}
              onRejectTransaction={handleRejectTransaction}
              onResolveAnomaly={handleResolveAnomaly}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>

          {/* RIGHT CONTAINER LAYER: Wealth Recommendations and Side Budgets (Width: 5 / 12) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* module 3: Smart Insights panel */}
            <InsightsPanel
              insights={insights}
              transactions={transactions}
              onResolveAnomaly={handleResolveAnomaly}
              isAiMode={isAiMode}
            />

            {/* module 4: Dynamic Budget Progressions & Recurring licensing */}
            <div className="grid grid-cols-1 gap-8">
              <BudgetPlanner
                budgets={budgets}
                transactions={transactions}
                onUpdateLimit={handleUpdateLimit}
              />

              <SubscriptionTracker
                subscriptions={subscriptions}
                onChangeSubStatus={handleChangeSubStatus}
              />
            </div>

            {/* module 5: Capital savings goals planning */}
            <GoalTracker
              goals={goals}
              onDepositGoal={handleDepositGoal}
              onAddGoal={handleAddGoal}
            />
          </div>
        </div>

        {/* Modular Footnotes */}
        <footer className="mt-16 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex justify-center items-center gap-1.5 mb-1 text-xs">
            <Layers className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pega Workflow Design • System of Record (Pega Local)</span>
          </div>
          <p>© 2026 Pega Systems Inc. Supported by Gemini 3.5 AI Core.</p>
        </footer>
      </main>
    </div>
  );
}
