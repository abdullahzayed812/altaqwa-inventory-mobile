import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createSupplier } from '../../api';
import { COLORS } from '../../constants/theme';

export default function AddSupplierScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الاسم مطلوب'); return; }
    setSaving(true);
    try {
      await createSupplier({ name: name.trim(), phone: phone.trim() || undefined, address: address.trim() || undefined });
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
          <Label text="الاسم *" />
          <Input value={name} onChangeText={setName} placeholder="اسم المورد" />
          <Label text="الهاتف" />
          <Input value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" keyboardType="phone-pad" />
          <Label text="العنوان" />
          <Input value={address} onChangeText={setAddress} placeholder="العنوان" multiline />
          <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={save} disabled={saving}>
            <Text style={styles.btnText}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ textAlign: 'right', color: COLORS.textSecondary, marginBottom: 4, marginTop: 12 }}>{text}</Text>;
}
function Input(props: any) {
  return <TextInput style={{ backgroundColor: COLORS.card, borderRadius: 8, padding: 12, fontSize: 15, color: COLORS.textPrimary, textAlign: 'right', borderWidth: 1, borderColor: COLORS.border }} placeholderTextColor={COLORS.textSecondary} {...props} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
