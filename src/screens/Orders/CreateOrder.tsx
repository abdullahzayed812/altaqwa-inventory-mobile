import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCustomers, getProducts, createOrder } from "../../api";
import { Customer, Product } from "../../types";
import { COLORS, CURRENCY } from "../../constants/theme";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

function Dropdown<T extends { id: number; name: string }>({
  label,
  items,
  selected,
  onSelect,
  renderSub,
}: {
  label: string;
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  renderSub?: (item: T) => string;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (item: T) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <View style={dd.wrapper}>
      <TouchableOpacity style={[dd.trigger, open && dd.triggerOpen]} onPress={() => setOpen((v) => !v)}>
        <Text style={selected ? dd.triggerText : dd.placeholder} numberOfLines={1}>
          {selected ? selected.name : label}
        </Text>
        <Text style={dd.arrow}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={dd.list}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[dd.option, selected?.id === item.id && dd.optionSelected]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[dd.optionText, selected?.id === item.id && dd.optionTextSelected]}>{item.name}</Text>
                {renderSub && (
                  <Text style={[dd.optionSub, selected?.id === item.id && dd.optionSubSelected]}>{renderSub(item)}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function CreateOrderScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qty, setQty] = useState("1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getProducts()])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(p);
      })
      .catch(console.error);
  }, []);

  const total = cart.reduce((s, i) => s + i.quantity * i.price, 0);

  const addToCart = () => {
    if (!selectedProduct) {
      Alert.alert("خطأ", "اختر منتجاً");
      return;
    }
    const q = parseInt(qty);
    if (!q || q <= 0) {
      Alert.alert("خطأ", "أدخل كمية صحيحة");
      return;
    }
    if (q > selectedProduct.stock) {
      Alert.alert("خطأ", `المخزون المتاح: ${selectedProduct.stock} فقط`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map((i) => (i.productId === selectedProduct.id ? { ...i, quantity: i.quantity + q } : i));
      }
      return [...prev, { productId: selectedProduct.id, productName: selectedProduct.name, quantity: q, price: selectedProduct.price }];
    });
    setSelectedProduct(null);
    setQty("1");
  };

  const submit = async () => {
    if (!selectedCustomer) {
      Alert.alert("خطأ", "اختر عميلاً");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("خطأ", "أضف منتجاً على الأقل");
      return;
    }
    setSaving(true);
    try {
      await createOrder({
        customerId: selectedCustomer.id,
        totalAmount: total,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Customer Dropdown */}
          <Text style={styles.sectionTitle}>اختر العميل *</Text>
          <Dropdown
            label="-- اختر عميلاً --"
            items={customers}
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
          />

          {/* Product Dropdown */}
          <Text style={styles.sectionTitle}>اختر منتجاً</Text>
          <Dropdown
            label="-- اختر منتجاً --"
            items={products.filter((p) => p.stock > 0)}
            selected={selectedProduct}
            onSelect={setSelectedProduct}
            renderSub={(p) => `${p.price} ${CURRENCY} | ${p.stock} وحدة`}
          />

          {selectedProduct && (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
                <Text style={styles.addBtnText}>إضافة</Text>
              </TouchableOpacity>
              <TextInput style={styles.qtyInput} value={qty} onChangeText={setQty} keyboardType="numeric" textAlign="center" />
              <Text style={styles.qtyLabel}>{selectedProduct.name}</Text>
            </View>
          )}

          {/* Cart */}
          {cart.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>السلة</Text>
              {cart.map((item) => (
                <View key={item.productId} style={styles.cartItem}>
                  <TouchableOpacity onPress={() => setCart((prev) => prev.filter((i) => i.productId !== item.productId))}>
                    <Text style={{ color: COLORS.danger, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.cartItemName}>{item.productName}</Text>
                    <Text style={styles.cartItemMeta}>
                      {item.quantity} × {item.price} {CURRENCY}
                    </Text>
                  </View>
                  <Text style={styles.cartItemTotal}>
                    {(item.quantity * item.price).toLocaleString("ar-EG")} {CURRENCY}
                  </Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>
                  {total.toLocaleString("ar-EG")} {CURRENCY}
                </Text>
                <Text style={styles.totalLabel}>الإجمالي</Text>
              </View>
            </>
          )}

          <TouchableOpacity style={[styles.submitBtn, saving && styles.btnDisabled]} onPress={submit} disabled={saving}>
            <Text style={styles.submitBtnText}>{saving ? "جاري الحفظ..." : `تأكيد الطلب  ${total.toLocaleString("ar-EG")} ${CURRENCY}`}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const dd = StyleSheet.create({
  wrapper: { marginBottom: 12, zIndex: 10 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerOpen: { borderColor: COLORS.primary, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  placeholder: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  arrow: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 8 },
  list: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionSelected: { backgroundColor: COLORS.primary },
  optionText: { fontSize: 14, color: COLORS.textPrimary },
  optionTextSelected: { color: "#fff", fontWeight: "600" },
  optionSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  optionSubSelected: { color: "rgba(255,255,255,0.8)" },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 8, marginTop: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 8 },
  qtyLabel: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  qtyInput: {
    width: 60,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
  },
  addBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "bold" },
  cartItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  cartItemName: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  cartItemMeta: { fontSize: 12, color: COLORS.textSecondary },
  cartItemTotal: { fontSize: 14, fontWeight: "bold", color: COLORS.primary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", padding: 14, backgroundColor: COLORS.primaryDark, borderRadius: 8, marginBottom: 16 },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  totalValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
