import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getOrders, updateOrderStatus } from '../../api';
import { Order, OrderStatus } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS, CURRENCY, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../constants/theme';

const STATUS_FILTERS = [
  { label: 'الكل', value: 'ALL' },
  { label: 'انتظار', value: OrderStatus.PENDING },
  { label: 'توصيل', value: OrderStatus.ASSIGNED },
  { label: 'تم التسليم', value: OrderStatus.DELIVERED },
  { label: 'ملغي', value: OrderStatus.CANCELLED },
];

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setOrders(await getOrders());
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const changeStatus = (order: Order, status: OrderStatus) => {
    Alert.alert('تأكيد', `تغيير الحالة إلى "${ORDER_STATUS_LABELS[status]}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد',
        onPress: async () => {
          try {
            await updateOrderStatus(order.id, status);
            load();
          } catch (e: any) {
            Alert.alert('خطأ', e.message);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={o => String(o.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📦" message="لا توجد طلبات" />}
        renderItem={({ item: o }) => (
          <Card>
            <View style={styles.header}>
              <View style={[styles.statusBadge, { backgroundColor: ORDER_STATUS_COLORS[o.status] }]}>
                <Text style={styles.statusText}>{ORDER_STATUS_LABELS[o.status]}</Text>
              </View>
              <Text style={styles.orderNum}>{o.orderNumber}</Text>
            </View>
            <Text style={styles.customerName}>{o.customer?.name}</Text>
            <Text style={styles.total}>{o.totalAmount.toLocaleString('ar-EG')} {CURRENCY}</Text>
            <Text style={styles.date}>{new Date(o.createdAt).toLocaleDateString('ar-EG')}</Text>

            {/* Items preview */}
            {(o.items ?? []).slice(0, 2).map(item => (
              <Text key={item.id} style={styles.itemLine}>
                • {item.product?.name} × {item.quantity}
              </Text>
            ))}
            {(o.items?.length ?? 0) > 2 && (
              <Text style={styles.itemLine}>+ {(o.items!.length - 2)} منتجات أخرى</Text>
            )}

            {/* Status actions */}
            <View style={styles.actions}>
              {o.status === OrderStatus.PENDING && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={() => changeStatus(o, OrderStatus.DELIVERED)}>
                  <Text style={styles.actionBtnText}>تم التسليم</Text>
                </TouchableOpacity>
              )}
              {o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.DELIVERED && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger, marginRight: 8 }]} onPress={() => changeStatus(o, OrderStatus.CANCELLED)}>
                  <Text style={styles.actionBtnText}>إلغاء</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateOrder')}>
        <Text style={styles.fabText}>+ طلب</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  filterBar: { backgroundColor: COLORS.card, maxHeight: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16, paddingBottom: 80 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  orderNum: { fontSize: 13, color: COLORS.textSecondary },
  customerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 4 },
  total: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  date: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginBottom: 8 },
  itemLine: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'right', marginBottom: 2 },
  actions: { flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' },
  actionBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
