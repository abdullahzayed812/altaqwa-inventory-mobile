import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, CURRENCY } from "../constants/theme";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  isCurrency?: boolean;
}

export default function StatCard({ label, value, icon, color = COLORS.primary, isCurrency = false }: StatCardProps) {
  const display = isCurrency
    ? `${Number(value).toLocaleString("ar-EG")} ${CURRENCY}`
    : String(value);

  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: color + "18" }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
        {display}
      </Text>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.bottomBar, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    paddingBottom: 18,
    flex: 1,
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  icon: { fontSize: 19 },
  value: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  label: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
});
