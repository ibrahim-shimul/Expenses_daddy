import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBudget } from '@/lib/BudgetContext';
import { formatCurrency, getCategoryColor, getCategoryIcon, formatDate, formatTime } from '@/lib/helpers';
import type { Expense, LoanEntry, FixedExpenseTemplate, MessPurchase } from '@/lib/types';

type TabType = 'daily' | 'fixed' | 'loans';
type FixedSubTab = 'repeating' | 'mess';

function ExpenseItem({ expense, currency, onDelete }: { expense: Expense; currency: string; onDelete: (id: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.expenseItem, pressed && { backgroundColor: Colors.dark.surfaceElevated }]}
      onPress={() => router.push({ pathname: '/edit-expense', params: { id: expense.id } })}
      onLongPress={() => {
        Alert.alert('Delete Expense', `Remove "${expense.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(expense.id) },
        ]);
      }}
    >
      <View style={[styles.expenseIcon, { backgroundColor: getCategoryColor(expense.category) + '20' }]}>
        <Ionicons name={getCategoryIcon(expense.category) as any} size={20} color={getCategoryColor(expense.category)} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseName} numberOfLines={1}>{expense.name}</Text>
        <Text style={styles.expenseMeta}>
          {expense.category} {expense.tags.length > 0 ? `· ${expense.tags[0]}` : ''}
        </Text>
        <Text style={styles.expenseDate}>{formatDate(expense.date)} · {formatTime(expense.createdAt)}</Text>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount, currency)}</Text>
        {expense.isRecurring && (
          <Ionicons name="repeat-outline" size={12} color={Colors.dark.textTertiary} style={{ marginTop: 4 }} />
        )}
      </View>
    </Pressable>
  );
}

function TemplateCard({ template, currency, onAdd, onDelete }: {
  template: FixedExpenseTemplate; currency: string;
  onAdd: (id: string) => void; onDelete: (id: string) => void;
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthEntries = template.entries.filter(e => e.date.startsWith(currentMonth));
  const monthTotal = monthEntries.reduce((s, e) => s + e.amount, 0);
  const allTotal = template.entries.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={styles.templateLeft}>
          <View style={[styles.expenseIcon, { backgroundColor: '#BB8FCE20' }]}>
            <Ionicons name="repeat-outline" size={20} color="#BB8FCE" />
          </View>
          <View>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateMeta}>
              {formatCurrency(template.amount, currency)} each · {monthEntries.length} this month
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => onDelete(template.id)}
          style={{ padding: 4 }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.dark.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.templateTotals}>
        <View style={styles.templateTotalItem}>
          <Text style={styles.templateTotalLabel}>This Month</Text>
          <Text style={styles.templateTotalValue}>{formatCurrency(monthTotal, currency)}</Text>
        </View>
        <View style={styles.templateTotalDivider} />
        <View style={styles.templateTotalItem}>
          <Text style={styles.templateTotalLabel}>All Time</Text>
          <Text style={styles.templateTotalValue}>{formatCurrency(allTotal, currency)}</Text>
        </View>
        <View style={styles.templateTotalDivider} />
        <View style={styles.templateTotalItem}>
          <Text style={styles.templateTotalLabel}>Count</Text>
          <Text style={styles.templateTotalValue}>{template.entries.length}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.addEntryBtn, pressed && { opacity: 0.7 }]}
        onPress={() => {
          onAdd(template.id);
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      >
        <Ionicons name="add" size={20} color="#000" />
        <Text style={styles.addEntryText}>Add {formatCurrency(template.amount, currency)}</Text>
      </Pressable>
    </View>
  );
}

function MessPurchaseItem({ purchase, currency, onDelete }: { purchase: MessPurchase; currency: string; onDelete: (id: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.expenseItem, pressed && { backgroundColor: Colors.dark.surfaceElevated }]}
      onLongPress={() => {
        Alert.alert('Delete Purchase', `Remove "${purchase.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(purchase.id) },
        ]);
      }}
    >
      <View style={[styles.expenseIcon, { backgroundColor: '#4ECDC420' }]}>
        <Ionicons name="restaurant-outline" size={20} color="#4ECDC4" />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseName} numberOfLines={1}>{purchase.name}</Text>
        <Text style={styles.expenseDate}>{formatDate(purchase.date)}</Text>
      </View>
      <Text style={styles.messAmount}>{formatCurrency(purchase.amount, currency)}</Text>
    </Pressable>
  );
}

function LoanItem({ loan, currency, onTogglePaid, onDelete }: { loan: LoanEntry; currency: string; onTogglePaid: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.expenseItem, pressed && { backgroundColor: Colors.dark.surfaceElevated }]}
      onPress={() => onTogglePaid(loan.id)}
      onLongPress={() => {
        Alert.alert('Delete Loan', `Remove "${loan.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(loan.id) },
        ]);
      }}
    >
      <View style={[styles.expenseIcon, { backgroundColor: loan.isPaid ? Colors.dark.success + '20' : '#FF6B6B20' }]}>
        <Ionicons name={loan.isPaid ? 'checkmark-circle-outline' : 'wallet-outline'} size={20} color={loan.isPaid ? Colors.dark.success : '#FF6B6B'} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseName, loan.isPaid && { textDecorationLine: 'line-through' as const, color: Colors.dark.textTertiary }]} numberOfLines={1}>{loan.name}</Text>
        {loan.notes ? <Text style={styles.expenseMeta} numberOfLines={1}>{loan.notes}</Text> : null}
        <Text style={styles.expenseDate}>{formatDate(loan.date)} {loan.isPaid ? '· Paid' : '· Outstanding'}</Text>
      </View>
      <Text style={[styles.loanAmount, loan.isPaid && { color: Colors.dark.success }]}>
        {formatCurrency(loan.amount, currency)}
      </Text>
    </Pressable>
  );
}

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const {
    expenses, deleteExpense,
    fixedTemplates, addFixedTemplate, addFixedTemplateEntry, deleteFixedTemplate,
    messPurchases, addMessPurchase, deleteMessPurchase,
    loans, updateLoan, deleteLoan,
    profile, monthMessTotal,
  } = useBudget();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [fixedSubTab, setFixedSubTab] = useState<FixedSubTab>('repeating');
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateAmount, setNewTemplateAmount] = useState('');
  const [showAddMess, setShowAddMess] = useState(false);
  const [newMessName, setNewMessName] = useState('');
  const [newMessAmount, setNewMessAmount] = useState('');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const dailyExpenses = useMemo(() => {
    return expenses.filter(e => (e.expenseType || 'daily') === 'daily');
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let filtered = dailyExpenses;
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(lower) ||
        e.category.toLowerCase().includes(lower) ||
        e.tags.some(t => t.toLowerCase().includes(lower)) ||
        e.notes.toLowerCase().includes(lower)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }
    return filtered;
  }, [dailyExpenses, search, selectedCategory]);

  const filteredLoans = useMemo(() => {
    if (!search) return loans;
    const lower = search.toLowerCase();
    return loans.filter(l =>
      l.name.toLowerCase().includes(lower) || l.notes.toLowerCase().includes(lower)
    );
  }, [loans, search]);

  const filteredMess = useMemo(() => {
    if (!search) return messPurchases;
    const lower = search.toLowerCase();
    return messPurchases.filter(p => p.name.toLowerCase().includes(lower));
  }, [messPurchases, search]);

  const categories = useMemo(() => {
    const cats = new Set(dailyExpenses.map(e => e.category));
    return Array.from(cats);
  }, [dailyExpenses]);

  const handleToggleLoanPaid = async (id: string) => {
    const loan = loans.find(l => l.id === id);
    if (loan) {
      await updateLoan(id, {
        isPaid: !loan.isPaid,
        paidDate: !loan.isPaid ? new Date().toISOString() : undefined,
      });
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateAmount.trim()) return;
    const amt = parseFloat(newTemplateAmount);
    if (isNaN(amt) || amt <= 0) return;
    await addFixedTemplate(newTemplateName.trim(), amt);
    setNewTemplateName('');
    setNewTemplateAmount('');
    setShowAddTemplate(false);
  };

  const handleAddMess = async () => {
    if (!newMessName.trim() || !newMessAmount.trim()) return;
    const amt = parseFloat(newMessAmount);
    if (isNaN(amt) || amt <= 0) return;
    await addMessPurchase({
      name: newMessName.trim(),
      amount: amt,
      date: new Date().toISOString(),
    });
    setNewMessName('');
    setNewMessAmount('');
    setShowAddMess(false);
  };

  const handleDeleteTemplate = (id: string) => {
    Alert.alert('Delete Tracker', 'This will remove the tracker and all its entries.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFixedTemplate(id) },
    ]);
  };

  const renderFixedContent = () => {
    return (
      <ScrollViewWrapper>
        <View style={styles.fixedSubTabs}>
          <Pressable
            onPress={() => setFixedSubTab('repeating')}
            style={[styles.fixedSubTab, fixedSubTab === 'repeating' && styles.fixedSubTabActive]}
          >
            <Ionicons name="repeat-outline" size={16} color={fixedSubTab === 'repeating' ? '#000' : Colors.dark.textSecondary} />
            <Text style={[styles.fixedSubTabText, fixedSubTab === 'repeating' && styles.fixedSubTabTextActive]}>Repeating</Text>
          </Pressable>
          <Pressable
            onPress={() => setFixedSubTab('mess')}
            style={[styles.fixedSubTab, fixedSubTab === 'mess' && styles.fixedSubTabActive]}
          >
            <Ionicons name="restaurant-outline" size={16} color={fixedSubTab === 'mess' ? '#000' : Colors.dark.textSecondary} />
            <Text style={[styles.fixedSubTabText, fixedSubTab === 'mess' && styles.fixedSubTabTextActive]}>Mess Meals</Text>
          </Pressable>
        </View>

        {fixedSubTab === 'repeating' && (
          <>
            {showAddTemplate ? (
              <View style={styles.addTemplateCard}>
                <Text style={styles.addTemplateTitle}>New Fixed Tracker</Text>
                <TextInput
                  style={styles.addTemplateInput}
                  placeholder="Name (e.g., Electricity, Water)"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={newTemplateName}
                  onChangeText={setNewTemplateName}
                  autoFocus
                />
                <TextInput
                  style={styles.addTemplateInput}
                  placeholder="Fixed amount each time"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={newTemplateAmount}
                  onChangeText={setNewTemplateAmount}
                  keyboardType="decimal-pad"
                />
                <View style={styles.addTemplateActions}>
                  <Pressable onPress={() => setShowAddTemplate(false)} style={styles.addTemplateCancelBtn}>
                    <Text style={styles.addTemplateCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleAddTemplate} style={styles.addTemplateSaveBtn}>
                    <Text style={styles.addTemplateSaveText}>Create</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setShowAddTemplate(true)} style={styles.addNewBtn}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.dark.textSecondary} />
                <Text style={styles.addNewText}>Add Fixed Tracker</Text>
              </Pressable>
            )}

            {fixedTemplates.length === 0 && !showAddTemplate ? (
              <View style={styles.emptyState}>
                <Ionicons name="repeat-outline" size={48} color={Colors.dark.textTertiary} />
                <Text style={styles.emptyText}>No fixed trackers</Text>
                <Text style={styles.emptySubtext}>Create one to track recurring fixed amounts</Text>
              </View>
            ) : (
              fixedTemplates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  currency={profile.currency}
                  onAdd={addFixedTemplateEntry}
                  onDelete={handleDeleteTemplate}
                />
              ))
            )}
          </>
        )}

        {fixedSubTab === 'mess' && (
          <>
            <View style={styles.messSummary}>
              <View style={[styles.expenseIcon, { backgroundColor: '#4ECDC420', width: 36, height: 36 }]}>
                <Ionicons name="restaurant-outline" size={18} color="#4ECDC4" />
              </View>
              <View>
                <Text style={styles.messSummaryLabel}>This Month's Mess</Text>
                <Text style={styles.messSummaryAmount}>{formatCurrency(monthMessTotal, profile.currency)}</Text>
              </View>
              <Text style={styles.messSummaryCount}>{filteredMess.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7))).length} purchases</Text>
            </View>

            {showAddMess ? (
              <View style={styles.addTemplateCard}>
                <Text style={styles.addTemplateTitle}>Add Food Purchase</Text>
                <TextInput
                  style={styles.addTemplateInput}
                  placeholder="Item (e.g., Rice, Vegetables)"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={newMessName}
                  onChangeText={setNewMessName}
                  autoFocus
                />
                <TextInput
                  style={styles.addTemplateInput}
                  placeholder="Amount"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={newMessAmount}
                  onChangeText={setNewMessAmount}
                  keyboardType="decimal-pad"
                />
                <View style={styles.addTemplateActions}>
                  <Pressable onPress={() => setShowAddMess(false)} style={styles.addTemplateCancelBtn}>
                    <Text style={styles.addTemplateCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleAddMess} style={styles.addTemplateSaveBtn}>
                    <Text style={styles.addTemplateSaveText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setShowAddMess(true)} style={styles.addNewBtn}>
                <Ionicons name="add-circle-outline" size={20} color="#4ECDC4" />
                <Text style={[styles.addNewText, { color: '#4ECDC4' }]}>Add Food Purchase</Text>
              </Pressable>
            )}

            {filteredMess.length === 0 && !showAddMess ? (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color={Colors.dark.textTertiary} />
                <Text style={styles.emptyText}>No mess purchases</Text>
                <Text style={styles.emptySubtext}>Log food purchases for your mess</Text>
              </View>
            ) : (
              filteredMess.map(p => (
                <MessPurchaseItem key={p.id} purchase={p} currency={profile.currency} onDelete={deleteMessPurchase} />
              ))
            )}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollViewWrapper>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'fixed') {
      return renderFixedContent();
    }

    if (activeTab === 'loans') {
      return (
        <FlatList
          data={filteredLoans}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <LoanItem loan={item} currency={profile.currency} onTogglePaid={handleToggleLoanPaid} onDelete={deleteLoan} />
          )}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.dark.textTertiary} />
              <Text style={styles.emptyText}>No loans tracked</Text>
              <Text style={styles.emptySubtext}>Track borrowed money here</Text>
            </View>
          }
        />
      );
    }

    return (
      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ExpenseItem expense={item} currency={profile.currency} onDelete={deleteExpense} />
        )}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.dark.textTertiary} />
            <Text style={styles.emptyText}>
              {search || selectedCategory ? 'No matching expenses' : 'No expenses yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {search || selectedCategory ? 'Try a different search' : 'Add your first expense with the + button'}
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Text style={styles.title}>Expenses</Text>

        <View style={styles.tabsRow}>
          {([
            { key: 'daily' as TabType, label: 'Daily', count: dailyExpenses.length },
            { key: 'fixed' as TabType, label: 'Fixed', count: fixedTemplates.length + messPurchases.length },
            { key: 'loans' as TabType, label: 'Loans', count: loans.length },
          ]).map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => { setActiveTab(tab.key); setSelectedCategory(null); setSearch(''); }}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>{tab.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {activeTab !== 'fixed' && (
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color={Colors.dark.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={Colors.dark.textTertiary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.dark.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {activeTab === 'daily' && categories.length > 0 && (
          <FlatList
            horizontal
            data={['All', ...categories]}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedCategory(item === 'All' ? null : item)}
                style={[
                  styles.filterChip,
                  (item === 'All' && !selectedCategory) || selectedCategory === item
                    ? styles.filterChipActive
                    : null,
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  ((item === 'All' && !selectedCategory) || selectedCategory === item) && styles.filterChipTextActive,
                ]}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>

      {renderTabContent()}

      {activeTab !== 'fixed' && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
          onPress={() => router.push('/add-expense')}
        >
          <Ionicons name="add" size={28} color="#000" />
        </Pressable>
      )}
    </View>
  );
}

function ScrollViewWrapper({ children }: { children: React.ReactNode }) {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.dark.text,
    borderColor: Colors.dark.text,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: '#000',
  },
  tabBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tabBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.dark.textTertiary,
  },
  tabBadgeTextActive: {
    color: '#000',
  },
  searchRow: {
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.dark.text,
    height: 44,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.text,
    borderColor: Colors.dark.text,
  },
  filterChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.dark.background,
  },
  fixedSubTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  fixedSubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 6,
  },
  fixedSubTabActive: {
    backgroundColor: Colors.dark.text,
    borderColor: Colors.dark.text,
  },
  fixedSubTabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  fixedSubTabTextActive: {
    color: '#000',
  },
  templateCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  templateName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  templateMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  templateTotals: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  templateTotalItem: {
    flex: 1,
    alignItems: 'center',
  },
  templateTotalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    marginBottom: 4,
  },
  templateTotalValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.dark.text,
  },
  templateTotalDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.text,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  addEntryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#000',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 16,
  },
  addNewText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  addTemplateCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  addTemplateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  addTemplateInput: {
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  addTemplateActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addTemplateCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceHighlight,
  },
  addTemplateCancelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  addTemplateSaveBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.dark.text,
  },
  addTemplateSaveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#000',
  },
  messSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  messSummaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  messSummaryAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.dark.text,
    marginTop: 2,
  },
  messSummaryCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginLeft: 'auto',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  expenseMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  expenseDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.dark.expense,
  },
  messAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#4ECDC4',
  },
  loanAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FF6B6B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  emptySubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.text,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
