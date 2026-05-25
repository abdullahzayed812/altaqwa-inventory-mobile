import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getDriverById, getDriverLedger, addDriverPayment, addDriverDebt, updateDriver, deleteDriver } from "../../api";
import { Driver, DriverLedger, DriverLedgerType } from "../../types";
import Card from "../../components/Card";
import { COLORS, CURRENCY } from "../../constants/theme";

type ModalType = "payment" | "debt" | "edit" | null;

const LEDGER_LABELS: Record<DriverLedgerType, string> = {
  [DriverLedgerType.DELIVERY]: "ناولون طلب",
  [DriverLedgerType.PAYMENT]: "دفعة للسائق",
  [DriverLedgerType.DEBT]: "مديونية مضافة",
};

const LEDGER_ICONS: Record<DriverLedgerType, string> = {
  [DriverLedgerType.DELIVERY]: "🚚",
  [DriverLedgerType.PAYMENT]: "✅",
  [DriverLedgerType.DEBT]: "📋",
};

export default function DriverDetailsScreen({ route, navigation }: any) {
  const [driver, setDriver] = useState<Driver>(route.params.driver);
  const [ledger, setLedger] = useState<DriverLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [freshDriver, entries] = await Promise.all([getDriverById(driver.id), getDriverLedger(driver.id)]);
      setDriver(freshDriver);
      setLedger(entries);
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driver.id]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const openModal = (type: ModalType) => {
    if (type === "edit") {
      setEditName(driver.name);
      setEditPhone(driver.phone ?? "");
      setEditPlate(driver.vehiclePlate ?? "");
      setEditVehicle(driver.vehicleDetails ?? "");
    } else {
      setAmount("");
      setNotes("");
    }
    setModalType(type);
  };

  const closeModal = () => setModalType(null);

  const saveEdit = async () => {
    if (!editName.trim()) { Alert.alert("خطأ", "الاسم مطلوب"); return; }
    setEditSaving(true);
    try {
      const updated = await updateDriver(driver.id, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
        vehiclePlate: editPlate.trim() || null,
        vehicleDetails: editVehicle.trim() || null,
      });
      setDriver(updated);
      setModalType(null);
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "حذف السائق",
      `هل أنت متأكد من حذف "${driver.name}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDriver(driver.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("خطأ", e.message);
            }
          },
        },
      ],
    );
  };

  const submit = async () => {
    const val = parseFloat(amount.trim());
    if (!amount.trim() || isNaN(val) || val <= 0) {
      Alert.alert("خطأ", "أدخل مبلغاً صحيحاً");
      return;
    }
    setSaving(true);
    try {
      if (modalType === "payment") {
        await addDriverPayment(driver.id, { amount: val, notes: notes.trim() || undefined });
      } else {
        await addDriverDebt(driver.id, { amount: val, notes: notes.trim() || undefined });
      }
      closeModal();
      setLoading(true);
      await loadAll();
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("ar-EG");

  const totalDelivery = ledger.filter((e) => e.type === DriverLedgerType.DELIVERY).reduce((s, e) => s + e.amount, 0);
  const totalPaid = ledger.filter((e) => e.type === DriverLedgerType.PAYMENT).reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
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
        {/* Driver info card */}
        <Card>
          <Text style={styles.name}>{driver.name}</Text>
          {driver.phone && <InfoRow label="الهاتف" value={driver.phone} />}
          {driver.vehiclePlate && <InfoRow label="اللوحة" value={`🚗 ${driver.vehiclePlate}`} />}
          {driver.vehicleDetails && <InfoRow label="المركبة" value={driver.vehicleDetails} />}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>
              {driver.totalBalance < 0 ? "المديونية" : "مستحق الدفع"}
            </Text>
            <Text style={[styles.balanceValue, { color: driver.totalBalance < 0 ? COLORS.debtRed : driver.totalBalance > 0 ? COLORS.balanceBlue : COLORS.success }]}>
              {Math.abs(driver.totalBalance).toLocaleString("ar-EG")} {CURRENCY}
            </Text>
          </View>
        </Card>

        {/* Edit / Delete */}
        <View style={styles.editDeleteRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openModal("edit")}>
            <Text style={styles.editBtnText}>✎ تعديل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteBtnText}>🗑 حذف</Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.paymentBtn]} onPress={() => openModal("payment")}>
            <Text style={styles.actionBtnText}>💸 دفعتله</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.debtBtn]} onPress={() => openModal("debt")}>
            <Text style={styles.actionBtnText}>📋 أنا مدين له</Text>
          </TouchableOpacity>
        </View>

        {/* Summary strip */}
        {!loading && ledger.length > 0 && (
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>إجمالي الناولون</Text>
              <Text style={[styles.summaryValue, { color: "#e74c3c" }]}>
                {totalDelivery.toLocaleString("ar-EG")} {CURRENCY}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>إجمالي المدفوع</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                {totalPaid.toLocaleString("ar-EG")} {CURRENCY}
              </Text>
            </View>
          </View>
        )}

        {/* Ledger */}
        <Text style={styles.sectionTitle}>سجل الحساب</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : ledger.length === 0 ? (
          <Text style={styles.empty}>لا يوجد سجل بعد</Text>
        ) : (
          ledger.map((entry) => {
            const isCredit = entry.type === DriverLedgerType.PAYMENT;
            return (
              <Card key={entry.id}>
                <View style={styles.ledgerRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.ledgerTypeRow}>
                      <Text style={styles.ledgerIcon}>{LEDGER_ICONS[entry.type]}</Text>
                      <Text style={styles.ledgerTypeLabel}>{LEDGER_LABELS[entry.type]}</Text>
                      {entry.referenceId && <Text style={styles.ledgerRef}> • طلب #{entry.referenceId}</Text>}
                    </View>
                    <Text style={styles.ledgerDate}>{fmt(entry.createdAt)}</Text>
                    {entry.notes && <Text style={styles.ledgerNotes}>{entry.notes}</Text>}
                  </View>
                  <Text style={[styles.ledgerAmount, { color: isCredit ? COLORS.success : "#e74c3c" }]}>
                    {isCredit ? "-" : "+"}
                    {entry.amount.toLocaleString("ar-EG")} {CURRENCY}
                  </Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={modalType === "edit"} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>تعديل السائق</Text>
              <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} placeholder="الاسم *" textAlign="right" placeholderTextColor={COLORS.textSecondary} />
              <TextInput style={styles.modalInput} value={editPhone} onChangeText={setEditPhone} placeholder="الهاتف" keyboardType="phone-pad" textAlign="right" placeholderTextColor={COLORS.textSecondary} />
              <TextInput style={styles.modalInput} value={editPlate} onChangeText={setEditPlate} placeholder="رقم اللوحة" textAlign="right" placeholderTextColor={COLORS.textSecondary} />
              <TextInput style={styles.modalInput} value={editVehicle} onChangeText={setEditVehicle} placeholder="تفاصيل المركبة" textAlign="right" placeholderTextColor={COLORS.textSecondary} />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={{ color: COLORS.textSecondary, fontWeight: "bold" }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }, editSaving && { opacity: 0.6 }]} onPress={saveEdit} disabled={editSaving}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>{editSaving ? "..." : "حفظ"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment / Debt Modal */}
      <Modal visible={modalType === "payment" || modalType === "debt"} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{modalType === "payment" ? "💸 دفعتله كام؟" : "📋 أنا مدين له بكام؟"}</Text>
              <Text style={styles.modalSubtitle}>{modalType === "payment" ? "أدخل المبلغ الذي دفعته للسائق" : "أدخل المبلغ الذي تدين به للسائق"}</Text>
              <TextInput
                style={styles.modalInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="المبلغ"
                keyboardType="numeric"
                textAlign="right"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={[styles.modalInput, { height: 72 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="ملاحظات (اختياري)"
                multiline
                textAlign="right"
                placeholderTextColor={COLORS.textSecondary}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={{ color: COLORS.textSecondary, fontWeight: "bold" }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: modalType === "payment" ? COLORS.success : COLORS.primary }, saving && { opacity: 0.6 }]}
                  onPress={submit}
                  disabled={saving}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>{saving ? "..." : "حفظ"}</Text>
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
    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", marginVertical: 3 }}>
      <Text style={{ color: COLORS.textPrimary }}>{value}</Text>
      <Text style={{ color: COLORS.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
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

  editDeleteRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  editBtn: { flex: 1, borderRadius: 10, padding: 11, alignItems: "center", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  editBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  deleteBtn: { flex: 1, borderRadius: 10, padding: 11, alignItems: "center", backgroundColor: COLORS.danger + "12", borderWidth: 1, borderColor: COLORS.danger + "50" },
  deleteBtnText: { color: COLORS.danger, fontWeight: "700", fontSize: 14 },
  actionsRow: { flexDirection: "row", gap: 12, marginVertical: 12 },
  actionBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: "center" },
  paymentBtn: { backgroundColor: COLORS.success },
  debtBtn: { backgroundColor: COLORS.primary },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

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

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
  },
  empty: { color: COLORS.textSecondary, textAlign: "center", padding: 24 },

  ledgerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ledgerTypeRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  ledgerIcon: { fontSize: 16, marginRight: 6 },
  ledgerTypeLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  ledgerRef: { fontSize: 12, color: COLORS.textSecondary },
  ledgerDate: { fontSize: 12, color: COLORS.textSecondary },
  ledgerNotes: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  ledgerAmount: { fontSize: 16, fontWeight: "bold", marginLeft: 8 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  modalActions: { flexDirection: "row", marginTop: 8, gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  saveBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: "center" },
});
