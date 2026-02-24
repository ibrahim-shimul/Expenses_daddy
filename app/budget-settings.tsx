import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBudget } from '@/lib/BudgetContext';
import { formatCurrency, formatDate } from '@/lib/helpers';
import * as Storage from '@/lib/storage';

export default function BudgetSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useBudget();
  const [monthlyBudget, setMonthlyBudget] = useState(profile.monthlyBudget > 0 ? profile.monthlyBudget.toString() : '');
  const [dailyTarget, setDailyTarget] = useState(profile.dailyBudgetTarget > 0 ? profile.dailyBudgetTarget.toString() : '');
  const [saving, setSaving] = useState(false);
  const [budgetHistory, setBudgetHistory] = useState<{ amount: number; date: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  React.useEffect(() => {
    Storage.getBudgetHistory().then(setBudgetHistory);
  }, []);

  const handleSave = async () => {
    const budget = parseFloat(monthlyBudget) || 0;
    const daily = parseFloat(dailyTarget) || 0;
    setSaving(true);
    await updateProfile({ monthlyBudget: budget, dailyBudgetTarget: daily });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleAutoDaily = () => {
    const budget = parseFloat(monthlyBudget) || 0;
    if (budget > 0) {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      setDailyTarget((budget / daysInMonth).toFixed(2));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8, paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Budget Settings</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12} style={({ pressed }) => [{ opacity: saving ? 0.3 : (pressed ? 0.7 : 1) }]}>
          <Ionicons name="checkmark" size={26} color={Colors.dark.success} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, webBottomInset) + 40, paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Monthly Budget</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>{profile.currency}</Text>
            <TextInput
              style={styles.amountInput}
              value={monthlyBudget}
              onChangeText={setMonthlyBudget}
              placeholder="0"
              placeholderTextColor={Colors.dark.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <Text style={styles.fieldHint}>Set your total spending limit for the month</Text>
        </View>

        <View style={styles.field}>
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Daily Budget Target</Text>
            <Pressable onPress={handleAutoDaily} style={styles.autoBtn}>
              <Text style={styles.autoBtnText}>Auto-calculate</Text>
            </Pressable>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>{profile.currency}</Text>
            <TextInput
              style={styles.amountInput}
              value={dailyTarget}
              onChangeText={setDailyTarget}
              placeholder="0"
              placeholderTextColor={Colors.dark.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.fieldHint}>Break your monthly budget into daily limits</Text>
        </View>

        {budgetHistory.length > 0 && (
          <View style={styles.historySection}>
            <Pressable onPress={() => setShowHistory(!showHistory)} style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Budget History</Text>
              <Ionicons name={showHistory ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.dark.textSecondary} />
            </Pressable>
            {showHistory && budgetHistory.slice(0, 10).map((entry, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyAmount}>{formatCurrency(entry.amount, profile.currency)}</Text>
                <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.dark.text },
  content: { paddingTop: 20 },
  field: { marginBottom: 28 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  currencySign: { fontFamily: 'Inter_700Bold', fontSize: 24, color: Colors.dark.textTertiary, marginRight: 8 },
  amountInput: { fontFamily: 'Inter_700Bold', fontSize: 28, color: Colors.dark.text, flex: 1 },
  fieldHint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.dark.textTertiary, marginTop: 8 },
  autoBtn: { backgroundColor: Colors.dark.surfaceHighlight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  autoBtnText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.dark.textSecondary },
  historySection: { marginTop: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.dark.text },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  historyAmount: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.dark.text },
  historyDate: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.dark.textTertiary },
});
