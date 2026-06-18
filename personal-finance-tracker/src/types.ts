export interface Transaction {
  id: string;
  amount: number;
  date: string;
  merchant: string;
  paymentMethod: 'UPI' | 'Credit Card' | 'Cash' | 'Debit Card' | 'Bank Transfer';
  category: string;
  description: string;
  isApproved: boolean; // Simulating "Expense Approval" workflow
  isRecurring: boolean; // Simulating "Recurring Payment Alert" / "Subscription"
  status: 'completed' | 'pending' | 'flagged'; // Simulating "Spending Anomaly Review"
}

export interface Budget {
  category: string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  status: 'active' | 'cancelled_recommended' | 'kept';
}

export interface FinancialInsight {
  id: string;
  type: 'warning' | 'tip' | 'success' | 'info';
  title: string;
  description: string;
}

export interface FinancialHealth {
  score: number;
  grade: string;
  statusMessage: string;
  factors: {
    name: string;
    score: number; // 0 to 100
    status: 'good' | 'moderate' | 'poor';
  }[];
}
