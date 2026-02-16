export type ExpenseType = 'daily' | 'fixed' | 'loan';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  tags: string[];
  notes: string;
  date: string;
  createdAt: string;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  expenseType: ExpenseType;
}

export interface LoanEntry {
  id: string;
  name: string;
  amount: number;
  notes: string;
  date: string;
  createdAt: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface FixedExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  entries: FixedExpenseEntry[];
  createdAt: string;
}

export interface FixedExpenseEntry {
  id: string;
  date: string;
  amount: number;
}

export interface MessPurchase {
  id: string;
  name: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  notes: string;
  date: string;
  createdAt: string;
}

export interface BudgetHistory {
  id: string;
  amount: number;
  date: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export interface SavedCard {
  id: string;
  cardName: string;
  cardNumber: string;
  expiryDate: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'other';
  isDefault: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'expense_added' | 'expense_edited' | 'expense_deleted' | 'budget_updated' | 'card_added' | 'card_deleted' | 'goal_added' | 'goal_updated' | 'loan_added' | 'loan_updated' | 'fixed_added' | 'fixed_deleted' | 'mess_added' | 'mess_deleted';
  description: string;
  date: string;
  amount?: number;
}

export interface UserProfile {
  name: string;
  currency: string;
  monthlyBudget: number;
  dailyBudgetTarget: number;
}

export const CATEGORIES = [
  { name: 'Food', icon: 'restaurant-outline' as const, color: '#FF6B6B' },
  { name: 'Transport', icon: 'car-outline' as const, color: '#4ECDC4' },
  { name: 'Shopping', icon: 'bag-outline' as const, color: '#45B7D1' },
  { name: 'Entertainment', icon: 'film-outline' as const, color: '#96CEB4' },
  { name: 'Health', icon: 'heart-outline' as const, color: '#FFEAA7' },
  { name: 'Housing', icon: 'home-outline' as const, color: '#DDA0DD' },
  { name: 'Utilities', icon: 'flash-outline' as const, color: '#98D8C8' },
  { name: 'Education', icon: 'book-outline' as const, color: '#F7DC6F' },
  { name: 'Subscriptions', icon: 'card-outline' as const, color: '#BB8FCE' },
  { name: 'Other', icon: 'ellipsis-horizontal-outline' as const, color: '#AEB6BF' },
];

export const FIXED_CATEGORIES = [
  { name: 'Rent', icon: 'home-outline' as const, color: '#DDA0DD' },
  { name: 'Utilities', icon: 'flash-outline' as const, color: '#98D8C8' },
  { name: 'Subscriptions', icon: 'card-outline' as const, color: '#BB8FCE' },
  { name: 'Insurance', icon: 'shield-outline' as const, color: '#4ECDC4' },
  { name: 'Internet', icon: 'wifi-outline' as const, color: '#45B7D1' },
  { name: 'Phone', icon: 'call-outline' as const, color: '#96CEB4' },
  { name: 'Other', icon: 'ellipsis-horizontal-outline' as const, color: '#AEB6BF' },
];

export const CURRENCY_OPTIONS = ['৳', '$', '€', '£', '¥', '₹', '₿'];
