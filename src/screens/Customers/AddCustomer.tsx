import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createCustomer } from "../../api";
import { COLORS } from "../../constants/theme";

type BalanceType = "مدين" | "دائن";

export default function AddCustomerScreen({ navigation }: any) {
  const [type, setType] = useState<"customer" | "driver" | "financial">("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState<BalanceType>("مدين");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("خطأ", "الاسم مطلوب");
      return;
    }
    const raw = balanceAmount.trim() ? parseFloat(balanceAmount.trim()) : undefined;
    if (raw !== undefined && (isNaN(raw) || raw < 0)) {
      Alert.alert("خطأ", "المبلغ يجب أن يكون رقماً صحيحاً موجباً");
      return;
    }
    const initialDebt = raw !== undefined ? (balanceType === "مدين" ? raw : -raw) : undefined;
    setSaving(true);
    try {
      await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        initialDebt,
        type,
        vehiclePlate: type === "driver" ? (vehiclePlate.trim() || undefined) : undefined,
        vehicleDetails: type === "driver" ? (vehicleDetails.trim() || undefined) : undefined,
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
        <ScrollView contentContainerStyle={styles.content}>

          <Label text="النوع" />
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, type === "customer" && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
              onPress={() => setType("customer")}
            >
              <Text style={[styles.toggleText, type === "customer" && styles.toggleTextActive]}>عميل</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, type === "driver" && { backgroundColor: COLORS.warning, borderColor: COLORS.warning }]}
              onPress={() => setType("driver")}
            >
              <Text style={[styles.toggleText, type === "driver" && styles.toggleTextActive]}>سائق</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, type === "financial" && { backgroundColor: COLORS.info, borderColor: COLORS.info }]}
              onPress={() => setType("financial")}
            >
              <Text style={[styles.toggleText, type === "financial" && styles.toggleTextActive]}>حساب مالي</Text>
            </TouchableOpacity>
          </View>

          <Label text="الاسم *" />
          <Input value={name} onChangeText={setName} placeholder={type === "driver" ? "اسم السائق" : "اسم العميل"} />

          <Label text="الهاتف" />
          <Input value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" keyboardType="phone-pad" />

          <Label text="العنوان" />
          <Input value={address} onChangeText={setAddress} placeholder="العنوان" multiline />

          {type === "driver" && (
            <>
              <Label text="رقم اللوحة" />
              <Input value={vehiclePlate} onChangeText={setVehiclePlate} placeholder="مثال: أ ب ج 1234" />
              <Label text="تفاصيل السيارة" />
              <Input value={vehicleDetails} onChangeText={setVehicleDetails} placeholder="مثال: كيا بيكس 2020" />
            </>
          )}

          <Label text="الرصيد الافتتاحي" />
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, balanceType === "مدين" && { backgroundColor: COLORS.debtRed, borderColor: COLORS.debtRed }]}
              onPress={() => setBalanceType("مدين")}
            >
              <Text style={[styles.toggleText, balanceType === "مدين" && styles.toggleTextActive]}>مدين</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, balanceType === "دائن" && { backgroundColor: COLORS.balanceBlue, borderColor: COLORS.balanceBlue }]}
              onPress={() => setBalanceType("دائن")}
            >
              <Text style={[styles.toggleText, balanceType === "دائن" && styles.toggleTextActive]}>دائن</Text>
            </TouchableOpacity>
          </View>
          <Input value={balanceAmount} onChangeText={setBalanceAmount} placeholder="0" keyboardType="numeric" />

          <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={save} disabled={saving}>
            <Text style={styles.btnText}>{saving ? "جاري الحفظ..." : "حفظ"}</Text>
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
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
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
  content: { padding: 20 },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  toggleText: { fontSize: 15, fontWeight: "700", color: COLORS.textSecondary },
  toggleTextActive: { color: "#fff" },
  btn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
