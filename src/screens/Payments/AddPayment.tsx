import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCustomers, createPayment } from '../../api';
import { Customer, PaymentMethod } from '../../types';
import { COLORS, CURRENCY, PAYMENT_METHOD_LABELS } from '../../constants/theme';

export default function AddPaymentScreen({ route, navigation }: any) {
  const preCustomer: Customer | undefined = route.params?.customer;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(preCustomer ?? null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!preCustomer) {
      getCustomers().then(setCustomers).catch(console.error);
    }
  }, []);

  const save = async () => {
    if (!selectedCustomer) { Alert.alert('خطأ', 'اختر عميلاً'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('خطأ', 'أدخل مبلغ صحيح'); return; }
    setSaving(true);
    try {
      await createPayment({ customerId: selectedCustomer.id, amount: amt, method, notes: notes.trim() || undefined });
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
          {preCustomer ? (
            <View style={styles.customerCard}>
              <Text style={styles.customerName}>{preCustomer.name}</Text>
              <Text style={styles.customerDebt}>المديونية: {preCustomer.totalDebt.toLocaleString('ar-EG')} {CURRENCY}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>اختر العميل *</Text>
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
            </>
          )}

          <Text style={styles.label}>المبلغ *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
            textAlign="right"
          />

          <Text style={styles.label}>طريقة الدفع</Text>
          <View style={styles.methodRow}>
            {Object.values(PaymentMethod).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodChip, method === m && styles.methodChipSelected]}
                onPress={() => setMethod(m)}
              >
                <Text style={[styles.methodText, method === m && { color: '#fff' }]}>{PAYMENT_METHOD_LABELS[m]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>ملاحظات</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="ملاحظات اختيارية"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            textAlign="right"
          />

          <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={save} disabled={saving}>
            <Text style={styles.btnText}>{saving ? 'جاري الحفظ...' : 'تسجيل الدفعة'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  customerCard: { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 16 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right' },
  customerDebt: { fontSize: 14, color: COLORS.debtRed, marginTop: 4, textAlign: 'right' },
  label: { textAlign: 'right', color: COLORS.textSecondary, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: COLORS.card, borderRadius: 8, padding: 12, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  chip: { backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textPrimary, fontSize: 13 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  methodChip: { flex: 1, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  methodChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { color: COLORS.textSecondary, fontWeight: '600' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
