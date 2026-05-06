import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllPurchases } from '../../api';
import { Purchase } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS, CURRENCY } from '../../constants/theme';

export default function PurchasesScreen() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setPurchases(await getAllPurchases());
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
        data={purchases}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🛒" message="لا توجد مشتريات" />}
        renderItem={({ item: p }) => (
          <Card>
            <View style={styles.header}>
              <Text style={styles.date}>{new Date(p.createdAt).toLocaleDateString('ar-EG')}</Text>
              <Text style={styles.total}>{p.totalAmount.toLocaleString('ar-EG')} {CURRENCY}</Text>
            </View>
            <Text style={styles.supplier}>{p.supplier?.name}</Text>
            {(p.items ?? []).map(item => (
              <Text key={item.id} style={styles.itemLine}>
                • {item.product?.name ?? `منتج #${item.productId}`} × {item.quantity} بسعر {item.price} {CURRENCY}
              </Text>
            ))}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  total: { fontSize: 17, fontWeight: 'bold', color: COLORS.primary },
  supplier: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8 },
  itemLine: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'right', marginBottom: 2 },
});
