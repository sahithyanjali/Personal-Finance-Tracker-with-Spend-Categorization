import { Transaction, Budget, SavingsGoal, Subscription, FinancialInsight } from "./types";

export const STANDARD_CATEGORIES = [
  "Food & Dining",
  "Utilities",
  "Entertainment",
  "Subscriptions",
  "Shopping",
  "Travel",
  "Health & Fitness",
  "Housing",
  "Other"
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "bg-emerald-500 text-emerald-50 border-emerald-500",
  "Utilities": "bg-blue-500 text-blue-50 border-blue-500",
  "Entertainment": "bg-purple-500 text-purple-50 border-purple-500",
  "Subscriptions": "bg-pink-500 text-pink-50 border-pink-500",
  "Shopping": "bg-amber-500 text-amber-50 border-amber-500",
  "Travel": "bg-indigo-500 text-indigo-50 border-indigo-500",
  "Health & Fitness": "bg-teal-500 text-teal-50 border-teal-500",
  "Housing": "bg-slate-500 text-slate-50 border-slate-500",
  "Other": "bg-gray-500 text-gray-50 border-gray-500"
};

// Pastel colors for visual progression charts
export const CATEGORY_THEMES: Record<string, { color: string; hover: string; text: string; raw: string }> = {
  "Food & Dining": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", hover: "hover:bg-emerald-100", text: "text-emerald-700", raw: "#10b981" },
  "Utilities": { color: "bg-blue-50 text-blue-700 border-blue-200", hover: "hover:bg-blue-100", text: "text-blue-700", raw: "#3b82f6" },
  "Entertainment": { color: "bg-purple-50 text-purple-700 border-purple-200", hover: "hover:bg-purple-100", text: "text-purple-700", raw: "#a855f7" },
  "Subscriptions": { color: "bg-pink-50 text-pink-700 border-pink-200", hover: "hover:bg-pink-100", text: "text-pink-700", raw: "#ec4899" },
  "Shopping": { color: "bg-amber-50 text-amber-800 border-amber-200", hover: "hover:bg-amber-100", text: "text-amber-800", raw: "#f59e0b" },
  "Travel": { color: "bg-indigo-50 text-indigo-700 border-indigo-200", hover: "hover:bg-indigo-100", text: "text-indigo-700", raw: "#6366f1" },
  "Health & Fitness": { color: "bg-teal-50 text-teal-700 border-teal-200", hover: "hover:bg-teal-100", text: "text-teal-700", raw: "#14b8a6" },
  "Housing": { color: "bg-slate-50 text-slate-755 border-slate-200", hover: "hover:bg-slate-100", text: "text-slate-700", raw: "#64748b" },
  "Other": { color: "bg-gray-50 text-gray-700 border-gray-200", hover: "hover:bg-gray-100", text: "text-gray-700", raw: "#94a3b8" }
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    amount: 12.99,
    date: "2026-05-24",
    merchant: "Spotify Premium",
    paymentMethod: "Credit Card",
    category: "Subscriptions",
    description: "Spotify Premium Family plan auto-renewal",
    isApproved: true,
    isRecurring: true,
    status: "completed"
  },
  {
    id: "tx-2",
    amount: 64.50,
    date: "2026-05-23",
    merchant: "Whole Foods Market",
    paymentMethod: "Debit Card",
    category: "Food & Dining",
    description: "Weekly organic groceries list",
    isApproved: true,
    isRecurring: false,
    status: "completed"
  },
  {
    id: "tx-3",
    amount: 350.00,
    date: "2026-05-22",
    merchant: "Best Buy Electronics",
    paymentMethod: "Credit Card",
    category: "Shopping",
    description: "4K computer monitor upgrade - home office",
    isApproved: false, // Pending Approval Simulation
    isRecurring: false,
    status: "flagged" // Marked as SPENDING ANOMALY
  },
  {
    id: "tx-4",
    amount: 14.99,
    date: "2026-05-20",
    merchant: "Netflix",
    paymentMethod: "Credit Card",
    category: "Subscriptions",
    description: "Netflix 4K Streaming monthly fee",
    isApproved: true,
    isRecurring: true,
    status: "completed"
  },
  {
    id: "tx-5",
    amount: 120.00,
    date: "2026-05-18",
    merchant: "Pacific Power & Light",
    paymentMethod: "Bank Transfer",
    category: "Utilities",
    description: "Electricity bill for April cycle",
    isApproved: true,
    isRecurring: false,
    status: "completed"
  },
  {
    id: "tx-6",
    amount: 32.40,
    date: "2026-05-17",
    merchant: "Starbucks Cafe",
    paymentMethod: "UPI",
    category: "Food & Dining",
    description: "Coffee and sandwich order with client team",
    isApproved: true,
    isRecurring: false,
    status: "completed"
  },
  {
    id: "tx-7",
    amount: 15.00,
    date: "2026-05-15",
    merchant: "Uber Taxi",
    paymentMethod: "UPI",
    category: "Travel",
    description: "Commute back from tech hub",
    isApproved: true,
    isRecurring: false,
    status: "completed"
  },
  {
    id: "tx-8",
    amount: 1200.00,
    date: "2026-05-01",
    merchant: "Metro Residences",
    paymentMethod: "Bank Transfer",
    category: "Housing",
    description: "Monthly apartment rent payment",
    isApproved: true,
    isRecurring: true,
    status: "completed"
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: "Food & Dining", limit: 300 },
  { category: "Utilities", limit: 200 },
  { category: "Entertainment", limit: 150 },
  { category: "Subscriptions", limit: 100 },
  { category: "Shopping", limit: 400 },
  { category: "Travel", limit: 200 },
  { category: "Housing", limit: 1300 },
  { category: "Health & Fitness", limit: 100 },
];

export const INITIAL_GOALS: SavingsGoal[] = [
  {
    id: "g-1",
    name: "Emergency Cush Fund",
    target: 5000,
    current: 3100,
    deadline: "2026-12-31"
  },
  {
    id: "g-2",
    name: "Summer Tokyo Trip",
    target: 3000,
    current: 1250,
    deadline: "2026-08-15"
  },
  {
    id: "g-3",
    name: "Next M4 MacBook Pro",
    target: 2000,
    current: 600,
    deadline: "2026-10-30"
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    name: "Spotify Premium",
    cost: 12.99,
    billingCycle: "monthly",
    nextBillingDate: "2026-06-24",
    status: "active"
  },
  {
    id: "sub-2",
    name: "Netflix Premium",
    cost: 14.99,
    billingCycle: "monthly",
    nextBillingDate: "2026-06-20",
    status: "active"
  },
  {
    id: "sub-3",
    name: "AWS Hosting",
    cost: 45.10,
    billingCycle: "monthly",
    nextBillingDate: "2026-05-28", // Upcoming soon!
    status: "active"
  },
  {
    id: "sub-4",
    name: "Adobe Creative Cloud",
    cost: 54.99,
    billingCycle: "monthly",
    nextBillingDate: "2026-06-03",
    status: "cancelled_recommended" // Flagged for cancellation
  },
  {
    id: "sub-5",
    name: "Premium Gym Pass",
    cost: 80.00,
    billingCycle: "monthly",
    nextBillingDate: "2026-06-01",
    status: "active"
  }
];

// Realistic test scripts that highlight different Pega Blueprint Workflows
export const SAMPLE_SMS_LOGS = [
  {
    label: "Starbucks UPI (Food)",
    text: "UPI Debit: INR 350.00 transferred to STARBUCKS COFFEE on 2026-05-24. Ref id: UPI9401284."
  },
  {
    label: "Netflix Subscription (Sub)",
    text: "Urgent Payment: ₹14.99 debited at NETFLIX STREAMING SERVICES via Card. Next renewal scheduled."
  },
  {
    label: "Huge Shopping Anomaly (Shopping)",
    text: "Alert: Credit Card swiped for ₹450.00 at BEST BUY ELECTRONICS. Is this you? Confirm transaction."
  },
  {
    label: "Seattle Power Bill (Utilities)",
    text: "Seattle Power: Utility bill payment debited of ₹120.00 for billing cycle May-2026. Code UT-04."
  },
  {
    label: "Monthly House Rent (Housing)",
    text: "Rent cleared: Bank transfer of INR 1,200.00 to LANDLORD METRO CORP towards rental agreement 48B."
  },
  {
    label: "Gym Membership (Health)",
    text: "Gym Renewal: Handed over cash of ₹80.00 at FITZONE DOWNTOWN gym."
  }
];
