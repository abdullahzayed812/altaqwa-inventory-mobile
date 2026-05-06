import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getSupplierById, getSupplierLedger } from '../../api';
import { Supplier, SupplierLedger, SupplierLedgerType } from '../../types';
import Card from '../../components/Card';
import { COLORS, CURRENCY, LEDGER_TYPE_LABELS } from '../../constants/theme';

export default function SupplierDetailsScreen({ route, navigation }: any) {
  const initialSupplier: Supplier = route.params.supplier;
  const [supplier, setSupplier] = useState<Supplier>(initialSupplier);
  const [ledger, setLedger] = useState<SupplierLedger[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sup, led] = await Promise.all([
        getSupplierById(supplier.id),
        getSupplierLedger(supplier.id),
      ]);
      setSupplier(sup);
      setLedger(led);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const fmt = (d: string) => new Date(d).toLocaleDateString('ar-EG');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {/* Info Card */}
        <Card>
          <Text style={styles.name}>{supplier.name}</Text>
          {supplier.phone && <InfoRow label="الهاتف" value={supplier.phone} />}
          {supplier.address && <InfoRow label="العنوان" value={supplier.address} />}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>الرصيد المستحق</Text>
            <Text style={[styles.balanceValue, { color: supplier.totalBalance > 0 ? COLORS.balanceBlue : COLORS.success }]}>
              {supplier.totalBalance.toLocaleString('ar-EG')} {CURRENCY}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('AddPurchase', { supplier })}
          >
            <Text style={styles.actionBtnText}>+ فاتورة شراء</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success, marginRight: 8 }]}
            onPress={() => navigation.navigate('AddPurchase', { supplier, isPayment: true })}
          >
            <Text style={styles.actionBtnText}>+ دفعة</Text>
          </TouchableOpacity>
        </View>

        {/* Ledger */}
        <Text style={styles.sectionTitle}>كشف الحساب ({ledger.length})</Text>
        {ledger.map(entry => (
          <Card key={entry.id}>
            <View style={styles.ledgerRow}>
              <View style={styles.ledgerInfo}>
                <Text style={[styles.ledgerType, { color: entry.type === SupplierLedgerType.PURCHASE ? COLORS.debtRed : COLORS.success }]}>
                  {LEDGER_TYPE_LABELS[entry.type]}
                </Text>
                <Text style={styles.ledgerDate}>{fmt(entry.createdAt)}</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: entry.type === SupplierLedgerType.PURCHASE ? COLORS.debtRed : COLORS.success }]}>
                {entry.type === SupplierLedgerType.PAYMENT ? '-' : '+'}{entry.amount.toLocaleString('ar-EG')} {CURRENCY}
              </Text>
            </View>
          </Card>
        ))}
        {ledger.length === 0 && <Text style={styles.empty}>لا توجد حركات</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
      <Text style={{ color: COLORS.textPrimary }}>{value}</Text>
      <Text style={{ color: COLORS.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  balanceLabel: { fontSize: 14, color: COLORS.textSecondary },
  balanceValue: { fontSize: 20, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', marginBottom: 16 },
  actionBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8 },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ledgerInfo: { flex: 1 },
  ledgerType: { fontSize: 15, fontWeight: 'bold' },
  ledgerDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  ledgerAmount: { fontSize: 16, fontWeight: 'bold' },
  empty: { color: COLORS.textSecondary, textAlign: 'center', padding: 16 },
});
