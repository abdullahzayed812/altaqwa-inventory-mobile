import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getPayments, getOrders } from '../../api';
import { Customer, Payment, Order } from '../../types';
import Card from '../../components/Card';
import { COLORS, CURRENCY, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '../../constants/theme';

export default function CustomerDetailsScreen({ route, navigation }: any) {
  const customer: Customer = route.params.customer;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [allPayments, allOrders] = await Promise.all([getPayments(), getOrders()]);
      setPayments(allPayments.filter(p => p.customerId === customer.id));
      setOrders(allOrders.filter(o => o.customerId === customer.id));
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
          <Text style={styles.name}>{customer.name}</Text>
          {customer.phone && <Row label="الهاتف" value={customer.phone} />}
          {customer.address && <Row label="العنوان" value={customer.address} />}
          <View style={styles.debtRow}>
            <Text style={styles.debtLabel}>المديونية</Text>
            <Text style={[styles.debtValue, { color: customer.totalDebt > 0 ? COLORS.debtRed : COLORS.success }]}>
              {customer.totalDebt.toLocaleString('ar-EG')} {CURRENCY}
            </Text>
          </View>
        </Card>

        {/* Add Payment Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddPayment', { customer })}
        >
          <Text style={styles.actionBtnText}>+ إضافة دفعة</Text>
        </TouchableOpacity>

        {/* Payments */}
        <Text style={styles.sectionTitle}>المدفوعات ({payments.length})</Text>
        {payments.map(p => (
          <Card key={p.id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.amount}>{p.amount.toLocaleString('ar-EG')} {CURRENCY}</Text>
                <Text style={styles.meta}>{PAYMENT_METHOD_LABELS[p.method]} • {fmt(p.createdAt)}</Text>
                {p.notes && <Text style={styles.meta}>{p.notes}</Text>}
              </View>
              <Text style={styles.checkmark}>✅</Text>
            </View>
          </Card>
        ))}
        {payments.length === 0 && <Text style={styles.empty}>لا توجد مدفوعات</Text>}

        {/* Orders */}
        <Text style={styles.sectionTitle}>الطلبات ({orders.length})</Text>
        {orders.map(o => (
          <Card key={o.id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.orderNum}>{o.orderNumber}</Text>
                <Text style={styles.amount}>{o.totalAmount.toLocaleString('ar-EG')} {CURRENCY}</Text>
                <Text style={styles.meta}>{fmt(o.createdAt)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: ORDER_STATUS_COLORS[o.status] }]}>
                <Text style={styles.statusText}>{ORDER_STATUS_LABELS[o.status]}</Text>
              </View>
            </View>
          </Card>
        ))}
        {orders.length === 0 && <Text style={styles.empty}>لا توجد طلبات</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
      <Text style={{ color: COLORS.textPrimary }}>{value}</Text>
      <Text style={{ color: COLORS.textSecondary, marginLeft: 8 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8 },
  debtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  debtLabel: { fontSize: 14, color: COLORS.textSecondary },
  debtValue: { fontSize: 20, fontWeight: 'bold' },
  actionBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, marginBottom: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right' },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  orderNum: { fontSize: 13, color: COLORS.textSecondary },
  checkmark: { fontSize: 24 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { color: COLORS.textSecondary, textAlign: 'center', padding: 16 },
});
