import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBudget } from '@/lib/BudgetContext';
import { detectCardType, maskCardNumber } from '@/lib/helpers';

export default function AddCardScreen() {
  const insets = useSafeAreaInsets();
  const { addSavedCard } = useBudget();
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const cardType = detectCardType(cardNumber);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setExpiryDate(cleaned.slice(0, 2) + '/' + cleaned.slice(2));
    } else {
      setExpiryDate(cleaned);
    }
  };

  const handleSave = async () => {
    if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 4 || expiryDate.length < 4) return;
    setSaving(true);
    await addSavedCard({
      cardName: cardName.trim(),
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cardType,
      isDefault,
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const isValid = cardName.trim().length > 0 && cardNumber.replace(/\s/g, '').length >= 4 && expiryDate.length >= 4;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8, paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Card</Text>
        <Pressable onPress={handleSave} disabled={!isValid || saving} style={({ pressed }) => [{ opacity: isValid && !saving ? (pressed ? 0.7 : 1) : 0.3 }]}>
          <Ionicons name="checkmark" size={26} color={Colors.dark.success} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#1A1A2E', '#2D2D44']}
          style={styles.cardPreview}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardPreviewHeader}>
            <Text style={styles.cardPreviewName}>{cardName || 'Card Name'}</Text>
            <Text style={styles.cardPreviewType}>{cardType.toUpperCase()}</Text>
          </View>
          <View style={styles.cardChip}>
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
          </View>
          <Text style={styles.cardPreviewNumber}>
            {cardNumber || '•••• •••• •••• ••••'}
          </Text>
          <View style={styles.cardPreviewFooter}>
            <Text style={styles.cardPreviewExpiry}>{expiryDate || 'MM/YY'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Card Name</Text>
          <TextInput
            style={styles.input}
            value={cardName}
            onChangeText={setCardName}
            placeholder="e.g., Personal Visa"
            placeholderTextColor={Colors.dark.textTertiary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Card Number</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={formatCardNumber}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={Colors.dark.textTertiary}
            keyboardType="number-pad"
            maxLength={19}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={formatExpiry}
            placeholder="MM/YY"
            placeholderTextColor={Colors.dark.textTertiary}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Set as Default</Text>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.success + '50' }}
            thumbColor={isDefault ? Colors.dark.success : Colors.dark.textTertiary}
          />
        </View>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.dark.textTertiary} />
          <Text style={styles.securityText}>Card data is stored locally on your device only</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.dark.text },
  content: { paddingTop: 20, paddingBottom: 40 },
  cardPreview: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  cardPreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPreviewName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.dark.text },
  cardPreviewType: { fontFamily: 'Inter_700Bold', fontSize: 12, color: Colors.dark.textSecondary, letterSpacing: 1 },
  cardChip: { width: 40, height: 28, borderRadius: 4, backgroundColor: '#3A3A3A', justifyContent: 'center', padding: 4, gap: 2, marginVertical: 16 },
  chipLine: { height: 2, backgroundColor: '#555', borderRadius: 1 },
  cardPreviewNumber: { fontFamily: 'Inter_600SemiBold', fontSize: 20, color: Colors.dark.text, letterSpacing: 2, marginBottom: 16 },
  cardPreviewFooter: { flexDirection: 'row' },
  cardPreviewExpiry: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.dark.textSecondary },
  field: { marginBottom: 20 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.dark.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 20 },
  switchLabel: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.dark.text },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 8 },
  securityText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.dark.textTertiary },
});
