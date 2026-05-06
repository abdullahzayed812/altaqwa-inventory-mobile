import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getProducts, createProduct } from '../../api';
import { Product } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS, CURRENCY } from '../../constants/theme';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setProducts(await getProducts());
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    if (!name.trim() || !price || !stock) { Alert.alert('خطأ', 'جميع الحقول مطلوبة'); return; }
    const p = parseFloat(price);
    const s = parseInt(stock);
    if (isNaN(p) || isNaN(s)) { Alert.alert('خطأ', 'سعر ومخزون غير صالحين'); return; }
    setSaving(true);
    try {
      await createProduct({ name: name.trim(), price: p, stock: s });
      setModalVisible(false);
      setName(''); setPrice(''); setStock('');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={products}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<EmptyState icon="🌾" message="لا توجد منتجات" />}
        renderItem={({ item: p }) => (
          <Card style={[styles.productCard, p.stock < 10 && styles.lowStockCard]}>
            {p.stock < 10 && <Text style={styles.lowStockBadge}>مخزون منخفض ⚠️</Text>}
            <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
            <Text style={styles.productPrice}>{p.price.toLocaleString('ar-EG')} {CURRENCY}</Text>
            <View style={[styles.stockBadge, p.stock < 10 && { backgroundColor: COLORS.warning }]}>
              <Text style={styles.stockText}>{p.stock} وحدة</Text>
            </View>
          </Card>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ منتج</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>منتج جديد</Text>
              <Label text="الاسم *" />
              <Input value={name} onChangeText={setName} placeholder="اسم المنتج" />
              <Label text="السعر *" />
              <Input value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
              <Label text="المخزون الابتدائي *" />
              <Input value={stock} onChangeText={setStock} placeholder="0" keyboardType="numeric" />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? '...' : 'حفظ'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ textAlign: 'right', color: COLORS.textSecondary, marginBottom: 4, marginTop: 8, fontSize: 13 }}>{text}</Text>;
}
function Input(props: any) {
  return <TextInput style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 10, fontSize: 14, color: COLORS.textPrimary, textAlign: 'right', borderWidth: 1, borderColor: COLORS.border }} placeholderTextColor={COLORS.textSecondary} {...props} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, paddingBottom: 80 },
  row: { justifyContent: 'space-between' },
  productCard: { flex: 0.48, margin: 4, padding: 12 },
  lowStockCard: { borderWidth: 1, borderColor: COLORS.warning },
  lowStockBadge: { fontSize: 10, color: COLORS.warning, textAlign: 'right', marginBottom: 4 },
  productName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8, minHeight: 36 },
  productPrice: { fontSize: 15, color: COLORS.primary, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  stockBadge: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-end' },
  stockText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8 },
  modalActions: { flexDirection: 'row', marginTop: 20, gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: 'bold' },
  saveBtn: { flex: 1, borderRadius: 10, padding: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
