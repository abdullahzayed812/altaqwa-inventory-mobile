import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getSupplierById, getSupplierLedger, getPurchaseById, updateSupplier, deleteSupplier } from "../../api";
import { Purchase, Supplier, SupplierLedger, SupplierLedgerType } from "../../types";
import Card from "../../components/Card";
import DateRangePicker, { DateRange, toISO } from "../../components/DateRangePicker";
import { COLORS, CURRENCY, LEDGER_TYPE_LABELS } from "../../constants/theme";

type TypeFilter = "ALL" | SupplierLedgerType;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "ALL", label: "الكل" },
  { key: SupplierLedgerType.PURCHASE, label: "شراء" },
  { key: SupplierLedgerType.PAYMENT, label: "دفعة" },
];

const EMPTY_RANGE: DateRange = { startDate: null, endDate: null };

export default function SupplierDetailsScreen({ route, navigation }: any) {
  const initialSupplier: Supplier = route.params.supplier;
  const [supplier, setSupplier] = useState<Supplier>(initialSupplier);
  const [ledger, setLedger] = useState<SupplierLedger[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE);

  // Map of purchaseId -> Purchase (cached details)
  const [purchaseCache, setPurchaseCache] = useState<Record<number, Purchase>>({});
  // Set of expanded ledger entry ids
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  // Set of currently loading purchase ids
  const [loadingPurchaseIds, setLoadingPurchaseIds] = useState<Set<number>>(new Set());

  const loadLedger = useCallback(
    async (type: TypeFilter, range: DateRange) => {
      try {
        const data = await getSupplierLedger(supplier.id, {
          type: type === "ALL" ? undefined : type,
          startDate: range.startDate ? toISO(range.startDate) : undefined,
          endDate: range.endDate ? toISO(range.endDate) : undefined,
        });
        setLedger(data);
      } catch (e: any) {
        Alert.alert("خطأ", e.message);
      }
    },
    [supplier.id],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setTypeFilter("ALL");
    setDateRange(EMPTY_RANGE);
    setExpandedIds(new Set());
    try {
      const [sup, led] = await Promise.all([getSupplierById(supplier.id), getSupplierLedger(supplier.id)]);
      setSupplier(sup);
      setLedger(led);
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supplier.id]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const handleTypeFilter = (key: TypeFilter) => {
    setTypeFilter(key);
    loadLedger(key, dateRange);
  };

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range);
    loadLedger(typeFilter, range);
  };

  const toggleExpand = async (entry: SupplierLedger) => {
    if (entry.type !== SupplierLedgerType.PURCHASE || !entry.referenceId) return;

    const newSet = new Set(expandedIds);
    if (newSet.has(entry.id)) {
      newSet.delete(entry.id);
      setExpandedIds(newSet);
      return;
    }

    newSet.add(entry.id);
    setExpandedIds(newSet);

    // Fetch purchase details if not cached
    if (!purchaseCache[entry.referenceId]) {
      setLoadingPurchaseIds((prev) => new Set(prev).add(entry.referenceId!));
      try {
        const purchase = await getPurchaseById(entry.referenceId);
        setPurchaseCache((prev) => ({ ...prev, [entry.referenceId!]: purchase }));
      } catch (e: any) {
        Alert.alert("خطأ", e.message);
      } finally {
        setLoadingPurchaseIds((prev) => {
          const s = new Set(prev);
          s.delete(entry.referenceId!);
          return s;
        });
      }
    }
  };

  const openEdit = () => {
    setEditName(supplier.name);
    setEditPhone(supplier.phone ?? "");
    setEditAddress(supplier.address ?? "");
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) { Alert.alert("خطأ", "الاسم مطلوب"); return; }
    setEditSaving(true);
    try {
      const updated = await updateSupplier(supplier.id, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
      });
      setSupplier(updated);
      setEditVisible(false);
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "حذف المورد",
      `هل أنت متأكد من حذف "${supplier.name}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSupplier(supplier.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("خطأ", e.message);
            }
          },
        },
      ],
    );
  };

  const fmt = (d: string | Date) => new Date(d).toLocaleDateString("ar-EG");

  const totalPurchases = ledger.filter((e) => e.type === SupplierLedgerType.PURCHASE).reduce((s, e) => s + e.amount, 0);
  const totalPayments = ledger.filter((e) => e.type === SupplierLedgerType.PAYMENT).reduce((s, e) => s + e.amount, 0);

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
          <Text style={styles.name}>{supplier.name}</Text>
          {supplier.phone && <InfoRow label="الهاتف" value={supplier.phone} />}
          {supplier.address && <InfoRow label="العنوان" value={supplier.address} />}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>
              {supplier.totalBalance < 0 ? "المديونية" : "مستحق الدفع"}
            </Text>
            <Text style={[styles.balanceValue, { color: supplier.totalBalance < 0 ? COLORS.debtRed : supplier.totalBalance > 0 ? COLORS.balanceBlue : COLORS.success }]}>
              {Math.abs(supplier.totalBalance).toLocaleString("ar-EG")} {CURRENCY}
            </Text>
          </View>
        </Card>

        {/* Edit / Delete */}
        <View style={styles.editDeleteRow}>
          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>✎ تعديل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteBtnText}>🗑 حذف</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate("AddPurchase", { supplier })}>
            <Text style={styles.actionBtnText}>+ فاتورة شراء</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success, marginRight: 8 }]}
            onPress={() => navigation.navigate("AddPurchase", { supplier, isPayment: true })}
          >
            <Text style={styles.actionBtnText}>+ دفعة</Text>
          </TouchableOpacity>
        </View>

        {/* Ledger Section */}
        <Text style={styles.sectionTitle}>كشف الحساب</Text>

        {/* Type filter pills */}
        <View style={styles.pillRow}>
          {TYPE_FILTERS.map((f) => (
            <TouchableOpacity key={f.key} style={[styles.pill, typeFilter === f.key && styles.pillActive]} onPress={() => handleTypeFilter(f.key)}>
              <Text style={[styles.pillText, typeFilter === f.key && styles.pillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date range picker */}
        <DateRangePicker range={dateRange} onChange={handleRangeChange} onClear={() => handleRangeChange(EMPTY_RANGE)} />

        {/* Summary strip — shown when not filtered by type */}
        {!loading && typeFilter === "ALL" && ledger.length > 0 && (
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>إجمالي المشتريات</Text>
              <Text style={[styles.summaryValue, { color: COLORS.debtRed }]}>
                {totalPurchases.toLocaleString("ar-EG")} {CURRENCY}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>إجمالي الدفعات</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                {totalPayments.toLocaleString("ar-EG")} {CURRENCY}
              </Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : ledger.length === 0 ? (
          <Text style={styles.empty}>لا توجد حركات</Text>
        ) : (
          ledger.map((entry) => {
            const isPurchase = entry.type === SupplierLedgerType.PURCHASE;
            const isExpanded = expandedIds.has(entry.id);
            const cachedPurchase = entry.referenceId ? purchaseCache[entry.referenceId] : null;
            const isLoadingItems = entry.referenceId ? loadingPurchaseIds.has(entry.referenceId) : false;

            return (
              <Card key={entry.id}>
                {/* Header row — tappable if it's a purchase */}
                <TouchableOpacity
                  activeOpacity={isPurchase ? 0.7 : 1}
                  onPress={() => isPurchase && toggleExpand(entry)}
                  style={styles.ledgerRow}
                >
                  <View style={styles.ledgerLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: isPurchase ? COLORS.debtRed + "18" : COLORS.success + "18" }]}>
                      <Text style={[styles.typeBadgeText, { color: isPurchase ? COLORS.debtRed : COLORS.success }]}>{isPurchase ? "شراء" : "دفعة"}</Text>
                    </View>
                    <Text style={styles.ledgerDate}>{fmt(entry.createdAt)}</Text>
                  </View>
                  <View style={styles.ledgerRight}>
                    <Text style={[styles.ledgerAmount, { color: isPurchase ? COLORS.debtRed : COLORS.success }]}>
                      {isPurchase ? "+" : "-"}
                      {entry.amount.toLocaleString("ar-EG")} {CURRENCY}
                    </Text>
                    {isPurchase && (
                      <Text style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded purchase items */}
                {isPurchase && isExpanded && (
                  <View style={styles.itemsContainer}>
                    <View style={styles.itemsDivider} />
                    {isLoadingItems ? (
                      <ActivityIndicator color={COLORS.primary} style={{ paddingVertical: 10 }} />
                    ) : cachedPurchase?.items && cachedPurchase.items.length > 0 ? (
                      <>
                        {/* Items header */}
                        <View style={styles.itemsHeader}>
                          <Text style={[styles.itemsHeaderText, { flex: 2 }]}>المنتج</Text>
                          <Text style={styles.itemsHeaderText}>الكمية</Text>
                          <Text style={styles.itemsHeaderText}>السعر</Text>
                          <Text style={styles.itemsHeaderText}>الإجمالي</Text>
                        </View>
                        {cachedPurchase.items.map((item) => (
                          <View key={item.id} style={styles.itemRow}>
                            <Text style={[styles.itemName, { flex: 2 }]} numberOfLines={1}>
                              {item.product?.name ?? `منتج #${item.productId}`}
                            </Text>
                            <Text style={styles.itemCell}>{item.quantity.toLocaleString("ar-EG")}</Text>
                            <Text style={styles.itemCell}>{item.price.toLocaleString("ar-EG")}</Text>
                            <Text style={[styles.itemCell, { color: COLORS.primary, fontWeight: "700" }]}>
                              {(item.quantity * item.price).toLocaleString("ar-EG")}
                            </Text>
                          </View>
                        ))}
                        {/* Total row */}
                        <View style={styles.itemsTotalRow}>
                          <Text style={styles.itemsTotalLabel}>الإجمالي</Text>
                          <Text style={styles.itemsTotalValue}>
                            {entry.amount.toLocaleString("ar-EG")} {CURRENCY}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.noItems}>لا توجد تفاصيل</Text>
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
      <Modal visible={editVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>تعديل المورد</Text>
              <ModalInput value={editName} onChangeText={setEditName} placeholder="الاسم *" />
              <ModalInput value={editPhone} onChangeText={setEditPhone} placeholder="الهاتف" keyboardType="phone-pad" />
              <ModalInput value={editAddress} onChangeText={setEditAddress} placeholder="العنوان" multiline />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
                  <Text style={{ color: COLORS.textSecondary, fontWeight: "bold" }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, editSaving && { opacity: 0.6 }]} onPress={saveEdit} disabled={editSaving}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>{editSaving ? "..." : "حفظ"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

function ModalInput(props: any) {
  return (
    <TextInput
      style={{
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
        textAlign: "right",
      }}
      placeholderTextColor={COLORS.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 8 },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  balanceLabel: { fontSize: 14, color: COLORS.textSecondary },
  balanceValue: { fontSize: 20, fontWeight: "bold" },
  editDeleteRow: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 4 },
  editBtn: { flex: 1, borderRadius: 10, padding: 11, alignItems: "center", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  editBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  deleteBtn: { flex: 1, borderRadius: 10, padding: 11, alignItems: "center", backgroundColor: COLORS.danger + "12", borderWidth: 1, borderColor: COLORS.danger + "50" },
  deleteBtnText: { color: COLORS.danger, fontWeight: "700", fontSize: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 16 },
  modalActions: { flexDirection: "row", marginTop: 4, gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  saveBtn: { flex: 1, borderRadius: 10, padding: 14, backgroundColor: COLORS.primary, alignItems: "center" },
  actionsRow: { flexDirection: "row", marginVertical: 12 },
  actionBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 10 },
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  pillTextActive: { color: "#fff" },
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
  ledgerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ledgerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  ledgerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  typeBadgeText: { fontSize: 13, fontWeight: "700" },
  ledgerDate: { fontSize: 12, color: COLORS.textSecondary },
  ledgerAmount: { fontSize: 16, fontWeight: "bold" },
  expandIcon: { fontSize: 10, color: COLORS.textSecondary },
  // Items expanded area
  itemsContainer: { marginTop: 10 },
  itemsDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },
  itemsHeader: { flexDirection: "row", marginBottom: 6 },
  itemsHeaderText: { flex: 1, fontSize: 11, color: COLORS.textSecondary, fontWeight: "700", textAlign: "center" },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border + "55" },
  itemName: { fontSize: 13, color: COLORS.textPrimary, textAlign: "right", paddingRight: 4 },
  itemCell: { flex: 1, fontSize: 13, color: COLORS.textPrimary, textAlign: "center" },
  itemsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 4,
  },
  itemsTotalLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  itemsTotalValue: { fontSize: 13, fontWeight: "700", color: COLORS.debtRed },
  noItems: { fontSize: 12, color: COLORS.textSecondary, textAlign: "center", paddingVertical: 8 },
  empty: { color: COLORS.textSecondary, textAlign: "center", padding: 24 },
});
