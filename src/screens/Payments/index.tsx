import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getPayments, updatePayment } from '../../api';
import { Payment } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS, CURRENCY, PAYMENT_METHOD_LABELS } from '../../constants/theme';
import BgLogo from '../../components/BgLogo';

export default function PaymentsScreen({ navigation }: any) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [editPayVisible, setEditPayVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayMethod, setEditPayMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [editPayNotes, setEditPayNotes] = useState('');
  const [editPaySaving, setEditPaySaving] = useState(false);

  const load = async () => {
    try {
      setPayments(await getPayments());
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const openEditPayment = (p: Payment) => {
    setEditingPayment(p);
    setEditPayAmount(String(p.amount));
    setEditPayMethod(p.method === 'BANK' ? 'BANK' : 'CASH');
    setEditPayNotes(p.notes ?? '');
    setEditPayVisible(true);
  };

  const saveEditPayment = async () => {
    if (!editingPayment) return;
    const amount = parseFloat(editPayAmount);
    if (!amount || amount <= 0) { Alert.alert('خطأ', 'أدخل مبلغاً صحيحاً'); return; }
    setEditPaySaving(true);
    try {
      await updatePayment(editingPayment.id, {
        amount,
        method: editPayMethod,
        notes: editPayNotes.trim() || null,
      });
      setEditPayVisible(false);
      setEditingPayment(null);
      setLoading(true);
      await load();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setEditPaySaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <BgLogo />
      <FlatList
        data={payments}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="💳" message="لا توجد مدفوعات" />}
        renderItem={({ item: p }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.customer}>{p.customer?.name}</Text>
                <Text style={styles.meta}>
                  {PAYMENT_METHOD_LABELS[p.method]} • {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                </Text>
                {p.notes && <Text style={styles.notes}>{p.notes}</Text>}
              </View>
              <View style={styles.rightCol}>
                <Text style={styles.amount}>{p.amount.toLocaleString('ar-EG')} {CURRENCY}</Text>
                <TouchableOpacity style={styles.editPayBtn} onPress={() => openEditPayment(p)}>
                  <Text style={styles.editPayBtnText}>✎</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddPayment', {})}>
        <Text style={styles.fabText}>+ دفعة</Text>
      </TouchableOpacity>

      <Modal visible={editPayVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>تعديل الدفعة</Text>
              <TextInput
                style={styles.input}
                value={editPayAmount}
                onChangeText={setEditPayAmount}
                placeholder="المبلغ"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.methodLabel}>طريقة الدفع</Text>
              <View style={styles.methodRow}>
                <TouchableOpacity
                  style={[styles.methodBtn, editPayMethod === 'CASH' && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                  onPress={() => setEditPayMethod('CASH')}
                >
                  <Text style={[styles.methodBtnText, editPayMethod === 'CASH' && { color: '#fff' }]}>نقدي</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodBtn, editPayMethod === 'BANK' && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                  onPress={() => setEditPayMethod('BANK')}
                >
                  <Text style={[styles.methodBtnText, editPayMethod === 'BANK' && { color: '#fff' }]}>حوالة</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { minHeight: 60 }]}
                value={editPayNotes}
                onChangeText={setEditPayNotes}
                placeholder="ملاحظات (اختياري)"
                placeholderTextColor={COLORS.textSecondary}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditPayVisible(false); setEditingPayment(null); }}>
                  <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, editPaySaving && { opacity: 0.6 }]} onPress={saveEditPayment} disabled={editPaySaving}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editPaySaving ? '...' : 'حفظ'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, overflow: 'hidden' },
  list: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  customer: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right' },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, textAlign: 'right' },
  notes: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 2, textAlign: 'right' },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 18, fontWeight: 'bold', color: COLORS.success },
  editPayBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  editPayBtnText: { fontSize: 16, color: COLORS.primary },
  fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'right',
  },
  methodLabel: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  methodBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  methodBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  modalActions: { flexDirection: 'row', marginTop: 4, gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  saveBtn: { flex: 1, borderRadius: 10, padding: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
});
