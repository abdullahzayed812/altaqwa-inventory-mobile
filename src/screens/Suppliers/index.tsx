import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getSuppliers } from '../../api';
import { Supplier } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS, CURRENCY } from '../../constants/theme';

export default function SuppliersScreen({ navigation }: any) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      setFiltered(data);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  React.useEffect(() => {
    if (!search.trim()) { setFiltered(suppliers); return; }
    const q = search.toLowerCase();
    setFiltered(suppliers.filter(s => s.name.toLowerCase().includes(q) || s.phone?.includes(q)));
  }, [search, suppliers]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={s => String(s.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🏭" message="لا يوجد موردون" />}
        renderItem={({ item: s }) => (
          <Card onPress={() => navigation.navigate('SupplierDetails', { supplier: s })}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{s.name}</Text>
                {s.phone && <Text style={styles.sub}>{s.phone}</Text>}
              </View>
              <View style={styles.balanceBox}>
                <Text style={[styles.balance, s.totalBalance > 0 && styles.balanceBlue]}>
                  {s.totalBalance.toLocaleString('ar-EG')}
                </Text>
                <Text style={styles.balanceLabel}>{CURRENCY}</Text>
              </View>
            </View>
          </Card>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddSupplier')}>
        <Text style={styles.fabText}>+ مورد</Text>
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
  balanceBox: { alignItems: 'center' },
  balance: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  balanceBlue: { color: COLORS.balanceBlue },
  balanceLabel: { fontSize: 11, color: COLORS.textSecondary },
  fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
