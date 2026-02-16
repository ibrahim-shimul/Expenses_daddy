import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, BudgetHistory, SavingsGoal, SavedCard, ActivityItem, UserProfile, LoanEntry, FixedExpense, FixedExpenseTemplate, FixedExpenseEntry, MessPurchase } from './types';

const KEYS = {
  EXPENSES: '@budgetflow_expenses',
  BUDGET_HISTORY: '@budgetflow_budget_history',
  SAVINGS_GOALS: '@budgetflow_savings_goals',
  SAVED_CARDS: '@budgetflow_saved_cards',
  ACTIVITY_LOG: '@budgetflow_activity_log',
  USER_PROFILE: '@budgetflow_user_profile',
  SHOPPING_LIST: '@budgetflow_shopping_list',
  LOANS: '@budgetflow_loans',
  FIXED_EXPENSES: '@budgetflow_fixed_expenses',
  FIXED_TEMPLATES: '@budgetflow_fixed_templates',
  MESS_PURCHASES: '@budgetflow_mess_purchases',
};

async function getItem<T>(key: string, fallback: T): Promise<T> {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function getExpenses(): Promise<Expense[]> {
  const expenses = await getItem<Expense[]>(KEYS.EXPENSES, []);
  return expenses.map(e => ({ ...e, expenseType: e.expenseType || 'daily' }));
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const expenses = await getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  expenses.unshift(newExpense);
  await setItem(KEYS.EXPENSES, expenses);
  await addActivity({
    type: 'expense_added',
    description: `Added expense: ${expense.name}`,
    amount: expense.amount,
  });
  return newExpense;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  const expenses = await getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) return null;
  expenses[index] = { ...expenses[index], ...updates };
  await setItem(KEYS.EXPENSES, expenses);
  await addActivity({
    type: 'expense_edited',
    description: `Edited expense: ${expenses[index].name}`,
    amount: expenses[index].amount,
  });
  return expenses[index];
}

export async function deleteExpense(id: string): Promise<void> {
  const expenses = await getExpenses();
  const expense = expenses.find(e => e.id === id);
  const filtered = expenses.filter(e => e.id !== id);
  await setItem(KEYS.EXPENSES, filtered);
  if (expense) {
    await addActivity({
      type: 'expense_deleted',
      description: `Deleted expense: ${expense.name}`,
      amount: expense.amount,
    });
  }
}

export async function getLoans(): Promise<LoanEntry[]> {
  return getItem<LoanEntry[]>(KEYS.LOANS, []);
}

export async function addLoan(loan: Omit<LoanEntry, 'id' | 'createdAt' | 'isPaid'>): Promise<LoanEntry> {
  const loans = await getLoans();
  const newLoan: LoanEntry = {
    ...loan,
    id: generateId(),
    createdAt: new Date().toISOString(),
    isPaid: false,
  };
  loans.unshift(newLoan);
  await setItem(KEYS.LOANS, loans);
  await addActivity({ type: 'loan_added', description: `Added loan: ${loan.name}`, amount: loan.amount });
  return newLoan;
}

export async function updateLoan(id: string, updates: Partial<LoanEntry>): Promise<void> {
  const loans = await getLoans();
  const index = loans.findIndex(l => l.id === id);
  if (index !== -1) {
    loans[index] = { ...loans[index], ...updates };
    await setItem(KEYS.LOANS, loans);
    await addActivity({ type: 'loan_updated', description: `Updated loan: ${loans[index].name}`, amount: loans[index].amount });
  }
}

export async function deleteLoan(id: string): Promise<void> {
  const loans = await getLoans();
  await setItem(KEYS.LOANS, loans.filter(l => l.id !== id));
}

export async function getFixedExpenses(): Promise<FixedExpense[]> {
  return getItem<FixedExpense[]>(KEYS.FIXED_EXPENSES, []);
}

export async function addFixedExpense(expense: Omit<FixedExpense, 'id' | 'createdAt'>): Promise<FixedExpense> {
  const expenses = await getFixedExpenses();
  const newExpense: FixedExpense = {
    ...expense,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  expenses.unshift(newExpense);
  await setItem(KEYS.FIXED_EXPENSES, expenses);
  await addActivity({ type: 'fixed_added', description: `Added fixed expense: ${expense.name}`, amount: expense.amount });
  return newExpense;
}

export async function deleteFixedExpense(id: string): Promise<void> {
  const expenses = await getFixedExpenses();
  await setItem(KEYS.FIXED_EXPENSES, expenses.filter(e => e.id !== id));
  await addActivity({ type: 'fixed_deleted', description: 'Deleted fixed expense' });
}

export async function getFixedTemplates(): Promise<FixedExpenseTemplate[]> {
  return getItem<FixedExpenseTemplate[]>(KEYS.FIXED_TEMPLATES, []);
}

export async function addFixedTemplate(name: string, amount: number): Promise<FixedExpenseTemplate> {
  const templates = await getFixedTemplates();
  const newTemplate: FixedExpenseTemplate = {
    id: generateId(),
    name,
    amount,
    entries: [],
    createdAt: new Date().toISOString(),
  };
  templates.unshift(newTemplate);
  await setItem(KEYS.FIXED_TEMPLATES, templates);
  await addActivity({ type: 'fixed_added', description: `Created fixed tracker: ${name}`, amount });
  return newTemplate;
}

export async function addFixedTemplateEntry(templateId: string): Promise<void> {
  const templates = await getFixedTemplates();
  const index = templates.findIndex(t => t.id === templateId);
  if (index !== -1) {
    const entry: FixedExpenseEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      amount: templates[index].amount,
    };
    templates[index].entries.push(entry);
    await setItem(KEYS.FIXED_TEMPLATES, templates);
  }
}

export async function removeFixedTemplateEntry(templateId: string, entryId: string): Promise<void> {
  const templates = await getFixedTemplates();
  const index = templates.findIndex(t => t.id === templateId);
  if (index !== -1) {
    templates[index].entries = templates[index].entries.filter(e => e.id !== entryId);
    await setItem(KEYS.FIXED_TEMPLATES, templates);
  }
}

export async function deleteFixedTemplate(id: string): Promise<void> {
  const templates = await getFixedTemplates();
  await setItem(KEYS.FIXED_TEMPLATES, templates.filter(t => t.id !== id));
  await addActivity({ type: 'fixed_deleted', description: 'Deleted fixed tracker' });
}

export async function getMessPurchases(): Promise<MessPurchase[]> {
  return getItem<MessPurchase[]>(KEYS.MESS_PURCHASES, []);
}

export async function addMessPurchase(purchase: Omit<MessPurchase, 'id' | 'createdAt'>): Promise<MessPurchase> {
  const purchases = await getMessPurchases();
  const newPurchase: MessPurchase = {
    ...purchase,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  purchases.unshift(newPurchase);
  await setItem(KEYS.MESS_PURCHASES, purchases);
  await addActivity({ type: 'mess_added', description: `Mess: ${purchase.name}`, amount: purchase.amount });
  return newPurchase;
}

export async function deleteMessPurchase(id: string): Promise<void> {
  const purchases = await getMessPurchases();
  await setItem(KEYS.MESS_PURCHASES, purchases.filter(p => p.id !== id));
  await addActivity({ type: 'mess_deleted', description: 'Deleted mess purchase' });
}

export async function getBudgetHistory(): Promise<BudgetHistory[]> {
  return getItem<BudgetHistory[]>(KEYS.BUDGET_HISTORY, []);
}

export async function addBudgetHistory(amount: number): Promise<void> {
  const history = await getBudgetHistory();
  history.unshift({ id: generateId(), amount, date: new Date().toISOString() });
  await setItem(KEYS.BUDGET_HISTORY, history);
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  return getItem<SavingsGoal[]>(KEYS.SAVINGS_GOALS, []);
}

export async function addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt'>): Promise<SavingsGoal> {
  const goals = await getSavingsGoals();
  const newGoal: SavingsGoal = { ...goal, id: generateId(), createdAt: new Date().toISOString() };
  goals.push(newGoal);
  await setItem(KEYS.SAVINGS_GOALS, goals);
  await addActivity({ type: 'goal_added', description: `Added goal: ${goal.name}`, amount: goal.targetAmount });
  return newGoal;
}

export async function updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<void> {
  const goals = await getSavingsGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates };
    await setItem(KEYS.SAVINGS_GOALS, goals);
    await addActivity({ type: 'goal_updated', description: `Updated goal: ${goals[index].name}` });
  }
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const goals = await getSavingsGoals();
  await setItem(KEYS.SAVINGS_GOALS, goals.filter(g => g.id !== id));
}

export async function getSavedCards(): Promise<SavedCard[]> {
  return getItem<SavedCard[]>(KEYS.SAVED_CARDS, []);
}

export async function addSavedCard(card: Omit<SavedCard, 'id'>): Promise<SavedCard> {
  const cards = await getSavedCards();
  const newCard: SavedCard = { ...card, id: generateId() };
  cards.push(newCard);
  await setItem(KEYS.SAVED_CARDS, cards);
  await addActivity({ type: 'card_added', description: `Added card: ${card.cardName}` });
  return newCard;
}

export async function deleteSavedCard(id: string): Promise<void> {
  const cards = await getSavedCards();
  const card = cards.find(c => c.id === id);
  await setItem(KEYS.SAVED_CARDS, cards.filter(c => c.id !== id));
  if (card) {
    await addActivity({ type: 'card_deleted', description: `Removed card: ${card.cardName}` });
  }
}

export async function getActivityLog(): Promise<ActivityItem[]> {
  return getItem<ActivityItem[]>(KEYS.ACTIVITY_LOG, []);
}

export async function addActivity(item: Omit<ActivityItem, 'id' | 'date'>): Promise<void> {
  const log = await getActivityLog();
  log.unshift({ ...item, id: generateId(), date: new Date().toISOString() });
  if (log.length > 200) log.length = 200;
  await setItem(KEYS.ACTIVITY_LOG, log);
}

export async function getUserProfile(): Promise<UserProfile> {
  return getItem<UserProfile>(KEYS.USER_PROFILE, {
    name: 'User',
    currency: '৳',
    monthlyBudget: 0,
    dailyBudgetTarget: 0,
  });
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getUserProfile();
  const updated = { ...current, ...profile };
  await setItem(KEYS.USER_PROFILE, updated);
  if (profile.monthlyBudget !== undefined && profile.monthlyBudget !== current.monthlyBudget) {
    await addBudgetHistory(profile.monthlyBudget);
    await addActivity({ type: 'budget_updated', description: `Budget updated to ${profile.monthlyBudget}`, amount: profile.monthlyBudget });
  }
  return updated;
}

export async function getShoppingList(): Promise<string[]> {
  return getItem<string[]>(KEYS.SHOPPING_LIST, []);
}

export async function setShoppingList(list: string[]): Promise<void> {
  await setItem(KEYS.SHOPPING_LIST, list);
}

export async function exportAllData(): Promise<string> {
  const [expenses, profile, savingsGoals, savedCards, activityLog, budgetHistory, shoppingList, loans, fixedExpenses, fixedTemplates, messPurchases] = await Promise.all([
    getExpenses(),
    getUserProfile(),
    getSavingsGoals(),
    getSavedCards(),
    getActivityLog(),
    getBudgetHistory(),
    getShoppingList(),
    getLoans(),
    getFixedExpenses(),
    getFixedTemplates(),
    getMessPurchases(),
  ]);

  const data = {
    version: 3,
    exportDate: new Date().toISOString(),
    appName: 'ExpenseDaddy',
    expenses,
    profile,
    savingsGoals,
    savedCards,
    activityLog,
    budgetHistory,
    shoppingList,
    loans,
    fixedExpenses,
    fixedTemplates,
    messPurchases,
  };

  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);

  if (data.appName !== 'ExpenseDaddy') {
    throw new Error('Invalid backup file');
  }

  const promises: Promise<void>[] = [];

  if (data.expenses) promises.push(setItem(KEYS.EXPENSES, data.expenses));
  if (data.profile) promises.push(setItem(KEYS.USER_PROFILE, data.profile));
  if (data.savingsGoals) promises.push(setItem(KEYS.SAVINGS_GOALS, data.savingsGoals));
  if (data.savedCards) promises.push(setItem(KEYS.SAVED_CARDS, data.savedCards));
  if (data.activityLog) promises.push(setItem(KEYS.ACTIVITY_LOG, data.activityLog));
  if (data.budgetHistory) promises.push(setItem(KEYS.BUDGET_HISTORY, data.budgetHistory));
  if (data.shoppingList) promises.push(setItem(KEYS.SHOPPING_LIST, data.shoppingList));
  if (data.loans) promises.push(setItem(KEYS.LOANS, data.loans));
  if (data.fixedExpenses) promises.push(setItem(KEYS.FIXED_EXPENSES, data.fixedExpenses));
  if (data.fixedTemplates) promises.push(setItem(KEYS.FIXED_TEMPLATES, data.fixedTemplates));
  if (data.messPurchases) promises.push(setItem(KEYS.MESS_PURCHASES, data.messPurchases));

  await Promise.all(promises);
}
