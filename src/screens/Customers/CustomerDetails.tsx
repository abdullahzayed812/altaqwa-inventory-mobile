import React, { useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getCustomerById, getCustomerPayments, getCustomerOrders } from "../../api";
import { Customer, Payment, Order } from "../../types";
import Card from "../../components/Card";
import DateRangePicker, { DateRange, toISO } from "../../components/DateRangePicker";
import { COLORS, CURRENCY, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from "../../constants/theme";

type Tab = "payments" | "orders";

const EMPTY_RANGE: DateRange = { startDate: null, endDate: null };

export default function CustomerDetailsScreen({ route, navigation }: any) {
  const [customer, setCustomer] = useState<Customer>(route.params.customer);

  const [activeTab, setActiveTab] = useState<Tab>("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [paySearch, setPaySearch] = useState("");
  const [payRange, setPayRange] = useState<DateRange>(EMPTY_RANGE);
  const [ordSearch, setOrdSearch] = useState("");
  const [ordRange, setOrdRange] = useState<DateRange>(EMPTY_RANGE);

  const payTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPayments = useCallback(
    async (keyword: string, range: DateRange) => {
      try {
        const data = await getCustomerPayments(customer.id, {
          keyword: keyword.trim() || undefined,
          startDate: range.startDate ? toISO(range.startDate) : undefined,
          endDate: range.endDate ? toISO(range.endDate) : undefined,
        });
        setPayments(data);
      } catch (e: any) {
        Alert.alert("خطأ", e.message);
      }
    },
    [customer.id],
  );

  const loadOrders = useCallback(
    async (keyword: string, range: DateRange) => {
      try {
        const data = await getCustomerOrders(customer.id, {
          keyword: keyword.trim() || undefined,
          startDate: range.startDate ? toISO(range.startDate) : undefined,
          endDate: range.endDate ? toISO(range.endDate) : undefined,
        });
        setOrders(data);
      } catch (e: any) {
        Alert.alert("خطأ", e.message);
      }
    },
    [customer.id],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setPaySearch("");
    setOrdSearch("");
    setPayRange(EMPTY_RANGE);
    setOrdRange(EMPTY_RANGE);
    try {
      const [fresh] = await Promise.all([
        getCustomerById(customer.id),
        loadPayments("", EMPTY_RANGE),
        loadOrders("", EMPTY_RANGE),
      ]);
      setCustomer(fresh);
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customer.id, loadPayments, loadOrders]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const onPaySearchChange = (text: string) => {
    setPaySearch(text);
    if (payTimer.current) clearTimeout(payTimer.current);
    payTimer.current = setTimeout(() => loadPayments(text, payRange), 400);
  };

  const onPayRangeChange = (range: DateRange) => {
    setPayRange(range);
    loadPayments(paySearch, range);
  };

  const onOrdSearchChange = (text: string) => {
    setOrdSearch(text);
    if (ordTimer.current) clearTimeout(ordTimer.current);
    ordTimer.current = setTimeout(() => loadOrders(text, ordRange), 400);
  };

  const onOrdRangeChange = (range: DateRange) => {
    setOrdRange(range);
    loadOrders(ordSearch, range);
  };

  const totalOrders = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);

  const fmt = (d: string | Date) => new Date(d).toLocaleDateString("ar-EG");

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAll();
            }}
          />
        }
      >
        {/* Info Card */}
        <Card>
          <Text style={styles.name}>{customer.name}</Text>
          {customer.phone && <InfoRow label="الهاتف" value={customer.phone} />}
          {customer.address && <InfoRow label="العنوان" value={customer.address} />}
          <View style={styles.debtRow}>
            <Text style={styles.debtLabel}>المديونية</Text>
            <Text style={[styles.debtValue, { color: customer.totalDebt > 0 ? COLORS.debtRed : COLORS.success }]}>
              {customer.totalDebt.toLocaleString("ar-EG")} {CURRENCY}
            </Text>
          </View>
        </Card>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("AddPayment", { customer })}>
          <Text style={styles.actionBtnText}>+ إضافة دفعة</Text>
        </TouchableOpacity>

        {/* Summary strip */}
        {!loading && (orders.length > 0 || payments.length > 0) && (
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>إجمالي الطلبات</Text>
              <Text style={[styles.summaryValue, { color: COLORS.debtRed }]}>
                {totalOrders.toLocaleString("ar-EG")} {CURRENCY}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>إجمالي المدفوعات</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                {totalPayments.toLocaleString("ar-EG")} {CURRENCY}
              </Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === "payments" && styles.tabActive]} onPress={() => setActiveTab("payments")}>
            <Text style={[styles.tabText, activeTab === "payments" && styles.tabTextActive]}>
              المدفوعات {payments.length > 0 ? `(${payments.length})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "orders" && styles.tabActive]} onPress={() => setActiveTab("orders")}>
            <Text style={[styles.tabText, activeTab === "orders" && styles.tabTextActive]}>الطلبات {orders.length > 0 ? `(${orders.length})` : ""}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : activeTab === "payments" ? (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="بحث في الملاحظات أو المبلغ..."
              placeholderTextColor={COLORS.textSecondary}
              value={paySearch}
              onChangeText={onPaySearchChange}
            />
            <DateRangePicker range={payRange} onChange={onPayRangeChange} onClear={() => onPayRangeChange(EMPTY_RANGE)} />
            {payments.length === 0 ? (
              <Text style={styles.empty}>لا توجد مدفوعات</Text>
            ) : (
              payments.map((p) => (
                <Card key={p.id}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.amount}>
                        {p.amount.toLocaleString("ar-EG")} {CURRENCY}
                      </Text>
                      <Text style={styles.meta}>
                        {PAYMENT_METHOD_LABELS[p.method]} • {fmt(p.createdAt)}
                      </Text>
                      {p.senderName && <Text style={styles.meta}>المحول: {p.senderName}</Text>}
                      {p.notes && <Text style={styles.meta}>{p.notes}</Text>}
                    </View>
                    <Text style={styles.checkmark}>✅</Text>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="بحث برقم الطلب أو المبلغ..."
              placeholderTextColor={COLORS.textSecondary}
              value={ordSearch}
              onChangeText={onOrdSearchChange}
            />
            <DateRangePicker range={ordRange} onChange={onOrdRangeChange} onClear={() => onOrdRangeChange(EMPTY_RANGE)} />
            {orders.length === 0 ? (
              <Text style={styles.empty}>لا توجد طلبات</Text>
            ) : (
              orders.map((o) => (
                <View key={o.id} style={styles.orderCard}>
                  {/* Header */}
                  <View style={styles.orderCardHeader}>
                    <View style={[styles.orderStatusBadge, { backgroundColor: ORDER_STATUS_COLORS[o.status] + "20" }]}>
                      <View style={[styles.orderStatusDot, { backgroundColor: ORDER_STATUS_COLORS[o.status] }]} />
                      <Text style={[styles.orderStatusText, { color: ORDER_STATUS_COLORS[o.status] }]}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.orderNum}>{o.orderNumber}</Text>
                      <Text style={styles.orderDate}>{fmt(o.createdAt)}</Text>
                    </View>
                  </View>

                  {/* Items */}
                  {(o.items && o.items.length > 0) && (
                    <View style={styles.orderItemsSection}>
                      {/* Column headers */}
                      <View style={styles.orderItemHeaderRow}>
                        <Text style={[styles.orderItemColHeader, { flex: 2 }]}>المنتج</Text>
                        <Text style={styles.orderItemColHeader}>الكمية</Text>
                        <Text style={styles.orderItemColHeader}>السعر</Text>
                        <Text style={styles.orderItemColHeader}>الناولون</Text>
                        <Text style={styles.orderItemColHeader}>الإجمالي</Text>
                      </View>
                      {o.items.map((item, idx) => (
                        <View
                          key={item.id}
                          style={[styles.orderItemRow, idx % 2 === 1 && styles.orderItemRowAlt]}
                        >
                          <Text style={[styles.orderItemCell, { flex: 2, textAlign: "right", fontWeight: "600" }]} numberOfLines={1}>
                            {item.product?.name ?? "—"}
                          </Text>
                          <Text style={styles.orderItemCell}>{item.quantity}</Text>
                          <Text style={styles.orderItemCell}>{item.price}</Text>
                          <Text style={styles.orderItemCell}>{item.deliveryFeePerTon ?? 0}</Text>
                          <Text style={[styles.orderItemCell, { color: COLORS.primary, fontWeight: "700" }]}>
                            {((item.quantity * item.price) - (item.totalDelivery ?? 0)).toLocaleString("ar-EG")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Footer totals */}
                  <View style={styles.orderCardFooter}>
                    {(o.totalDelivery ?? 0) > 0 && (
                      <Text style={styles.orderDeliveryText}>
                        ناولون (خصم): - {(o.totalDelivery ?? 0).toLocaleString("ar-EG")} {CURRENCY}
                      </Text>
                    )}
                    <Text style={styles.orderTotalText}>
                      الإجمالي: {o.totalAmount.toLocaleString("ar-EG")} {CURRENCY}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", marginVertical: 4 }}>
      <Text style={{ color: COLORS.textPrimary }}>{value}</Text>
      <Text style={{ color: COLORS.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 8 },
  debtRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  debtLabel: { fontSize: 14, color: COLORS.textSecondary },
  debtValue: { fontSize: 20, fontWeight: "bold" },
  actionBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, marginVertical: 12, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  tabTextActive: { color: "#fff" },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { fontSize: 16, fontWeight: "bold", color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  orderNum: { textAlign: "left", fontSize: 13, color: COLORS.textSecondary },
  checkmark: { fontSize: 24 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  empty: { color: COLORS.textSecondary, textAlign: "center", padding: 24 },
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  summaryItem: { flex: 1, padding: 12, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: COLORS.border },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: "bold" },

  // Order card
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderStatusBadge: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  orderStatusDot: { width: 7, height: 7, borderRadius: 4 },
  orderStatusText: { fontSize: 12, fontWeight: "700" },
  orderDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: "right" },
  orderItemsSection: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  orderItemHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  orderItemColHeader: {
    flex: 1, fontSize: 10, fontWeight: "700",
    color: COLORS.primary, textAlign: "center",
  },
  orderItemRow: {
    flexDirection: "row", paddingHorizontal: 10, paddingVertical: 8,
  },
  orderItemRowAlt: { backgroundColor: COLORS.background },
  orderItemCell: {
    flex: 1, fontSize: 12, color: COLORS.textPrimary,
    textAlign: "center",
  },
  orderCardFooter: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 12,
    backgroundColor: COLORS.primaryDark,
  },
  orderDeliveryText: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  orderTotalText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
});
