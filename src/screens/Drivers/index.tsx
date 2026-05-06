import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getDrivers, createDriver, updateDriverAvailability } from '../../api';
import { Driver } from '../../types';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/theme';

export default function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setDrivers(await getDrivers());
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الاسم مطلوب'); return; }
    setSaving(true);
    try {
      await createDriver({ name: name.trim(), phone: phone.trim() || undefined, vehiclePlate: plate.trim() || undefined });
      setModalVisible(false);
      setName(''); setPhone(''); setPlate('');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (d: Driver) => {
    try {
      await updateDriverAvailability(d.id, !d.isAvailable);
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={drivers}
        keyExtractor={d => String(d.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🚗" message="لا يوجد سائقون" />}
        renderItem={({ item: d }) => (
          <Card>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.availBadge, { backgroundColor: d.isAvailable ? COLORS.success : COLORS.textSecondary }]}
                onPress={() => toggleAvailability(d)}
              >
                <Text style={styles.availText}>{d.isAvailable ? 'متاح' : 'مشغول'}</Text>
              </TouchableOpacity>
              <View style={styles.info}>
                <Text style={styles.name}>{d.name}</Text>
                {d.phone && <Text style={styles.sub}>{d.phone}</Text>}
                {d.vehiclePlate && <Text style={styles.sub}>🚗 {d.vehiclePlate}</Text>}
              </View>
            </View>
          </Card>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ سائق</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>سائق جديد</Text>
              <Input value={name} onChangeText={setName} placeholder="الاسم *" />
              <Input value={phone} onChangeText={setPhone} placeholder="الهاتف" keyboardType="phone-pad" />
              <Input value={plate} onChangeText={setPlate} placeholder="رقم اللوحة" />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? '...' : 'حفظ'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Input(props: any) {
  return (
    <TextInput
      style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 14, color: COLORS.textPrimary, textAlign: 'right', borderWidth: 1, borderColor: COLORS.border }}
      placeholderTextColor={COLORS.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right' },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textAlign: 'right' },
  availBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  availText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 16, color: COLORS.textPrimary },
  modalActions: { flexDirection: 'row', marginTop: 12, gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  saveBtn: { flex: 1, borderRadius: 10, padding: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
});
