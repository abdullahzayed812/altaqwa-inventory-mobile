import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCustomers, getProducts, createOrder } from '../../api';
import { Customer, Product } from '../../types';
import { COLORS, CURRENCY } from '../../constants/theme';

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export default function CreateOrderScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qty, setQty] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getProducts()])
      .then(([c, p]) => { setCustomers(c); setProducts(p); })
      .catch(console.error);
  }, []);

  const total = cart.reduce((s, i) => s + i.quantity * i.price, 0);

  const addToCart = () => {
    if (!selectedProduct) { Alert.alert('خطأ', 'اختر منتجاً'); return; }
    const q = parseInt(qty);
    if (!q || q <= 0) { Alert.alert('خطأ', 'أدخل كمية صحيحة'); return; }
    if (q > selectedProduct.stock) { Alert.alert('خطأ', `المخزون المتاح: ${selectedProduct.stock} فقط`); return; }
    setCart(prev => {
      const existing = prev.find(i => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map(i => i.productId === selectedProduct.id
          ? { ...i, quantity: i.quantity + q }
          : i
        );
      }
      return [...prev, { productId: selectedProduct.id, productName: selectedProduct.name, quantity: q, price: selectedProduct.price }];
    });
    setSelectedProduct(null);
    setQty('1');
  };

  const submit = async () => {
    if (!selectedCustomer) { Alert.alert('خطأ', 'اختر عميلاً'); return; }
    if (cart.length === 0) { Alert.alert('خطأ', 'أضف منتجاً على الأقل'); return; }
    setSaving(true);
    try {
      await createOrder({
        customerId: selectedCustomer.id,
        totalAmount: total,
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
          {/* Customer Selection */}
          <Text style={styles.sectionTitle}>اختر العميل *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {customers.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedCustomer?.id === c.id && styles.chipSelected]}
                onPress={() => setSelectedCustomer(c)}
              >
                <Text style={[styles.chipText, selectedCustomer?.id === c.id && { color: '#fff' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product Selection */}
          <Text style={styles.sectionTitle}>اختر منتجاً</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {products.filter(p => p.stock > 0).map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, selectedProduct?.id === p.id && styles.chipSelected]}
                onPress={() => setSelectedProduct(p)}
              >
                <Text style={[styles.chipText, selectedProduct?.id === p.id && { color: '#fff' }]}>{p.name}</Text>
                <Text style={[styles.chipSub, selectedProduct?.id === p.id && { color: 'rgba(255,255,255,0.8)' }]}>
                  {p.price} {CURRENCY} | {p.stock} وحدة
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedProduct && (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
                <Text style={styles.addBtnText}>إضافة</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                textAlign="center"
              />
              <Text style={styles.qtyLabel}>{selectedProduct.name}</Text>
            </View>
          )}

          {/* Cart */}
          {cart.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>السلة</Text>
              {cart.map(item => (
                <View key={item.productId} style={styles.cartItem}>
                  <TouchableOpacity onPress={() => setCart(prev => prev.filter(i => i.productId !== item.productId))}>
                    <Text style={{ color: COLORS.danger, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.cartItemName}>{item.productName}</Text>
                    <Text style={styles.cartItemMeta}>{item.quantity} × {item.price} {CURRENCY}</Text>
                  </View>
                  <Text style={styles.cartItemTotal}>{(item.quantity * item.price).toLocaleString('ar-EG')} {CURRENCY}</Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>{total.toLocaleString('ar-EG')} {CURRENCY}</Text>
                <Text style={styles.totalLabel}>الإجمالي</Text>
              </View>
            </>
          )}

          <TouchableOpacity style={[styles.submitBtn, saving && styles.btnDisabled]} onPress={submit} disabled={saving}>
            <Text style={styles.submitBtnText}>{saving ? 'جاري الحفظ...' : `تأكيد الطلب — ${total.toLocaleString('ar-EG')} ${CURRENCY}`}</Text>
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
  chipSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 8 },
  qtyLabel: { flex: 1, textAlign: 'right', fontSize: 14, color: COLORS.textPrimary },
  qtyInput: { width: 60, backgroundColor: COLORS.background, borderRadius: 6, padding: 8, fontSize: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary },
  addBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'right' },
  cartItemMeta: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
  cartItemTotal: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: COLORS.primaryDark, borderRadius: 8, marginBottom: 16 },
  totalLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  totalValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
