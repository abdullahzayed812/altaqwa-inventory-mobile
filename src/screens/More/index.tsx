import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

const ITEMS = [
  { icon: '🌾', label: 'المنتجات', screen: 'Products' },
  { icon: '🛒', label: 'المشتريات', screen: 'Purchases' },
  { icon: '💳', label: 'مدفوعات العملاء', screen: 'Payments' },
  { icon: '🚗', label: 'السائقون', screen: 'Drivers' },
  { icon: '📊', label: 'التقارير', screen: 'Reports' },
  { icon: '⚙️', label: 'إعدادات الاتصال (IP)', screen: 'IPConfig', isRoot: true },
];

export default function MoreScreen({ navigation }: any) {
  const handlePress = (item: typeof ITEMS[0]) => {
    if (item.isRoot) {
      // Use navigate on the parent navigator if needed, 
      // but usually navigation.navigate('IPConfig') works if it's in the stack
      navigation.navigate('IPConfig');
    } else {
      navigation.navigate(item.screen);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>المزيد</Text>
        {ITEMS.map(item => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.arrow}>›</Text>
            <View style={styles.itemRight}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemIcon}>{item.icon}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'right', marginBottom: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: { fontSize: 24 },
  itemLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  arrow: { fontSize: 22, color: COLORS.textSecondary },
});
