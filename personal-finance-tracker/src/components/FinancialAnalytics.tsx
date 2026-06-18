import React, { useState, useMemo } from "react";
import { Transaction, Budget } from "../types";
import { CATEGORY_THEMES } from "../data";
import { 
  AlertOctagon, 
  TrendingUp, 
  PieChart as PieIcon, 
  Activity, 
  Sparkles, 
  Zap, 
  PlusCircle, 
  BellRing,
  HelpCircle
} from "lucide-react";

interface FinancialAnalyticsProps {
  transactions: Transaction[];
  budgets: Budget[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
}

export default function FinancialAnalytics({
  transactions,
  budgets,
  onAddTransaction
}: FinancialAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"donut" | "trend">("donut");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showSimulateTooltip, setShowSimulateTooltip] = useState(false);

  // 1. Core aggregates
  const approvedTransactions = useMemo(() => {
    return transactions.filter(t => t.status !== "pending");
  }, [transactions]);

  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    approvedTransactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [approvedTransactions]);

  const totalSpent = useMemo(() => {
    return (Object.values(categorySpentMap) as number[]).reduce((sum, val) => sum + val, 0);
  }, [categorySpentMap]);

  // 2. Compute Donut Chart segments
  const donutData = useMemo(() => {
    let currentAngle = 0;
    return budgets.map(b => {
      const spent = categorySpentMap[b.category] || 0;
      const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
      const angle = totalSpent > 0 ? (spent / totalSpent) * 360 : 0;
      
      const segment = {
        category: b.category,
        spent,
        limit: b.limit,
        percentage: pct,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: CATEGORY_THEMES[b.category]?.raw || "#cbd5e1"
      };
      currentAngle += angle;
      return segment;
    }).filter(item => item.spent > 0);
  }, [budgets, categorySpentMap, totalSpent]);

  // 3. Compute Chronological Trend values (Cumulative spends by date)
  const trendData = useMemo(() => {
    const sortedTxs = [...approvedTransactions]
      .filter(t => t.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningSum = 0;
    return sortedTxs.map(t => {
      runningSum += t.amount;
      return {
        date: t.date,
        amount: t.amount,
        cumulative: runningSum,
        merchant: t.merchant,
        category: t.category
      };
    });
  }, [approvedTransactions]);

  // SVG dimensions & helper coordinates
  const getCoordinatesForPercent = (percent: number, radius = 50) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x * radius, y * radius];
  };

  // Generate SVG arcs for Category Donut
  const donutArcs = useMemo(() => {
    const size = 180;
    const center = size / 2;
    const r = 60;
    const rInner = 42;
    let accumulatedPercent = 0;

    return donutData.map((d, index) => {
      const startPct = accumulatedPercent;
      accumulatedPercent += d.percentage / 100;
      const endPct = accumulatedPercent;

      // Calculate path coords
      const startAngleRad = startPct * 2 * Math.PI - Math.PI / 2;
      const endAngleRad = endPct * 2 * Math.PI - Math.PI / 2;

      const x1 = center + r * Math.cos(startAngleRad);
      const y1 = center + r * Math.sin(startAngleRad);
      const x2 = center + r * Math.cos(endAngleRad);
      const y2 = center + r * Math.sin(endAngleRad);

      const x2Inner = center + rInner * Math.cos(endAngleRad);
      const y2Inner = center + rInner * Math.sin(endAngleRad);
      const x1Inner = center + rInner * Math.cos(startAngleRad);
      const y1Inner = center + rInner * Math.sin(startAngleRad);

      const largeArc = d.percentage > 50 ? 1 : 0;

      // Arc path string
      const pathData = `
        M ${x1} ${y1}
        A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x2Inner} ${y2Inner}
        A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}
        Z
      `;

      return {
        ...d,
        pathData,
        centerLabelX: center + ((r + rInner) / 2) * Math.cos((startAngleRad + endAngleRad) / 2),
        centerLabelY: center + ((r + rInner) / 2) * Math.sin((startAngleRad + endAngleRad) / 2)
      };
    });
  }, [donutData]);

  // 4. Alerts and live overspending logic
  const overspendingAlerts = useMemo(() => {
    const alerts: Array<{
      category: string;
      spent: number;
      limit: number;
      excess: number;
      urgency: "critical" | "warning";
      message: string;
    }> = [];

    budgets.forEach(b => {
      const spent = categorySpentMap[b.category] || 0;
      if (spent > b.limit) {
        const excess = spent - b.limit;
        alerts.push({
          category: b.category,
          spent,
          limit: b.limit,
          excess,
          urgency: excess > 50 ? "critical" : "warning",
          message: `Category "${b.category}" has breached its safe buffer! Total outflow stands at ₹${spent.toFixed(2)} vs authorized ₹${b.limit.toFixed(2)}. Stop incremental checkouts.`
        });
      } else if (spent > b.limit * 0.85) {
        alerts.push({
          category: b.category,
          spent,
          limit: b.limit,
          excess: 0,
          urgency: "warning",
          message: `Category "${b.category}" is nearing standard threshold bounds. ₹${(b.limit - spent).toFixed(2)} remaining allowance left.`
        });
      }
    });

    return alerts;
  }, [budgets, categorySpentMap]);

  // Quick interactive sandbox to simulate overspending trigger instantly
  const triggerSimulationOutflow = (category: string, isBigWave = false) => {
    const amount = isBigWave ? 250 : 45;
    const randomMerchants: Record<string, string[]> = {
      "Food & Dining": ["Siddhivinayak Caterers", "Zomato Premium", "Swiggy Instant Gourmet", "Starbucks Reserve"],
      "Utilities": ["Mahanagar Gas Ltd", "Tata Power electricity", "Reliance Jio Fibernet"],
      "Entertainment": ["PVR Cinemas Gold", "Smaaash Arcade Leisure", "BookMyShow Gala Concert"],
      "Subscriptions": ["Canva Pro Bundle", "GitHub Copilot", "Amazon Prime Annual"],
      "Shopping": ["Zara Retail", "Amazon IN Order", "Flipkart Sale Checkout"],
      "Travel": ["Uber Premier Cab", "Ola Outstation Travel", "Petrol Refuel Center"],
      "Housing": ["Society Maintenance Bill", "House Deep Cleaning service", "Plumber Repair Crew"],
      "Health & Fitness": ["Pharmeasy Meds", "Cult.fit Session Pass", "Premium Wheypowder Checkout"],
      "Other": ["Shree Store Miscellaneous", "Atm cash withdrawals"]
    };

    const merchantsList = randomMerchants[category] || ["Local Merchant outlet"];
    const merchant = merchantsList[Math.floor(Math.random() * merchantsList.length)];

    onAddTransaction({
      amount,
      date: new Date().toISOString().split('T')[0],
      merchant,
      paymentMethod: "UPI",
      category,
      description: `Simulated live Sandbox spillover outflow (${isBigWave ? "Big Spike" : "Micro Outflow"})`,
      isApproved: true,
      isRecurring: false,
      status: "completed"
    });
  };

  return (
    <div 
      id="analytics-dashboard" 
      className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors duration-150 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-505/5 dark:bg-indigo-950/20 rounded-full blur-[40px] pointer-events-none" />
      
      {/* 1. Header with metadata and telemetry control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Dynamic Expenditure Insights
            </h2>
            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900 uppercase">
              Interact Beta
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light leading-snug">
            Real-time visual tracking of standard category distribution arrays and chronological credit/debit velocities.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-201 dark:border-slate-850">
          <button
            onClick={() => setActiveTab("donut")}
            className={`cursor-pointer text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === "donut" 
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-3xs" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Category Allocation
          </button>
          <button
            onClick={() => setActiveTab("trend")}
            className={`cursor-pointer text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === "trend" 
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-3xs" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Chronological Velocity
          </button>
        </div>
      </div>

      {/* 2. Visual Chart Canvas Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[220px]">
        {activeTab === "donut" ? (
          <>
            {/* Donut SVG Layout */}
            <div className="md:col-span-5 flex justify-center relative py-2">
              {donutArcs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 dark:text-slate-505 font-mono">No approved transactions recorded for visualization.</p>
                </div>
              ) : (
                <div className="relative">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <g>
                      {donutArcs.map((arc, i) => {
                        const isHovered = hoveredCategory === arc.category;
                        return (
                          <path
                            key={arc.category}
                            d={arc.pathData}
                            fill={arc.color}
                            className="transition-all duration-200 cursor-pointer stroke-white dark:stroke-slate-900"
                            strokeWidth={isHovered ? 2.5 : 1}
                            style={{
                              transform: isHovered ? "scale(1.04)" : "scale(1.0)",
                              transformOrigin: "90px 90px",
                              opacity: hoveredCategory && !isHovered ? 0.35 : 1
                            }}
                            onMouseEnter={() => setHoveredCategory(arc.category)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        );
                      })}
                    </g>
                  </svg>
                  
                  {/* Absolute Center Readout */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 dark:text-slate-505 uppercase font-bold tracking-widest leading-none">
                      Approved Outflow
                    </span>
                    <span className="text-lg font-extrabold text-slate-850 dark:text-slate-100 font-mono mt-0.5 leading-none">
                      ₹{totalSpent.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-emerald-500 dark:text-emerald-450 font-bold mt-1 font-mono">
                      {donutArcs.length} Sectors
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Category legends right panel */}
            <div className="md:col-span-7 space-y-2 max-h-[210px] overflow-y-auto pr-2">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
                <span>Distribution Index</span>
                <span>Spent / Limit</span>
              </div>
              
              {budgets.map(b => {
                const spent = categorySpentMap[b.category] || 0;
                const ratio = spent > 0 ? (spent / b.limit) * 100 : 0;
                const colorHex = CATEGORY_THEMES[b.category]?.raw || "#94a3b8";
                const isHovered = hoveredCategory === b.category;

                return (
                  <div 
                    key={b.category}
                    className={`flex flex-col p-1.5 rounded-lg border transition-all duration-150 ${
                      isHovered 
                        ? "bg-slate-50 dark:bg-slate-950 border-slate-350 dark:border-slate-700" 
                        : "bg-transparent border-transparent"
                    }`}
                    onMouseEnter={() => setHoveredCategory(b.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[170px]">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
                        <span className="font-semibold text-slate-700 dark:text-slate-100 truncate">{b.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] font-bold">
                        <span className="text-slate-800 dark:text-slate-200">₹{spent.toFixed(0)}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500 dark:text-slate-405">₹{b.limit}</span>
                        <span className={`text-[9px] px-1 rounded font-sans ${
                          spent > b.limit ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450" : "text-slate-400"
                        }`}>
                          {ratio.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {/* Compact Interactive Sandbox Outflow Buttons */}
                    {isHovered && (
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-dashed border-slate-205 dark:border-slate-800 animate-fadeIn">
                        <span className="text-[9px] font-medium text-indigo-600 dark:text-indigo-400">Interactive Simulation:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => triggerSimulationOutflow(b.category, false)}
                            className="cursor-pointer text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-750 transition-all flex items-center gap-0.5"
                          >
                            +₹45 Spoil
                          </button>
                          <button
                            onClick={() => triggerSimulationOutflow(b.category, true)}
                            className="cursor-pointer text-[9px] bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-750 dark:text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60 transition-all flex items-center gap-0.5"
                          >
                            +₹250 Spike ⚡
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Cumulative Area Chart Timeline Component */
          <div className="md:col-span-12">
            {trendData.length < 2 ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400 font-mono">Insufficient chronological transaction arrays to project trends. Add multiple expenses.</p>
              </div>
            ) : (
              <div className="w-full">
                {/* SVG Area Chart */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-105 dark:border-slate-850">
                  <div className="h-44 w-full flex items-end relative">
                    
                    {/* SVG Line path generator */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <g>
                        {(() => {
                          const width = 600;
                          const height = 176;
                          const maxCum = Math.max(...trendData.map(d => d.cumulative)) * 1.15 || 1000;
                          
                          // Calculate points mapping
                          const points = trendData.map((d, index) => {
                            const x = (index / (trendData.length - 1)) * width;
                            const y = height - (d.cumulative / maxCum) * (height - 20);
                            return { x, y, ...d };
                          });

                          // Building SVG points path
                          const linePath = points.map(p => `${p.x},${p.y}`).join(" L ");
                          const areaPath = `${points[0].x},${height} L ${linePath} L ${points[points.length - 1].x},${height} Z`;

                          return (
                            <>
                              {/* Ambient Shading Under Curve */}
                              <polygon
                                points={areaPath}
                                fill="url(#indigoGrad)"
                                opacity="0.12"
                              />
                              {/* Stroke curve line */}
                              <path
                                d={`M ${linePath}`}
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              {/* Horizontal guidelines */}
                              <line x1="0" y1={height - 20} x2={width} y2={height - 20} stroke="#94a3b8" strokeDasharray="3 3" opacity="0.15" />
                              <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#94a3b8" strokeDasharray="3 3" opacity="0.15" />

                              {/* Interactive dot anchors */}
                              {points.map((p, idx) => (
                                <g key={idx}>
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="4"
                                    fill="#6366f1"
                                    className="hover:r-6 cursor-crosshair transition-all"
                                    strokeWidth="1.5"
                                    stroke="white"
                                  />
                                </g>
                              ))}

                              {/* Gradient definition for Area chart */}
                              <defs>
                                <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </>
                          );
                        })()}
                      </g>
                    </svg>

                    {/* Left vertical axis text annotation */}
                    <div className="absolute left-2 top-2 text-[9px] text-slate-400 font-mono font-bold bg-white/70 dark:bg-slate-900/70 px-1 rounded">
                      Limit: ₹{Math.max(...trendData.map(d => d.cumulative)).toFixed(0)} Max
                    </div>
                  </div>

                  {/* Horizontal timeline axis tags */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Start: {trendData[0]?.date}</span>
                    <span className="text-slate-500 font-bold font-sans">Accumulating Spent Run Velocity ({trendData.length} records)</span>
                    <span>End: {trendData[trendData.length - 1]?.date}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. LIVE OVERSPENDING MONITOR ALERT FEED SECTION */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
            </div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-205 flex items-center gap-1">
              <BellRing className="w-3.5 h-3.5 text-rose-500" />
              Live Overspending Alarm Ticker
            </h4>
          </div>

          <span className="text-[10px] text-slate-500 font-mono font-bold">
            {overspendingAlerts.length} Active System Advisories
          </span>
        </div>

        {/* Live Messages List */}
        {overspendingAlerts.length === 0 ? (
          <div className="bg-emerald-50/40 dark:bg-emerald-950/15 text-emerald-800 dark:text-emerald-400 rounded-lg p-3 border border-emerald-201 dark:border-emerald-900/40 text-xs flex items-center gap-2.5 animate-fadeIn">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-450 animate-bounce shrink-0" />
            <div>
              <p className="font-bold">All Buffers Green</p>
              <p className="text-[10px] text-emerald-950 dark:text-emerald-305 font-light leading-normal mt-0.5">
                Excellent cost optimization! All structured categories are performing safely below 85% of their designated allowances.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
            {overspendingAlerts.map((alert, idx) => (
              <div 
                key={`${alert.category}-${idx}`} 
                className={`rounded-lg p-3 border text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fadeIn ${
                  alert.urgency === "critical"
                    ? "bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border-rose-201 dark:border-rose-900/60"
                    : "bg-amber-50/70 dark:bg-amber-950/15 text-amber-800 dark:text-amber-440 border-amber-201 dark:border-amber-900/40"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className={`w-4 h-4 shrink-0 mt-0.5 ${alert.urgency === "critical" ? "text-rose-600" : "text-amber-600"}`} />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold uppercase tracking-wide text-[10px] bg-white/70 dark:bg-slate-900/70 px-1.5 py-0.2 rounded border border-slate-201 dark:border-slate-800">
                        {alert.category}
                      </span>
                      <span className={`text-[9px] font-bold uppercase py-0.2 px-1 rounded ${
                        alert.urgency === "critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40"
                      }`}>
                        {alert.urgency === "critical" ? "Breach Alarm" : "Overage Risk"}
                      </span>
                    </div>
                    <p className="font-normal text-slate-850 dark:text-slate-250 leading-relaxed mt-1 text-[11px]">
                      {alert.message}
                    </p>
                  </div>
                </div>

                {/* Simulated action button specifically for fixing the categories */}
                <div className="shrink-0 flex items-center justify-end">
                  <div className="relative group">
                    <button
                      onClick={() => triggerSimulationOutflow(alert.category, false)}
                      className="cursor-pointer bg-white/80 hover:bg-white dark:bg-slate-900 hover:dark:bg-slate-850 duration-100 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-2.5 py-1 text-[10px] font-bold shadow-3xs flex items-center gap-1 transition-all text-right"
                    >
                      <PlusCircle className="w-3 h-3 text-indigo-500" />
                      Add to Alert
                    </button>
                    <div className="absolute right-0 bottom-full mb-1 bg-slate-950 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 duration-150 pointer-events-none w-28 whitespace-normal text-center shadow-md">
                      Simulate another transaction in this category
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
