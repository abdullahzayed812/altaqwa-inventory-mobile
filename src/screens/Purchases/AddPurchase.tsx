import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSuppliers, getProducts, createPurchase } from '../../api';
import { Supplier, Product } from '../../types';
import { COLORS, CURRENCY } from '../../constants/theme';

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export default function AddPurchaseScreen({ navigation }: any) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSuppliers(), getProducts()])
      .then(([s, p]) => { setSuppliers(s); setProducts(p); })
      .catch(console.error);
  }, []);

  const total = cart.reduce((s, i) => s + i.quantity * i.price, 0);

  const addToCart = () => {
    if (!selectedProduct) { Alert.alert('خطأ', 'اختر منتجاً'); return; }
    const q = parseInt(qty);
    const p = parseFloat(price);
    if (!q || q <= 0 || isNaN(p) || p <= 0) { Alert.alert('خطأ', 'كمية وسعر غير صالحين'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map(i =>
          i.productId === selectedProduct.id ? { ...i, quantity: i.quantity + q, price: p } : i
        );
      }
      return [...prev, { productId: selectedProduct.id, productName: selectedProduct.name, quantity: q, price: p }];
    });
    setSelectedProduct(null);
    setQty('');
    setPrice('');
  };

  const submit = async () => {
    if (!selectedSupplier) { Alert.alert('خطأ', 'اختر مورداً'); return; }
    if (cart.length === 0) { Alert.alert('خطأ', 'أضف منتجاً على الأقل'); return; }
    setSaving(true);
    try {
      await createPurchase({
        supplierId: selectedSupplier.id,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Supplier selector */}
          <Text style={styles.sectionTitle}>اختر المورد *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {suppliers.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, selectedSupplier?.id === s.id && styles.chipSelected]}
                onPress={() => setSelectedSupplier(s)}
              >
                <Text style={[styles.chipText, selectedSupplier?.id === s.id && { color: '#fff' }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product selector */}
          <Text style={styles.sectionTitle}>اختر منتجاً</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {products.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, selectedProduct?.id === p.id && styles.chipSelected]}
                onPress={() => { setSelectedProduct(p); setPrice(String(p.price)); }}
              >
                <Text style={[styles.chipText, selectedProduct?.id === p.id && { color: '#fff' }]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedProduct && (
            <View style={styles.itemForm}>
              <Text style={styles.selectedName}>{selectedProduct.name}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.smallInput, { flex: 1, marginLeft: 8 }]}
                  placeholder="الكمية"
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  textAlign="right"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TextInput
                  style={[styles.smallInput, { flex: 1 }]}
                  placeholder="السعر"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  textAlign="right"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <TouchableOpacity style={styles.addItemBtn} onPress={addToCart}>
                <Text style={styles.addItemBtnText}>إضافة للفاتورة</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cart */}
          {cart.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>الأصناف المضافة</Text>
              {cart.map(item => (
                <View key={item.productId} style={styles.cartRow}>
                  <TouchableOpacity onPress={() => setCart(prev => prev.filter(i => i.productId !== item.productId))}>
                    <Text style={{ color: COLORS.danger, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.cartName}>{item.productName}</Text>
                    <Text style={styles.cartMeta}>{item.quantity} × {item.price} {CURRENCY}</Text>
                  </View>
                  <Text style={styles.cartTotal}>{(item.quantity * item.price).toLocaleString('ar-EG')} {CURRENCY}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>{total.toLocaleString('ar-EG')} {CURRENCY}</Text>
                <Text style={styles.totalLabel}>الإجمالي</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.btnDisabled]}
            onPress={submit}
            disabled={saving}
          >
            <Text style={styles.submitBtnText}>{saving ? 'جاري الحفظ...' : 'تسجيل الفاتورة'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 8, marginTop: 8 },
  chip: { backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: COLORS.border, minWidth: 80, alignItems: 'center' },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textPrimary, fontSize: 13 },
  itemForm: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 12 },
  selectedName: { fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 8, color: COLORS.textPrimary },
  inputRow: { flexDirection: 'row', marginBottom: 8 },
  smallInput: { backgroundColor: COLORS.background, borderRadius: 8, padding: 10, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  addItemBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 10, alignItems: 'center' },
  addItemBtnText: { color: '#fff', fontWeight: 'bold' },
  cartRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  cartName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'right' },
  cartMeta: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
  cartTotal: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: COLORS.primaryDark, borderRadius: 8, marginBottom: 16 },
  totalLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  totalValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
