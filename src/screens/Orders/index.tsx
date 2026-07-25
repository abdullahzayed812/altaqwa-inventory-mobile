import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getOrders, updateOrderStatus, deleteOrder } from "../../api";
import { Order, OrderStatus } from "../../types";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { COLORS, CURRENCY, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "../../constants/theme";
import BgLogo from "../../components/BgLogo";

const STATUS_FILTERS = [
  { label: "الكل", value: "ALL" },
  { label: "انتظار", value: OrderStatus.PENDING },
  { label: "تم التسليم", value: OrderStatus.DELIVERED },
  { label: "ملغي", value: OrderStatus.CANCELLED },
];

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setOrders(await getOrders());
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const changeStatus = (order: Order, status: OrderStatus) => {
    Alert.alert("تأكيد", `تغيير الحالة إلى "${ORDER_STATUS_LABELS[status]}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تأكيد",
        onPress: async () => {
          try {
            await updateOrderStatus(order.id, status);
            load();
          } catch (e: any) {
            Alert.alert("خطأ", e.message);
          }
        },
      },
    ]);
  };

  const handleDelete = (order: Order) => {
    Alert.alert("تأكيد الحذف", `هل أنت متأكد من حذف الطلب #${order.orderNumber}؟ لا يمكن التراجع عن هذا الإجراء.`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteOrder(order.id);
            load();
          } catch (e: any) {
            Alert.alert("خطأ", e.message);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <BgLogo />
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            {f.value !== "ALL" && (
              <View style={[styles.filterDot, { backgroundColor: filter === f.value ? "#fff" : ORDER_STATUS_COLORS[f.value] }]} />
            )}
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📦" message="لا توجد طلبات" />}
        renderItem={({ item: o }) => (
          <Card>
            {/* Card header row */}
            <View style={styles.cardHeader}>
              <View style={[styles.statusBadge, { backgroundColor: ORDER_STATUS_COLORS[o.status] + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: ORDER_STATUS_COLORS[o.status] }]} />
                <Text style={[styles.statusText, { color: ORDER_STATUS_COLORS[o.status] }]}>
                  {ORDER_STATUS_LABELS[o.status]}
                </Text>
              </View>
              <Text style={styles.orderNum}>{o.orderNumber}</Text>
            </View>

            {/* Customer + amount */}
            <View style={styles.cardBody}>
              <View style={styles.customerRow}>
                <Text style={styles.customerIcon}>
                  {(o.customer as any)?.type === 'driver' ? '🚗' : '👤'}
                </Text>
                <Text style={styles.customerName}>
                  {o.customer?.name || 'عميل غير محدد'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.total}>{o.totalAmount.toLocaleString("ar-EG")} {CURRENCY}</Text>
                {(o.naulonUncollected ?? 0) > 0 && (
                  <Text style={styles.deliveryTotal}>ناولون: {o.naulonUncollected?.toLocaleString("ar-EG")} {CURRENCY}</Text>
                )}
              </View>
            </View>

            <Text style={styles.date}>{new Date(o.createdAt).toLocaleDateString("ar-EG")}</Text>

            {/* Items preview */}
            {(o.items ?? []).slice(0, 2).map((item) => (
              <Text key={item.id} style={styles.itemLine}>
                • {item.product?.name} × {item.quantity} طن
              </Text>
            ))}
            {(o.items?.length ?? 0) > 2 && (
              <Text style={styles.itemLine}>+ {o.items!.length - 2} منتجات أخرى</Text>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {o.status === OrderStatus.PENDING && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
                    onPress={() => changeStatus(o, OrderStatus.DELIVERED)}
                  >
                    <Text style={styles.actionBtnText}>✓ تم التسليم</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.danger + "15", marginRight: 8 }]}
                    onPress={() => changeStatus(o, OrderStatus.CANCELLED)}
                  >
                    <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>إلغاء</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.textSecondary + "15", marginRight: 8 }]}
                onPress={() => navigation.navigate("CreateOrder", { order: o })}
              >
                <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>✎ تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.danger + "15", marginRight: 8 }]}
                onPress={() => handleDelete(o)}
              >
                <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>🗑 حذف</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateOrder")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, overflow: "hidden" },
  filterBar: { backgroundColor: COLORS.card, maxHeight: 54, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 5,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterText: { fontSize: 13, color: COLORS.textSecondary },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  list: { padding: 14, paddingBottom: 90 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  orderNum: { fontSize: 12, color: COLORS.textSecondary },
  cardBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  customerIcon: { fontSize: 14 },
  customerName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  total: { fontSize: 17, fontWeight: "bold", color: COLORS.primary },
  deliveryTotal: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  itemLine: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, justifyContent: "flex-end", rowGap: 8 },
  actionBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 28, lineHeight: 32 },
});
