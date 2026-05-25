import React, { useState } from "react";
import { Transaction } from "../types";
import { STANDARD_CATEGORIES, SAMPLE_SMS_LOGS } from "../data";
import { UploadCloud, FileText, Send, Sparkles, Check, RefreshCw, PlusCircle } from "lucide-react";

interface IntakePanelProps {
  onAddTransaction: (txn: Omit<Transaction, "id">) => void;
}

export default function IntakePanel({ onAddTransaction }: IntakePanelProps) {
  const [activeTab, setActiveTab ] = useState<"ai-parse" | "manual" | "file">("ai-parse");

  // AI Parse Tab States
  const [smsText, setSmsText] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any | null>(null);
  const [parsingSource, setParsingSource] = useState<"gemini" | "simulation" | null>(null);

  // Manual Form States
  const [manualAmount, setManualAmount] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualCategory, setManualCategory] = useState(STANDARD_CATEGORIES[0]);
  const [manualMethod, setManualMethod] = useState<'UPI' | 'Credit Card' | 'Cash' | 'Debit Card' | 'Bank Transfer'>("UPI");
  const [manualDate, setManualDate] = useState("2026-05-25");
  const [manualDesc, setManualDesc ] = useState("");
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  // Statement Upload States
  const [isImportingStatement, setIsImportingStatement] = useState(false);
  const [fileImportSuccess, setFileImportSuccess] = useState(false);

  // Parse using API
  const handleAiParse = async (txt: string) => {
    if (!txt.trim()) return;
    setIsAiParsing(true);
    setParsedPreview(null);
    try {
      const res = await fetch("/api/parse-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: txt })
      });
      const json = await res.json();
      if (json.data) {
        setParsedPreview(json.data);
        setParsingSource(json.source);
      }
    } catch (err) {
      console.error("Failed to parse text via AI:", err);
    } finally {
      setIsAiParsing(false);
    }
  };

  // Auto-categorize manual entry based on Merchant & Description
  const handleAutoCategorize = async () => {
    if (!manualMerchant.trim()) return;
    setIsAutoCategorizing(true);
    try {
      const textQuery = `Merchant: "${manualMerchant}". Description: "${manualDesc}".`;
      const res = await fetch("/api/parse-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textQuery })
      });
      const json = await res.json();
      if (json.data && json.data.category) {
        setManualCategory(json.data.category);
      }
    } catch (err) {
      console.error("AI auto category recommendation failed:", err);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  // Submit AI Preview to Ledger
  const handleConfirmAiParsed = () => {
    if (!parsedPreview) return;
    onAddTransaction({
      amount: Number(parsedPreview.amount) || 0,
      merchant: parsedPreview.merchant || "Unknown",
      category: parsedPreview.category || "Other",
      paymentMethod: parsedPreview.paymentMethod || "UPI",
      date: parsedPreview.date || "2026-05-25",
      description: parsedPreview.description || "Ingested via SMS Parsing",
      isApproved: true,
      isRecurring: parsedPreview.category === "Subscriptions",
      status: parsedPreview.amount > 300 ? "flagged" : "completed" // Flags above $300 as anomaly candidate
    });
    setParsedPreview(null);
    setSmsText("");
    setParsingSource(null);
  };

  // Submit Manual Form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0 || !manualMerchant.trim()) return;

    onAddTransaction({
      amount: amt,
      merchant: manualMerchant,
      category: manualCategory,
      paymentMethod: manualMethod,
      date: manualDate,
      description: manualDesc || `Manual spend on ${manualMerchant}`,
      isApproved: true,
      isRecurring: manualCategory === "Subscriptions",
      status: amt > 300 ? "flagged" : "completed"
    });

    // Reset Form
    setManualAmount("");
    setManualMerchant("");
    setManualDesc("");
  };

  // Settle Dummy CSV batch imports
  const handleMockStatementImport = () => {
    setIsImportingStatement(true);
    setFileImportSuccess(false);

    setTimeout(() => {
      // Add a couple of transactions at once
      onAddTransaction({
        amount: 88.00,
        merchant: "Costco Wholesales",
        paymentMethod: "Credit Card",
        category: "Shopping",
        date: "2026-05-21",
        description: "Bulk pantry inventory refill (CSV)",
        isApproved: true,
        isRecurring: false,
        status: "completed"
      });

      onAddTransaction({
        amount: 19.50,
        merchant: "Metropolitan Subway",
        paymentMethod: "Debit Card",
        category: "Travel",
        date: "2026-05-19",
        description: "Weekly metro pass refill (CSV)",
        isApproved: true,
        isRecurring: false,
        status: "completed"
      });

      onAddTransaction({
        amount: 54.99,
        merchant: "Adobe Creative Cloud",
        paymentMethod: "Credit Card",
        category: "Subscriptions",
        date: "2026-05-03",
        description: "Software license subscription (CSV)",
        isApproved: true,
        isRecurring: true,
        status: "completed"
      });

      setIsImportingStatement(false);
      setFileImportSuccess(true);
      setTimeout(() => setFileImportSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div id="intake-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6 shadow-xs transition-colors">
      {/* Panel Headers */}
      <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-150 tracking-wider uppercase">
            Transaction Intake Engine
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Intake daily expense receipts, parse notifications, or import banking logs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded border border-slate-200 dark:border-slate-800 self-start sm:self-center">
          <button
            onClick={() => setActiveTab("ai-parse")}
            className={`cursor-pointer px-2.5 py-1 rounded text-[11px] font-bold duration-150 flex items-center gap-1 ${
              activeTab === "ai-parse" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-3xs" : "text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-155 border border-transparent"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI SMS Parser
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`cursor-pointer px-2.5 py-1 rounded text-[11px] font-bold duration-150 flex items-center gap-1 ${
              activeTab === "manual" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-3xs" : "text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-155 border border-transparent"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Manual Entry
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={`cursor-pointer px-2.5 py-1 rounded text-[11px] font-bold duration-150 flex items-center gap-1 ${
              activeTab === "file" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-3xs" : "text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-155 border border-transparent"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Statement Import
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* TAB 1: AI PARSING ENGINE */}
        {activeTab === "ai-parse" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-light">
                Paste a banking notification SMS, UPI text alerts, or email receipt log. Gemini AI will automatically extract categories and structure it:
              </p>
              
              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {SAMPLE_SMS_LOGS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSmsText(sample.text)}
                    className="text-[10px] bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 cursor-pointer transition-all duration-150"
                  >
                    💡 {sample.label}
                  </button>
                ))}
              </div>

              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Examples: 'Sent Rs. 350 to Starbucks Coffee via GPay on 2026-05-24' or 'Debited USD 14.99 at Netflix Card charge alert...'"
                rows={3}
                id="textarea-sms-input"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-550 resize-none font-sans"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleAiParse(smsText)}
                disabled={isAiParsing || !smsText.trim()}
                id="btn-trigger-ai-parse"
                className="inline-flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded cursor-pointer disabled:opacity-50 duration-150 shadow-xs border border-indigo-700 dark:border-indigo-805"
              >
                {isAiParsing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Engaging Intelligence...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Intake via AI Parse
                  </>
                )}
              </button>
            </div>

            {/* Sub-Workflow: VERIFY & CONFIRM SHEET */}
            {parsedPreview && (
              <div id="ai-parsed-preview-sheet" className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-dashed border-indigo-200 dark:border-indigo-900 rounded p-4 mt-3 text-slate-800 dark:text-slate-105 animate-fadeIn text-xs">
                <div className="flex justify-between items-center mb-3 pb-1 border-b border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Verify & Confirm AI Intake
                    </h3>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${parsingSource === "gemini" ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-850" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"}`}>
                    Source: {parsingSource === "gemini" ? "Gemini AI" : "Local Rules"}
                  </span>
                </div>

                {/* Editable Preview Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Merchant</label>
                    <input
                      type="text"
                      value={parsedPreview.merchant || ""}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, merchant: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={parsedPreview.amount || ""}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, amount: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Date</label>
                    <input
                      type="date"
                      value={parsedPreview.date || ""}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, date: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Suggested Category</label>
                    <select
                      value={parsedPreview.category || "Other"}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, category: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      {STANDARD_CATEGORIES.map((cat, i) => (
                        <option key={i} value={cat} className="dark:bg-slate-950">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Payment Method</label>
                    <select
                      value={parsedPreview.paymentMethod || "UPI"}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, paymentMethod: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="UPI" className="dark:bg-slate-950">UPI</option>
                      <option value="Credit Card" className="dark:bg-slate-950">Credit Card</option>
                      <option value="Debit Card" className="dark:bg-slate-955">Debit Card</option>
                      <option value="Cash" className="dark:bg-slate-950">Cash</option>
                      <option value="Bank Transfer" className="dark:bg-slate-950">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Spend Description</label>
                    <input
                      type="text"
                      value={parsedPreview.description || ""}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, description: e.target.value })}
                      className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                  <button
                    onClick={() => setParsedPreview(null)}
                    className="cursor-pointer bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-2.5 py-1 rounded duration-150"
                  >
                    Discard Alert
                  </button>
                  <button
                    onClick={handleConfirmAiParsed}
                    id="btn-confirm-parse-ledger"
                    className="cursor-pointer bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded flex items-center gap-1 duration-100 shadow-xs"
                  >
                    Confirm & Add to Ledger
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL FORM INTAKE */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Merchant Name *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starbucks, Amazon"
                    value={manualMerchant}
                    onChange={(e) => setManualMerchant(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-550"
                  />
                  <button
                    type="button"
                    onClick={handleAutoCategorize}
                    disabled={isAutoCategorizing || !manualMerchant}
                    title="Auto-Categorize via AI"
                    className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-150 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer"
                  >
                    {isAutoCategorizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="0.00"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-550 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date of Spend</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-550"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Spend Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-indigo-550"
                >
                  {STANDARD_CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat} className="dark:bg-slate-950">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Payment Method</label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                >
                  <option value="UPI" className="dark:bg-slate-950">UPI (Unified Payments)</option>
                  <option value="Credit Card" className="dark:bg-slate-950">Credit Card</option>
                  <option value="Debit Card" className="dark:bg-slate-950">Debit Card</option>
                  <option value="Cash" className="dark:bg-slate-950">Cash (Hand-to-Hand)</option>
                  <option value="Bank Transfer" className="dark:bg-slate-950">Bank Transfer (Wire/NEFT)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Short Note / Description</label>
                <input
                  type="text"
                  placeholder="e.g. dinner with friends"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-550"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                id="btn-add-manual-txn"
                className="cursor-pointer inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded duration-150 shadow-xs border border-indigo-700"
              >
                Intake Transaction
              </button>
            </div>
          </form>
        )}

         {/* TAB 3: FILE IMPORT MOCKUP */}
        {activeTab === "file" && (
          <div className="space-y-4">
            <div className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/20 rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                Paste / Upload CSV or PDF Statements
              </p>
              <p className="text-[11px] text-slate-505 dark:text-slate-405 mt-1 max-w-sm font-light leading-normal">
                In production, you can drop standard mobile banking PDFs (Chime, GPay logs, Chase, HDFC) to parse with Gemini API.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleMockStatementImport}
                  disabled={isImportingStatement}
                  id="btn-trigger-statement-import"
                  className="cursor-pointer inline-flex items-center gap-2 bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-2 rounded border border-slate-200 dark:border-slate-800 transition-all shadow-xs"
                >
                  {isImportingStatement ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Parsing Statement Data...
                    </>
                  ) : (
                    <>
                      Inject Mock Statement log (3 items)
                    </>
                  )}
                </button>
              </div>

              {fileImportSuccess && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 text-[11px] px-2.5 py-1 rounded font-bold">
                  <Check className="w-3.5 h-3.5" /> Solid import! 3 transactions loaded securely.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
