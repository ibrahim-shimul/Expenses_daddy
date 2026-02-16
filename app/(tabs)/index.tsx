import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useBudget } from '@/lib/BudgetContext';
import { formatCurrency, getCategoryColor, getCategoryIcon, formatDate, formatTime } from '@/lib/helpers';

function BudgetRing({ spent, budget, currency }: { spent: number; budget: number; currency: string }) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget - spent;
  const isOver = remaining < 0;

  return (
    <View style={styles.ringContainer}>
      <View style={styles.ringOuter}>
        <View style={[styles.ringProgress, {
          borderColor: isOver ? Colors.dark.danger : percentage > 80 ? Colors.dark.warning : '#444',
        }]} />
        <View style={styles.ringInner}>
          <Text style={styles.ringLabel}>{isOver ? 'Over Budget' : 'Remaining'}</Text>
          <Text style={[styles.ringAmount, isOver && { color: Colors.dark.danger }]}>
            {formatCurrency(Math.abs(remaining), currency)}
          </Text>
          <Text style={styles.ringPercent}>{percentage.toFixed(0)}% used</Text>
        </View>
      </View>
    </View>
  );
}

function QuickStatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function RecentTransaction({ name, category, amount, date, currency }: { name: string; category: string; amount: number; date: string; currency: string }) {
  return (
    <View style={styles.transactionRow}>
      <View style={[styles.transactionIcon, { backgroundColor: getCategoryColor(category) + '20' }]}>
        <Ionicons name={getCategoryIcon(category) as any} size={18} color={getCategoryColor(category)} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionName} numberOfLines={1}>{name}</Text>
        <Text style={styles.transactionDate}>{formatDate(date)} {formatTime(date)}</Text>
      </View>
      <Text style={styles.transactionAmount}>-{formatCurrency(amount, currency)}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, todayTotal, monthTotal, remainingBudget, remainingDailyBudget,
    expenses, monthExpenses, isLoading,
    monthFixedTotal, totalLoansOutstanding, loans, monthMessTotal,
  } = useBudget();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const topCategories = React.useMemo(() => {
    const catMap: Record<string, number> = {};
    monthExpenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    return Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));
  }, [monthExpenses]);

  const dailyExpenses = React.useMemo(() => expenses.filter(e => (e.expenseType || 'daily') === 'daily'), [expenses]);
  const recentExpenses = dailyExpenses.slice(0, 5);

  const noSpendDays = React.useMemo(() => {
    const now = new Date();
    const today = now.getDate();
    const expenseDates = new Set(monthExpenses.map(e => new Date(e.date).getDate()));
    let count = 0;
    for (let d = 1; d <= today; d++) {
      if (!expenseDates.has(d)) count++;
    }
    return count;
  }, [monthExpenses]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + webTopInset + 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{profile.name}</Text>
          </View>
          <Pressable onPress={() => router.push('/budget-settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>

        <LinearGradient
          colors={['#1A1A1A', '#222222']}
          style={styles.budgetCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {profile.monthlyBudget > 0 ? (
            <BudgetRing spent={monthTotal} budget={profile.monthlyBudget} currency={profile.currency} />
          ) : (
            <Pressable onPress={() => router.push('/budget-settings')} style={styles.setBudgetPrompt}>
              <Ionicons name="add-circle-outline" size={32} color={Colors.dark.textSecondary} />
              <Text style={styles.setBudgetText}>Set your monthly budget</Text>
            </Pressable>
          )}
        </LinearGradient>

        <View style={styles.statsRow}>
          <QuickStatCard
            label="Today"
            value={formatCurrency(todayTotal, profile.currency)}
            icon="today-outline"
            color={Colors.dark.expense}
          />
          <QuickStatCard
            label="This Month"
            value={formatCurrency(monthTotal, profile.currency)}
            icon="calendar-outline"
            color={Colors.dark.info}
          />
          <QuickStatCard
            label="No-Spend"
            value={`${noSpendDays} days`}
            icon="leaf-outline"
            color={Colors.dark.success}
          />
        </View>

        {(monthFixedTotal > 0 || totalLoansOutstanding > 0 || monthMessTotal > 0) && (
          <View style={styles.extraStatsRow}>
            {monthFixedTotal > 0 && (
              <View style={styles.extraStatCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#BB8FCE15' }]}>
                  <Ionicons name="repeat-outline" size={18} color="#BB8FCE" />
                </View>
                <Text style={styles.statLabel}>Fixed (Month)</Text>
                <Text style={styles.statValue}>{formatCurrency(monthFixedTotal, profile.currency)}</Text>
              </View>
            )}
            {monthMessTotal > 0 && (
              <View style={styles.extraStatCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#4ECDC415' }]}>
                  <Ionicons name="restaurant-outline" size={18} color="#4ECDC4" />
                </View>
                <Text style={styles.statLabel}>Mess (Month)</Text>
                <Text style={styles.statValue}>{formatCurrency(monthMessTotal, profile.currency)}</Text>
              </View>
            )}
            {totalLoansOutstanding > 0 && (
              <View style={styles.extraStatCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FF6B6B15' }]}>
                  <Ionicons name="wallet-outline" size={18} color="#FF6B6B" />
                </View>
                <Text style={styles.statLabel}>Loans Due</Text>
                <Text style={styles.statValue}>{formatCurrency(totalLoansOutstanding, profile.currency)}</Text>
              </View>
            )}
          </View>
        )}

        {profile.dailyBudgetTarget > 0 && (
          <View style={styles.dailyBudgetBar}>
            <View style={styles.dailyBudgetHeader}>
              <Text style={styles.sectionTitle}>Daily Budget</Text>
              <Text style={[styles.dailyBudgetRemaining, remainingDailyBudget < 0 && { color: Colors.dark.danger }]}>
                {formatCurrency(Math.abs(remainingDailyBudget), profile.currency)} {remainingDailyBudget < 0 ? 'over' : 'left'}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${Math.min((todayTotal / profile.dailyBudgetTarget) * 100, 100)}%`,
                backgroundColor: remainingDailyBudget < 0 ? Colors.dark.danger : Colors.dark.textSecondary,
              }]} />
            </View>
          </View>
        )}

        {topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoriesRow}>
              {topCategories.map(cat => (
                <View key={cat.name} style={styles.categoryChip}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(cat.name) }]} />
                  <Text style={styles.categoryChipName}>{cat.name}</Text>
                  <Text style={styles.categoryChipAmount}>{formatCurrency(cat.amount, profile.currency)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={Colors.dark.textTertiary} />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
            </View>
          ) : (
            recentExpenses.map(expense => (
              <RecentTransaction
                key={expense.id}
                name={expense.name}
                category={expense.category}
                amount={expense.amount}
                date={expense.createdAt}
                currency={profile.currency}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        testID="fab-add-expense"
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
        onPress={() => router.push('/add-expense')}
      >
        <Ionicons name="add" size={28} color="#000" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.dark.text,
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  ringContainer: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: Colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringProgress: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
  },
  ringInner: {
    alignItems: 'center',
  },
  ringLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  ringAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
  },
  ringPercent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  setBudgetPrompt: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  setBudgetText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  extraStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 10,
  },
  extraStatCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.dark.text,
  },
  dailyBudgetBar: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dailyBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyBudgetRemaining: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
  },
  seeAll: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryChipName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.dark.text,
  },
  categoryChipAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  transactionDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  transactionAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.dark.expense,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
