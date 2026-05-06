import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, CURRENCY } from '../constants/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  isCurrency?: boolean;
}

export default function StatCard({ label, value, icon, color = COLORS.primary, isCurrency = false }: StatCardProps) {
  const display = isCurrency
    ? `${Number(value).toLocaleString('ar-EG')} ${CURRENCY}`
    : String(value);

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]} numberOfLines={1}>
        {display}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    margin: 6,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { fontSize: 28, marginBottom: 8 },
  value: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  label: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
