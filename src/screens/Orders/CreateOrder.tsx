import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCustomers, getProducts, getDrivers, createOrder } from "../../api";
import { Customer, Product, Driver } from "../../types";
import { COLORS, CURRENCY } from "../../constants/theme";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  deliveryFeePerTon: number;
  totalDelivery: number;
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
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <Text style={[dd.optionText, selected?.id === item.id && dd.optionTextSelected]}>{item.name}</Text>
                {renderSub && <Text style={[dd.optionSub, selected?.id === item.id && dd.optionSubSelected]}>{renderSub(item)}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function CreateOrderScreen({ navigation }: any) {
  const [customerType, setCustomerType] = useState<"COMPANY" | "DRIVER">("COMPANY");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [deliveryDriver, setDeliveryDriver] = useState<Driver | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [deliveryFeePerTon, setDeliveryFeePerTon] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getProducts(), getDrivers()])
      .then(([c, p, d]) => {
        setCustomers(c);
        setProducts(p);
        setDrivers(d);
      })
      .catch(console.error);
  }, []);

  // When product changes, prefill price
  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setPrice(String(p.price));
  };

  const totalProductsAmount = cart.reduce((s, i) => s + i.quantity * i.price, 0);
  const totalDeliveryAmount = cart.reduce((s, i) => s + i.totalDelivery, 0);
  const total = totalProductsAmount - totalDeliveryAmount;

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
    const unitPrice = parseFloat(price);
    if (!unitPrice || unitPrice <= 0) {
      Alert.alert("خطأ", "أدخل سعراً صحيحاً");
      return;
    }
    const fee = parseFloat(deliveryFeePerTon) || 0;
    const itemTotalDelivery = q * fee;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === selectedProduct.id
            ? { ...i, quantity: i.quantity + q, price: unitPrice, deliveryFeePerTon: fee, totalDelivery: (i.quantity + q) * fee }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: q,
          price: unitPrice,
          deliveryFeePerTon: fee,
          totalDelivery: itemTotalDelivery,
        },
      ];
    });
    setSelectedProduct(null);
    setQty("1");
    setPrice("");
    setDeliveryFeePerTon("0");
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
        // customerType,
        customerId: selectedCustomer?.id,
        driverId: deliveryDriver?.id ?? null,
        totalAmount: total,
        totalDelivery: totalDeliveryAmount,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          deliveryFeePerTon: i.deliveryFeePerTon,
          totalDelivery: i.totalDelivery,
        })),
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
          {/* Customer Type Tabs */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>نوع العميل</Text>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, customerType === "COMPANY" && styles.activeTab]}
                onPress={() => setCustomerType("COMPANY")}
              >
                <Text style={styles.tabEmoji}>🏢</Text>
                <Text style={[styles.tabText, customerType === "COMPANY" && styles.activeTabText]}>شركة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, customerType === "DRIVER" && styles.activeTab]}
                onPress={() => setCustomerType("DRIVER")}
              >
                <Text style={styles.tabEmoji}>🚛</Text>
                <Text style={[styles.tabText, customerType === "DRIVER" && styles.activeTabText]}>سائق</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          {/* Customer Dropdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>العميل *</Text>
            <Dropdown
              label="-- اختر عميلاً --"
              items={customers}
              selected={selectedCustomer}
              onSelect={setSelectedCustomer}
              renderSub={(c) => `المديونية: ${(c as any).totalDebt?.toLocaleString?.("ar-EG") ?? 0} ${CURRENCY}`}
            />
          </View>

          {/* Delivery Driver */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>سائق التوصيل (الناولون)</Text>
            <Dropdown
              label="-- بدون سائق --"
              items={drivers}
              selected={deliveryDriver}
              onSelect={setDeliveryDriver}
              renderSub={(d) => (d.vehiclePlate ? `🚗 ${d.vehiclePlate}` : d.phone ?? "")}
            />
            {deliveryDriver && (
              <TouchableOpacity onPress={() => setDeliveryDriver(null)}>
                <Text style={{ color: COLORS.danger, textAlign: "right", marginTop: 6, fontSize: 13 }}>✕ إلغاء تحديد السائق</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Product Dropdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المنتج</Text>
            <Dropdown
              label="-- اختر منتجاً --"
              items={products.filter((p) => p.stock > 0)}
              selected={selectedProduct}
              onSelect={handleSelectProduct}
              renderSub={(p) => `السعر: ${p.price} ${CURRENCY} | المخزون: ${p.stock} وحدة`}
            />
          </View>

          {selectedProduct && (
            <View style={styles.itemFormCard}>
              <Text style={styles.itemFormTitle}>{selectedProduct.name}</Text>

              <View style={styles.inputsGrid}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>الكمية (طن)</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      value={qty}
                      onChangeText={setQty}
                      keyboardType="numeric"
                      textAlign="center"
                      placeholder="0"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>سعر الوحدة ({CURRENCY})</Text>
                  <View style={[styles.inputBox, styles.inputBoxHighlight]}>
                    <TextInput
                      style={[styles.input, styles.inputHighlighted]}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                      textAlign="center"
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ناولون / طن</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      value={deliveryFeePerTon}
                      onChangeText={setDeliveryFeePerTon}
                      keyboardType="numeric"
                      textAlign="center"
                      placeholder="0"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
              </View>

              {/* Live preview */}
              {parseFloat(price) > 0 && parseInt(qty) > 0 && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>إجمالي:</Text>
                  <Text style={styles.previewValue}>
                    {((parseFloat(price) || 0) * (parseInt(qty) || 0) - (parseFloat(deliveryFeePerTon) || 0) * (parseInt(qty) || 0)).toLocaleString("ar-EG")}{" "}
                    {CURRENCY}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
                <Text style={styles.addBtnText}>+ إضافة للسلة</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cart */}
          {cart.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>السلة ({cart.length})</Text>
              {cart.map((item) => (
                <View key={item.productId} style={styles.cartCard}>
                  <View style={styles.cartCardHeader}>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setCart((prev) => prev.filter((i) => i.productId !== item.productId))}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.cartItemName}>{item.productName}</Text>
                  </View>
                  <View style={styles.cartCardBody}>
                    <View style={styles.cartDetailRow}>
                      <Text style={styles.cartDetailValue}>{item.quantity} طن</Text>
                      <Text style={styles.cartDetailLabel}>الكمية</Text>
                    </View>
                    <View style={styles.cartDetailDivider} />
                    <View style={styles.cartDetailRow}>
                      <Text style={styles.cartDetailValue}>
                        {item.price} {CURRENCY}
                      </Text>
                      <Text style={styles.cartDetailLabel}>السعر</Text>
                    </View>
                    {item.deliveryFeePerTon > 0 && (
                      <>
                        <View style={styles.cartDetailDivider} />
                        <View style={styles.cartDetailRow}>
                          <Text style={styles.cartDetailValue}>
                            {item.deliveryFeePerTon} {CURRENCY}
                          </Text>
                          <Text style={styles.cartDetailLabel}>ناولون/طن</Text>
                        </View>
                      </>
                    )}
                    <View style={styles.cartDetailDivider} />
                    <View style={styles.cartDetailRow}>
                      <Text style={[styles.cartDetailValue, { color: COLORS.primary, fontWeight: "bold" }]}>
                        {(item.quantity * item.price - item.totalDelivery).toLocaleString("ar-EG")} {CURRENCY}
                      </Text>
                      <Text style={styles.cartDetailLabel}>الإجمالي</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Totals */}
              <View style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalSubValue}>
                    {totalProductsAmount.toLocaleString("ar-EG")} {CURRENCY}
                  </Text>
                  <Text style={styles.totalSubLabel}>إجمالي المنتجات</Text>
                </View>
                {totalDeliveryAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalSubValue}>
                      - {totalDeliveryAmount.toLocaleString("ar-EG")} {CURRENCY}
                    </Text>
                    <Text style={styles.totalSubLabel}>الناولون (خصم)</Text>
                  </View>
                )}
                <View style={styles.totalDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalFinalValue}>
                    {total.toLocaleString("ar-EG")} {CURRENCY}
                  </Text>
                  <Text style={styles.totalFinalLabel}>الإجمالي الكلي</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (saving || cart.length === 0 || !selectedCustomer) && styles.btnDisabled]}
            onPress={submit}
            disabled={saving || cart.length === 0 || !selectedCustomer}
          >
            <Text style={styles.submitBtnText}>{saving ? "جاري الحفظ..." : `✅ تأكيد الطلب  •  ${total.toLocaleString("ar-EG")} ${CURRENCY}`}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const dd = StyleSheet.create({
  wrapper: { marginBottom: 4, zIndex: 10 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  triggerOpen: { borderColor: COLORS.primary, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, textAlign: "right" },
  placeholder: { flex: 1, fontSize: 14, color: COLORS.textSecondary, textAlign: "right" },
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
  optionText: { fontSize: 14, color: COLORS.textPrimary, textAlign: "right" },
  optionTextSelected: { color: "#fff", fontWeight: "600" },
  optionSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: "right" },
  optionSubSelected: { color: "rgba(255,255,255,0.8)" },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },

  section: { marginBottom: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },

  // Customer type tabs
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, flexDirection: "column", gap: 2 },
  activeTab: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabEmoji: { fontSize: 20 },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  activeTabText: { color: "#fff" },

  // Item form card
  itemFormCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "44",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemFormTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, textAlign: "right", marginBottom: 12 },

  inputsGrid: { flexDirection: "row", gap: 8, marginBottom: 10 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 5, textAlign: "center", fontWeight: "600" },
  inputBox: { backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  inputBoxHighlight: { borderColor: COLORS.primary, borderWidth: 1.5 },
  input: { padding: 10, fontSize: 15, color: COLORS.textPrimary, fontWeight: "600" },
  inputHighlighted: { color: COLORS.primary },

  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary + "14",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  previewLabel: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  previewValue: { fontSize: 15, color: COLORS.primary, fontWeight: "bold" },

  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  // Cart
  cartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cartCardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 10,
  },
  cartItemName: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, textAlign: "right" },
  removeBtn: { backgroundColor: COLORS.danger + "18", borderRadius: 20, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: COLORS.danger, fontSize: 14, fontWeight: "bold" },
  cartCardBody: { flexDirection: "row", flexWrap: "wrap" },
  cartDetailRow: { flex: 1, minWidth: 70, alignItems: "center", padding: 10 },
  cartDetailLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 3, fontWeight: "600" },
  cartDetailValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600" },
  cartDetailDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 8 },

  // Totals
  totalCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  totalSubLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  totalSubValue: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600" },
  totalDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 6 },
  totalFinalLabel: { color: "#fff", fontSize: 16, fontWeight: "700" },
  totalFinalValue: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  // Submit
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
