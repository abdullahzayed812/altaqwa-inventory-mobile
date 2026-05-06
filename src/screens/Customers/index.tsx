import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getCustomers } from '../../api';
import { Customer } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS, CURRENCY } from '../../constants/theme';

export default function CustomersScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setFiltered(data);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    if (!search.trim()) { setFiltered(customers); return; }
    const q = search.toLowerCase();
    setFiltered(customers.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q)));
  }, [search, customers]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث بالاسم أو الهاتف..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="👥" message="لا يوجد عملاء" />}
        renderItem={({ item: c }) => (
          <Card onPress={() => navigation.navigate('CustomerDetails', { customer: c })}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{c.name}</Text>
                {c.phone && <Text style={styles.sub}>{c.phone}</Text>}
                {c.address && <Text style={styles.sub} numberOfLines={1}>{c.address}</Text>}
              </View>
              <View style={styles.debtBox}>
                <Text style={[styles.debt, c.totalDebt > 0 && styles.debtRed]}>
                  {c.totalDebt.toLocaleString('ar-EG')}
                </Text>
                <Text style={styles.debtLabel}>{CURRENCY}</Text>
              </View>
            </View>
          </Card>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddCustomer')}>
        <Text style={styles.fabText}>+ عميل</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { padding: 12, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: { backgroundColor: COLORS.background, borderRadius: 8, padding: 10, fontSize: 15, color: COLORS.textPrimary },
  list: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right' },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textAlign: 'right' },
  debtBox: { alignItems: 'center' },
  debt: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  debtRed: { color: COLORS.debtRed },
  debtLabel: { fontSize: 11, color: COLORS.textSecondary },
  fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
