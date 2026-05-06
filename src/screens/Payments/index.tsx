import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getPayments } from '../../api';
import { Payment } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS, CURRENCY, PAYMENT_METHOD_LABELS } from '../../constants/theme';

export default function PaymentsScreen({ navigation }: any) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setPayments(await getPayments());
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={payments}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="💳" message="لا توجد مدفوعات" />}
        renderItem={({ item: p }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.customer}>{p.customer?.name}</Text>
                <Text style={styles.meta}>
                  {PAYMENT_METHOD_LABELS[p.method]} • {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                </Text>
                {p.notes && <Text style={styles.notes}>{p.notes}</Text>}
              </View>
              <Text style={styles.amount}>{p.amount.toLocaleString('ar-EG')} {CURRENCY}</Text>
            </View>
          </Card>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddPayment', {})}>
        <Text style={styles.fabText}>+ دفعة</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  customer: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right' },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, textAlign: 'right' },
  notes: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 2, textAlign: 'right' },
  amount: { fontSize: 18, fontWeight: 'bold', color: COLORS.success },
  fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
