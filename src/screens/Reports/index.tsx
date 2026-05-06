import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getReportData } from '../../api';
import { ReportData } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS, CURRENCY } from '../../constants/theme';

export default function ReportsScreen() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setData(await getReportData());
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <LoadingSpinner />;

  const totalSales = (data?.recentSales ?? []).reduce((s, r) => s + r.total, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي المبيعات المسلمة</Text>
          <Text style={styles.summaryValue}>{totalSales.toLocaleString('ar-EG')} {CURRENCY}</Text>
          <Text style={styles.summaryCount}>{data?.recentSales.length ?? 0} طلب مسلم</Text>
        </Card>

        <Text style={styles.sectionTitle}>أرصدة العملاء</Text>
        {(data?.customerBalances ?? []).map(c => (
          <Card key={c.id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.customerName}>{c.name}</Text>
                {c.phone && <Text style={styles.phone}>{c.phone}</Text>}
              </View>
              <Text style={[styles.debt, { color: c.totalDebt > 0 ? COLORS.debtRed : COLORS.success }]}>
                {c.totalDebt.toLocaleString('ar-EG')} {CURRENCY}
              </Text>
            </View>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>آخر المبيعات المسلمة</Text>
        {(data?.recentSales ?? []).slice(0, 20).map((s, i) => (
          <Card key={i}>
            <View style={styles.row}>
              <View>
                <Text style={styles.saleCustomer}>{s.customer}</Text>
                <Text style={styles.saleDate}>{new Date(s.date).toLocaleDateString('ar-EG')}</Text>
              </View>
              <Text style={styles.saleTotal}>{s.total.toLocaleString('ar-EG')} {CURRENCY}</Text>
            </View>
          </Card>
        ))}
        {(data?.recentSales.length ?? 0) === 0 && (
          <Text style={styles.empty}>لا توجد مبيعات مسلمة</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  summaryCard: { backgroundColor: COLORS.primaryDark, marginBottom: 16 },
  summaryTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'right' },
  summaryValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'right', marginVertical: 4 },
  summaryCount: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'right' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right' },
  phone: { fontSize: 13, color: COLORS.textSecondary },
  debt: { fontSize: 16, fontWeight: 'bold' },
  saleCustomer: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  saleDate: { fontSize: 12, color: COLORS.textSecondary },
  saleTotal: { fontSize: 15, fontWeight: 'bold', color: COLORS.success },
  empty: { color: COLORS.textSecondary, textAlign: 'center', padding: 24 },
});
