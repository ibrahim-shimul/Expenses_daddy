import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Platform, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/colors';
import { useBudget } from '@/lib/BudgetContext';
import { formatCurrency, formatDate, formatTime } from '@/lib/helpers';
import { CURRENCY_OPTIONS } from '@/lib/types';

function SettingsRow({ icon, label, value, onPress, color }: { icon: string; label: string; value?: string; onPress?: () => void; color?: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && onPress && { backgroundColor: Colors.dark.surfaceElevated }]}
      onPress={onPress}
    >
      <View style={styles.settingsLeft}>
        <Ionicons name={icon as any} size={20} color={color || Colors.dark.textSecondary} />
        <Text style={[styles.settingsLabel, color ? { color } : null]}>{label}</Text>
      </View>
      <View style={styles.settingsRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.dark.textTertiary} />}
      </View>
    </Pressable>
  );
}

function ActivityLogItem({ item, currency }: { item: any; currency: string }) {
  const getIcon = () => {
    switch (item.type) {
      case 'expense_added': return 'add-circle-outline';
      case 'expense_edited': return 'create-outline';
      case 'expense_deleted': return 'trash-outline';
      case 'budget_updated': return 'wallet-outline';
      case 'card_added': return 'card-outline';
      case 'card_deleted': return 'card-outline';
      case 'goal_added': return 'flag-outline';
      case 'goal_updated': return 'flag-outline';
      default: return 'ellipsis-horizontal-outline';
    }
  };

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Ionicons name={getIcon() as any} size={16} color={Colors.dark.textSecondary} />
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.activityDate}>{formatDate(item.date)} {formatTime(item.date)}</Text>
      </View>
      {item.amount !== undefined && (
        <Text style={styles.activityAmount}>{formatCurrency(item.amount, currency)}</Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, activityLog, savingsGoals, expenses, exportAllData, importAllData } = useBudget();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showActivity, setShowActivity] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateProfile({ name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const handleCurrencyChange = () => {
    const currentIndex = CURRENCY_OPTIONS.indexOf(profile.currency);
    const nextIndex = (currentIndex + 1) % CURRENCY_OPTIONS.length;
    updateProfile({ currency: CURRENCY_OPTIONS[nextIndex] });
  };

  const handleExport = async () => {
    try {
      setExportStatus('Preparing...');
      const jsonData = await exportAllData();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `expense-daddy-backup-${dateStr}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportStatus('Downloaded!');
      } else {
        const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const filePath = `${dir}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, jsonData, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          try {
            await Sharing.shareAsync(filePath, {
              mimeType: 'application/json',
              dialogTitle: 'Save your backup',
              UTI: 'public.json',
            });
          } catch (shareErr) {
            // User may have dismissed the share dialog - that's ok
          }
          setExportStatus('Exported!');
        } else {
          await Share.share({
            message: jsonData,
            title: fileName,
          });
          setExportStatus('Exported!');
        }
      }
      setTimeout(() => setExportStatus(''), 3000);
    } catch (e: any) {
      console.log('Export error:', e?.message || e);
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleImport = async () => {
    try {
      setImportStatus('');

      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const text = event.target?.result as string;
              await importAllData(text);
              setImportStatus('Data restored!');
              setTimeout(() => setImportStatus(''), 2000);
            } catch (err) {
              setImportStatus('Invalid backup file');
              setTimeout(() => setImportStatus(''), 2000);
            }
          };
          reader.readAsText(file);
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        await importAllData(content);
        setImportStatus('Data restored!');
        setTimeout(() => setImportStatus(''), 2000);
      }
    } catch (e) {
      setImportStatus('Import failed');
      setTimeout(() => setImportStatus(''), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + webTopInset + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(profile.name || 'U')[0].toUpperCase()}
            </Text>
          </View>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                onSubmitEditing={handleSaveName}
                placeholderTextColor={Colors.dark.textTertiary}
              />
              <Pressable onPress={handleSaveName}>
                <Ionicons name="checkmark" size={24} color={Colors.dark.success} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setNameInput(profile.name); setEditingName(true); }}>
              <Text style={styles.profileName}>{profile.name}</Text>
            </Pressable>
          )}
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{expenses.length}</Text>
              <Text style={styles.profileStatLabel}>Expenses</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{savingsGoals.length}</Text>
              <Text style={styles.profileStatLabel}>Goals</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{formatCurrency(profile.monthlyBudget, profile.currency)}</Text>
              <Text style={styles.profileStatLabel}>Budget</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="wallet-outline"
              label="Monthly Budget"
              value={profile.monthlyBudget > 0 ? formatCurrency(profile.monthlyBudget, profile.currency) : 'Not set'}
              onPress={() => router.push('/budget-settings')}
            />
            <SettingsRow
              icon="today-outline"
              label="Daily Target"
              value={profile.dailyBudgetTarget > 0 ? formatCurrency(profile.dailyBudgetTarget, profile.currency) : 'Not set'}
              onPress={() => router.push('/budget-settings')}
            />
            <SettingsRow
              icon="cash-outline"
              label="Currency"
              value={profile.currency}
              onPress={handleCurrencyChange}
            />
            <SettingsRow
              icon="flag-outline"
              label="Savings Goals"
              value={`${savingsGoals.length} active`}
              onPress={() => router.push('/add-goal')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="download-outline"
              label={exportStatus || "Export All Data"}
              onPress={handleExport}
              color={exportStatus === 'Downloaded!' || exportStatus === 'Exported!' ? Colors.dark.success : undefined}
            />
            <SettingsRow
              icon="push-outline"
              label={importStatus || "Import Data"}
              onPress={handleImport}
              color={importStatus === 'Data restored!' ? Colors.dark.success : importStatus && importStatus !== '' ? Colors.dark.danger : undefined}
            />
          </View>
          <Text style={styles.dataHint}>
            Export your data as a backup file. If you reinstall the app, use Import to restore everything.
          </Text>
        </View>

        <View style={styles.section}>
          <Pressable onPress={() => setShowActivity(!showActivity)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Log</Text>
            <Ionicons name={showActivity ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.dark.textSecondary} />
          </Pressable>
          {showActivity && (
            activityLog.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No activity yet</Text>
              </View>
            ) : (
              activityLog.slice(0, 20).map(item => (
                <ActivityLogItem key={item.id} item={item} currency={profile.currency} />
              ))
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
  },
  profileName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  nameInput: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: Colors.dark.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.textSecondary,
    paddingVertical: 4,
    minWidth: 150,
    textAlign: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
  },
  profileStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.dark.border,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsGroup: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  dataHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 10,
    lineHeight: 18,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.dark.text,
  },
  activityDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  activityAmount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
});
