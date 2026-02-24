import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBudget } from '@/lib/BudgetContext';
import { CATEGORIES } from '@/lib/types';
import { getCategoryColor } from '@/lib/helpers';

export default function EditExpenseScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, updateExpense, deleteExpense, profile } = useBudget();
  const expense = expenses.find(e => e.id === id);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setNotes(expense.notes);
      setTags(expense.tags);
    }
  }, [expense]);

  if (!expense) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.dark.textSecondary, fontFamily: 'Inter_400Regular' }}>Expense not found</Text>
      </View>
    );
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !amount.trim()) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    setSaving(true);
    await updateExpense(id!, { name: name.trim(), amount: amountNum, category, notes: notes.trim(), tags });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteExpense(id!);
          router.back();
        }
      },
    ]);
  };

  const isValid = name.trim().length > 0 && amount.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8, paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Expense</Text>
        <Pressable onPress={handleSave} disabled={!isValid || saving} style={({ pressed }) => [{ opacity: isValid && !saving ? (pressed ? 0.7 : 1) : 0.3 }]}>
          <Ionicons name="checkmark" size={26} color={Colors.dark.success} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>{profile.currency}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={Colors.dark.textTertiary} />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.name}
                onPress={() => setCategory(cat.name)}
                style={[styles.categoryOption, category === cat.name && { borderColor: getCategoryColor(cat.name), backgroundColor: getCategoryColor(cat.name) + '15' }]}
              >
                <Ionicons name={cat.icon as any} size={18} color={category === cat.name ? getCategoryColor(cat.name) : Colors.dark.textSecondary} />
                <Text style={[styles.categoryName, category === cat.name && { color: getCategoryColor(cat.name) }]}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tags</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add tag..."
              placeholderTextColor={Colors.dark.textTertiary}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map(tag => (
                <Pressable key={tag} onPress={() => setTags(tags.filter(t => t !== tag))} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <Ionicons name="close" size={12} color={Colors.dark.textTertiary} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            placeholderTextColor={Colors.dark.textTertiary}
            multiline
          />
        </View>

        <Pressable onPress={handleDelete} style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="trash-outline" size={18} color={Colors.dark.danger} />
          <Text style={styles.deleteBtnText}>Delete Expense</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.dark.text },
  content: { paddingTop: 20, paddingBottom: 40 },
  amountSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 20 },
  amountLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySign: { fontFamily: 'Inter_700Bold', fontSize: 36, color: Colors.dark.textTertiary, marginRight: 4 },
  amountInput: { fontFamily: 'Inter_700Bold', fontSize: 48, color: Colors.dark.text, minWidth: 100, textAlign: 'center' },
  field: { marginBottom: 20 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.dark.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, gap: 6 },
  categoryName: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.dark.textSecondary },
  tagInputRow: { flexDirection: 'row', gap: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surfaceHighlight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  tagText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.dark.textSecondary },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.danger + '40', marginTop: 20 },
  deleteBtnText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.dark.danger },
});
