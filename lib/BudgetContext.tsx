import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { Expense, SavingsGoal, SavedCard, ActivityItem, UserProfile, LoanEntry, FixedExpense, FixedExpenseTemplate, MessPurchase } from './types';
import * as Storage from './storage';

interface BudgetContextValue {
  expenses: Expense[];
  loans: LoanEntry[];
  fixedExpenses: FixedExpense[];
  fixedTemplates: FixedExpenseTemplate[];
  messPurchases: MessPurchase[];
  profile: UserProfile;
  savingsGoals: SavingsGoal[];
  savedCards: SavedCard[];
  activityLog: ActivityItem[];
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addLoan: (loan: Omit<LoanEntry, 'id' | 'createdAt' | 'isPaid'>) => Promise<void>;
  updateLoan: (id: string, updates: Partial<LoanEntry>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  addFixedExpense: (expense: Omit<FixedExpense, 'id' | 'createdAt'>) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  addFixedTemplate: (name: string, amount: number) => Promise<void>;
  addFixedTemplateEntry: (templateId: string) => Promise<void>;
  removeFixedTemplateEntry: (templateId: string, entryId: string) => Promise<void>;
  deleteFixedTemplate: (id: string) => Promise<void>;
  addMessPurchase: (purchase: Omit<MessPurchase, 'id' | 'createdAt'>) => Promise<void>;
  deleteMessPurchase: (id: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addSavedCard: (card: Omit<SavedCard, 'id'>) => Promise<void>;
  deleteSavedCard: (id: string) => Promise<void>;
  todayExpenses: Expense[];
  monthExpenses: Expense[];
  todayTotal: number;
  monthTotal: number;
  remainingBudget: number;
  remainingDailyBudget: number;
  monthFixedTotal: number;
  totalLoansOutstanding: number;
  monthMessTotal: number;
  exportAllData: () => Promise<string>;
  importAllData: (jsonString: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [fixedTemplates, setFixedTemplates] = useState<FixedExpenseTemplate[]>([]);
  const [messPurchases, setMessPurchases] = useState<MessPurchase[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: 'User', currency: '৳', monthlyBudget: 0, dailyBudgetTarget: 0 });
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [exp, prof, goals, cards, log, lns, fixed, templates, mess] = await Promise.all([
      Storage.getExpenses(),
      Storage.getUserProfile(),
      Storage.getSavingsGoals(),
      Storage.getSavedCards(),
      Storage.getActivityLog(),
      Storage.getLoans(),
      Storage.getFixedExpenses(),
      Storage.getFixedTemplates(),
      Storage.getMessPurchases(),
    ]);
    setExpenses(exp);
    setProfile(prof);
    setSavingsGoals(goals);
    setSavedCards(cards);
    setActivityLog(log);
    setLoans(lns);
    setFixedExpenses(fixed);
    setFixedTemplates(templates);
    setMessPurchases(mess);
    setIsLoading(false);
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    await Storage.addExpense(expense);
    await refreshAll();
  }, [refreshAll]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    await Storage.updateExpense(id, updates);
    await refreshAll();
  }, [refreshAll]);

  const deleteExpense = useCallback(async (id: string) => {
    await Storage.deleteExpense(id);
    await refreshAll();
  }, [refreshAll]);

  const addLoan = useCallback(async (loan: Omit<LoanEntry, 'id' | 'createdAt' | 'isPaid'>) => {
    await Storage.addLoan(loan);
    await refreshAll();
  }, [refreshAll]);

  const updateLoan = useCallback(async (id: string, updates: Partial<LoanEntry>) => {
    await Storage.updateLoan(id, updates);
    await refreshAll();
  }, [refreshAll]);

  const deleteLoan = useCallback(async (id: string) => {
    await Storage.deleteLoan(id);
    await refreshAll();
  }, [refreshAll]);

  const addFixedExpense = useCallback(async (expense: Omit<FixedExpense, 'id' | 'createdAt'>) => {
    await Storage.addFixedExpense(expense);
    await refreshAll();
  }, [refreshAll]);

  const deleteFixedExpense = useCallback(async (id: string) => {
    await Storage.deleteFixedExpense(id);
    await refreshAll();
  }, [refreshAll]);

  const addFixedTemplate = useCallback(async (name: string, amount: number) => {
    await Storage.addFixedTemplate(name, amount);
    await refreshAll();
  }, [refreshAll]);

  const addFixedTemplateEntry = useCallback(async (templateId: string) => {
    await Storage.addFixedTemplateEntry(templateId);
    await refreshAll();
  }, [refreshAll]);

  const removeFixedTemplateEntry = useCallback(async (templateId: string, entryId: string) => {
    await Storage.removeFixedTemplateEntry(templateId, entryId);
    await refreshAll();
  }, [refreshAll]);

  const deleteFixedTemplate = useCallback(async (id: string) => {
    await Storage.deleteFixedTemplate(id);
    await refreshAll();
  }, [refreshAll]);

  const addMessPurchase = useCallback(async (purchase: Omit<MessPurchase, 'id' | 'createdAt'>) => {
    await Storage.addMessPurchase(purchase);
    await refreshAll();
  }, [refreshAll]);

  const deleteMessPurchase = useCallback(async (id: string) => {
    await Storage.deleteMessPurchase(id);
    await refreshAll();
  }, [refreshAll]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    await Storage.updateUserProfile(updates);
    const updated = await Storage.getUserProfile();
    setProfile(updated);
  }, []);

  const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    await Storage.addSavingsGoal(goal);
    await refreshAll();
  }, [refreshAll]);

  const updateSavingsGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    await Storage.updateSavingsGoal(id, updates);
    await refreshAll();
  }, [refreshAll]);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    await Storage.deleteSavingsGoal(id);
    await refreshAll();
  }, [refreshAll]);

  const addSavedCard = useCallback(async (card: Omit<SavedCard, 'id'>) => {
    await Storage.addSavedCard(card);
    await refreshAll();
  }, [refreshAll]);

  const deleteSavedCard = useCallback(async (id: string) => {
    await Storage.deleteSavedCard(id);
    await refreshAll();
  }, [refreshAll]);

  const exportAllData = useCallback(async () => {
    return Storage.exportAllData();
  }, []);

  const importAllData = useCallback(async (jsonString: string) => {
    await Storage.importAllData(jsonString);
    await refreshAll();
  }, [refreshAll]);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const dailyExpenses = useMemo(() => expenses.filter(e => (e.expenseType || 'daily') === 'daily'), [expenses]);
  const todayExpenses = useMemo(() => dailyExpenses.filter(e => e.date.startsWith(today)), [dailyExpenses, today]);
  const monthExpenses = useMemo(() => dailyExpenses.filter(e => e.date.startsWith(currentMonth)), [dailyExpenses, currentMonth]);
  const todayTotal = useMemo(() => todayExpenses.reduce((sum, e) => sum + e.amount, 0), [todayExpenses]);
  const monthTotal = useMemo(() => monthExpenses.reduce((sum, e) => sum + e.amount, 0), [monthExpenses]);
  const remainingBudget = useMemo(() => profile.monthlyBudget - monthTotal, [profile.monthlyBudget, monthTotal]);
  const remainingDailyBudget = useMemo(() => profile.dailyBudgetTarget - todayTotal, [profile.dailyBudgetTarget, todayTotal]);

  const monthFixedTotal = useMemo(() => {
    const templateTotal = fixedTemplates.reduce((sum, t) => {
      const monthEntries = t.entries.filter(e => e.date.startsWith(currentMonth));
      return sum + monthEntries.reduce((s, e) => s + e.amount, 0);
    }, 0);
    const legacyTotal = fixedExpenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
    return templateTotal + legacyTotal;
  }, [fixedTemplates, fixedExpenses, currentMonth]);

  const totalLoansOutstanding = useMemo(() => {
    return loans
      .filter(l => !l.isPaid)
      .reduce((sum, l) => sum + l.amount, 0);
  }, [loans]);

  const monthMessTotal = useMemo(() => {
    return messPurchases
      .filter(p => p.date.startsWith(currentMonth))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [messPurchases, currentMonth]);

  const value = useMemo(() => ({
    expenses, loans, fixedExpenses, fixedTemplates, messPurchases,
    profile, savingsGoals, savedCards, activityLog, isLoading,
    refreshAll, addExpense, updateExpense, deleteExpense,
    addLoan, updateLoan, deleteLoan,
    addFixedExpense, deleteFixedExpense,
    addFixedTemplate, addFixedTemplateEntry, removeFixedTemplateEntry, deleteFixedTemplate,
    addMessPurchase, deleteMessPurchase,
    updateProfile,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    addSavedCard, deleteSavedCard, exportAllData, importAllData,
    todayExpenses, monthExpenses, todayTotal, monthTotal, remainingBudget, remainingDailyBudget,
    monthFixedTotal, totalLoansOutstanding, monthMessTotal,
  }), [expenses, loans, fixedExpenses, fixedTemplates, messPurchases,
    profile, savingsGoals, savedCards, activityLog, isLoading,
    refreshAll, addExpense, updateExpense, deleteExpense,
    addLoan, updateLoan, deleteLoan,
    addFixedExpense, deleteFixedExpense,
    addFixedTemplate, addFixedTemplateEntry, removeFixedTemplateEntry, deleteFixedTemplate,
    addMessPurchase, deleteMessPurchase,
    updateProfile,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    addSavedCard, deleteSavedCard, exportAllData, importAllData,
    todayExpenses, monthExpenses, todayTotal, monthTotal, remainingBudget, remainingDailyBudget,
    monthFixedTotal, totalLoansOutstanding, monthMessTotal]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used within BudgetProvider');
  return context;
}
