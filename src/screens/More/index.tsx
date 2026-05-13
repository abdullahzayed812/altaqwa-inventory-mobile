import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";

const ITEMS = [
  { icon: "🌾", label: "المنتجات", sub: "إدارة المخزون والأسعار", screen: "Products", color: COLORS.primary },
  { icon: "🛒", label: "المشتريات", sub: "سجل فواتير الشراء", screen: "Purchases", color: COLORS.info },
  { icon: "💳", label: "مدفوعات العملاء", sub: "تتبع الدفعات المستلمة", screen: "Payments", color: COLORS.success },
  { icon: "🚗", label: "السائقون", sub: "إدارة فريق التوصيل", screen: "Drivers", color: COLORS.warning },
  { icon: "📊", label: "التقارير", sub: "تقارير الأداء والإيرادات", screen: "Reports", color: COLORS.balanceBlue },
];

export default function MoreScreen({ navigation }: any) {
  const handlePress = (item: (typeof ITEMS)[0]) => {
    navigation.navigate(item.screen);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>المزيد</Text>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            activeOpacity={0.72}
            onPress={() => handlePress(item)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color + "18" }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.textGroup}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemSub}>{item.sub}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 16 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 22 },
  textGroup: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  itemSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: 20, color: COLORS.textSecondary },
});
