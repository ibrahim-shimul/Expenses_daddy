import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Platform, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBudget } from '@/lib/BudgetContext';
import { formatCurrency } from '@/lib/helpers';

function GoalCard({ goal, currency, onAddFunds, onDelete }: { goal: any; currency: string; onAddFunds: (id: string) => void; onDelete: (id: string) => void }) {
  const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Pressable onPress={() => {
          Alert.alert('Delete Goal', `Remove "${goal.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(goal.id) },
          ]);
        }}>
          <Ionicons name="trash-outline" size={16} color={Colors.dark.textTertiary} />
        </Pressable>
      </View>
      <View style={styles.goalAmounts}>
        <Text style={styles.goalCurrent}>{formatCurrency(goal.currentAmount, currency)}</Text>
        <Text style={styles.goalTarget}> / {formatCurrency(goal.targetAmount, currency)}</Text>
      </View>
      <View style={styles.goalProgressTrack}>
        <View style={[styles.goalProgressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.goalFooter}>
        <Text style={styles.goalPercent}>{progress.toFixed(0)}% saved</Text>
        <Pressable onPress={() => onAddFunds(goal.id)} style={styles.goalAddBtn}>
          <Ionicons name="add" size={16} color={Colors.dark.text} />
          <Text style={styles.goalAddText}>Add Funds</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, profile } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleCreate = async () => {
    if (!goalName.trim() || !targetAmount.trim()) return;
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) return;
    setSaving(true);
    await addSavingsGoal({ name: goalName.trim(), targetAmount: target, currentAmount: 0 });
    setGoalName('');
    setTargetAmount('');
    setShowForm(false);
    setSaving(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddFunds = (id: string) => {
    Alert.prompt?.('Add Funds', 'Enter amount to add:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add', onPress: async (amount?: string) => {
          const value = parseFloat(amount || '0');
          if (value > 0) {
            const goal = savingsGoals.find(g => g.id === id);
            if (goal) await updateSavingsGoal(id, { currentAmount: goal.currentAmount + value });
          }
        }
      },
    ], 'plain-text', '', 'decimal-pad');
  };

  const handleDelete = async (id: string) => {
    await deleteSavingsGoal(id);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8, paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <Pressable onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Savings Goal</Text>
            <TextInput
              style={styles.input}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="Goal name..."
              placeholderTextColor={Colors.dark.textTertiary}
            />
            <View style={styles.amountRow}>
              <Text style={styles.currencySign}>{profile.currency}</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="Target amount"
                placeholderTextColor={Colors.dark.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <Pressable
              onPress={handleCreate}
              disabled={!goalName.trim() || !targetAmount.trim() || saving}
              style={({ pressed }) => [
                styles.createBtn,
                { opacity: goalName.trim() && targetAmount.trim() && !saving ? (pressed ? 0.8 : 1) : 0.4 },
              ]}
            >
              <Text style={styles.createBtnText}>Create Goal</Text>
            </Pressable>
          </View>
        )}

        {savingsGoals.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="flag-outline" size={48} color={Colors.dark.textTertiary} />
            </View>
            <Text style={styles.emptyText}>No savings goals yet</Text>
            <Text style={styles.emptySubtext}>Set a goal and start tracking your progress</Text>
          </View>
        ) : (
          savingsGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={profile.currency}
              onAddFunds={handleAddFunds}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.dark.text },
  content: { paddingTop: 20, paddingBottom: 40 },
  formCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.dark.border, gap: 14 },
  formTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.dark.text, marginBottom: 4 },
  input: { backgroundColor: Colors.dark.surfaceElevated, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencySign: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.dark.textTertiary },
  createBtn: { backgroundColor: Colors.dark.text, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  createBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.dark.background },
  goalCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.dark.text },
  goalAmounts: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  goalCurrent: { fontFamily: 'Inter_700Bold', fontSize: 24, color: Colors.dark.text },
  goalTarget: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.dark.textTertiary },
  goalProgressTrack: { height: 6, backgroundColor: Colors.dark.surfaceHighlight, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  goalProgressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.dark.success },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalPercent: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.dark.textTertiary },
  goalAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.dark.surfaceHighlight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  goalAddText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.dark.text },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 16, color: Colors.dark.textSecondary },
  emptySubtext: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.dark.textTertiary, textAlign: 'center' },
});
