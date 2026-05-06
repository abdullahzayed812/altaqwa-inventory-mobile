import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboardStats } from '../../api';
import { DashboardStats } from '../../types';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS, CURRENCY } from '../../constants/theme';

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.title}>لوحة التحكم</Text>

        <View style={styles.statsRow}>
          <StatCard label="إجمالي المبيعات" value={stats?.totalSales ?? 0} icon="💰" color={COLORS.primary} isCurrency />
          <StatCard label="إجمالي المديونية" value={stats?.totalDebt ?? 0} icon="📋" color={COLORS.debtRed} isCurrency />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="إجمالي المدفوعات" value={stats?.totalPayments ?? 0} icon="✅" color={COLORS.success} isCurrency />
          <StatCard label="مخزون منخفض" value={stats?.lowStockCount ?? 0} icon="⚠️" color={COLORS.warning} />
        </View>

        <Text style={styles.sectionTitle}>أعلى المنتجات مخزوناً</Text>
        {(stats?.topProducts ?? []).map(product => (
          <Card key={product.id} style={styles.productCard}>
            <View style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  {product.price.toLocaleString('ar-EG')} {CURRENCY}
                </Text>
              </View>
              <View style={[styles.stockBadge, product.stock < 10 && styles.lowStockBadge]}>
                <Text style={styles.stockText}>{product.stock} وحدة</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16 },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    marginBottom: 16 
  },
  statsRow: { flexDirection: 'row', marginHorizontal: -6, marginBottom: 4 },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    marginTop: 20, 
    marginBottom: 12 
  },
  productCard: { paddingVertical: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  productPrice: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  stockBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  lowStockBadge: { backgroundColor: COLORS.warning },
  stockText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
