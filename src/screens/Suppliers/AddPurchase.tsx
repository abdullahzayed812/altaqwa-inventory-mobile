import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProducts, createPurchase, addSupplierPayment } from "../../api";
import { Product, Supplier } from "../../types";
import { COLORS, CURRENCY } from "../../constants/theme";

interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

function ProductDropdown({
  products,
  selected,
  onSelect,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (p: Product) => {
    onSelect(p);
    setOpen(false);
  };

  return (
    <View style={dd.wrapper}>
      <TouchableOpacity style={[dd.trigger, open && dd.triggerOpen]} onPress={() => setOpen((v) => !v)}>
        <Text style={selected ? dd.triggerText : dd.placeholder} numberOfLines={1}>
          {selected ? selected.name : "-- اختر منتجاً --"}
        </Text>
        <Text style={dd.arrow}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={dd.list}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[dd.option, selected?.id === p.id && dd.optionSelected]}
                onPress={() => handleSelect(p)}
              >
                <Text style={[dd.optionText, selected?.id === p.id && dd.optionTextSelected]}>{p.name}</Text>
                <Text style={[dd.optionSub, selected?.id === p.id && dd.optionSubSelected]}>
                  {p.price} {CURRENCY}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function AddPurchaseScreen({ route, navigation }: any) {
  const supplier: Supplier = route.params.supplier;
  const isPayment: boolean = route.params.isPayment ?? false;

  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPayment) {
      getProducts().then(setProducts).catch(console.error);
    }
  }, [isPayment]);

  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setPrice(String(p.price));
  };

  const addItem = () => {
    if (!selectedProduct || !qty || !price) {
      Alert.alert("خطأ", "اختر منتج وأدخل الكمية والسعر");
      return;
    }
    const q = parseInt(qty);
    const p = parseFloat(price);
    if (q <= 0 || isNaN(p) || p <= 0) {
      Alert.alert("خطأ", "كمية وسعر غير صالحين");
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === selectedProduct.id);
      if (existing) return prev.map((i) => (i.productId === selectedProduct.id ? { ...i, quantity: i.quantity + q, price: p } : i));
      return [...prev, { productId: selectedProduct.id, productName: selectedProduct.name, quantity: q, price: p }];
    });
    setSelectedProduct(null);
    setQty("");
    setPrice("");
  };

  const submit = async () => {
    if (isPayment) {
      const amt = parseFloat(payAmount);
      if (!amt || amt <= 0) {
        Alert.alert("خطأ", "أدخل مبلغ صحيح");
        return;
      }
      setSaving(true);
      try {
        await addSupplierPayment(supplier.id, { amount: amt, note: payNote.trim() || undefined });
        navigation.goBack();
      } catch (e: any) {
        Alert.alert("خطأ", e.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (items.length === 0) {
      Alert.alert("خطأ", "أضف منتجاً على الأقل");
      return;
    }
    setSaving(true);
    try {
      await createPurchase({
        supplierId: supplier.id,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isPayment) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.supplierName}>المورد: {supplier.name}</Text>
          <Label text="المبلغ *" />
          <Input value={payAmount} onChangeText={setPayAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <Label text="ملاحظة" />
          <Input value={payNote} onChangeText={setPayNote} placeholder="ملاحظة اختيارية" multiline />
          <TouchableOpacity style={[styles.submitBtn, saving && styles.btnDisabled]} onPress={submit} disabled={saving}>
            <Text style={styles.submitBtnText}>{saving ? "جاري الحفظ..." : "تسجيل الدفعة"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.supplierName}>المورد: {supplier.name}</Text>

          <Text style={styles.sectionTitle}>اختر منتجاً</Text>
          <ProductDropdown products={products} selected={selectedProduct} onSelect={handleSelectProduct} />

          {selectedProduct && (
            <View style={styles.itemForm}>
              <Text style={styles.selectedProduct}>{selectedProduct.name}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.smallInput, { flex: 1, marginLeft: 8 }]}
                  placeholder="الكمية"
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TextInput
                  style={[styles.smallInput, { flex: 1 }]}
                  placeholder="السعر"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <Text style={styles.addItemBtnText}>إضافة</Text>
              </TouchableOpacity>
            </View>
          )}

          {items.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>الأصناف المضافة</Text>
              {items.map((item) => (
                <View key={item.productId} style={styles.itemRow}>
                  <TouchableOpacity onPress={() => setItems((prev) => prev.filter((i) => i.productId !== item.productId))}>
                    <Text style={{ color: COLORS.danger, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} × {item.price} {CURRENCY}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
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
            <Text style={styles.submitBtnText}>{saving ? "جاري الحفظ..." : "تسجيل الفاتورة"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ color: COLORS.textSecondary, marginBottom: 4, marginTop: 12 }}>{text}</Text>;
}
function Input(props: any) {
  return (
    <TextInput
      style={{ backgroundColor: COLORS.card, borderRadius: 8, padding: 12, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 }}
      placeholderTextColor={COLORS.textSecondary}
      {...props}
    />
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
  option: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  optionSelected: { backgroundColor: COLORS.primary },
  optionText: { fontSize: 14, color: COLORS.textPrimary },
  optionTextSelected: { color: "#fff", fontWeight: "600" },
  optionSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  optionSubSelected: { color: "rgba(255,255,255,0.8)" },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  supplierName: { fontSize: 16, fontWeight: "bold", color: COLORS.primary, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 8, marginTop: 8 },
  itemForm: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 12 },
  selectedProduct: { fontSize: 15, fontWeight: "bold", marginBottom: 8, color: COLORS.textPrimary },
  inputRow: { flexDirection: "row", marginBottom: 8 },
  smallInput: { backgroundColor: COLORS.background, borderRadius: 8, padding: 10, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  addItemBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 10, alignItems: "center" },
  addItemBtnText: { color: "#fff", fontWeight: "bold" },
  itemRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemName: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  itemMeta: { fontSize: 12, color: COLORS.textSecondary },
  itemTotal: { fontSize: 14, fontWeight: "bold", color: COLORS.primary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: COLORS.primaryDark, borderRadius: 8, marginBottom: 16 },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  totalValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
