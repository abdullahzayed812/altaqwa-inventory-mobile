import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getCustomers } from "../../api";
import { Customer } from "../../types";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { COLORS, CURRENCY } from "../../constants/theme";
import BgLogo from "../../components/BgLogo";

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initial = name.trim()[0] ?? "?";
  const hue = [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  const bg = `hsl(${hue}, 45%, 55%)`;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  );
}

export default function CustomersScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setFiltered(data);
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(customers);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q)));
  }, [search, customers]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <BgLogo />
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث بالاسم أو الهاتف..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearSearch}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="👥" message="لا يوجد عملاء" />}
        renderItem={({ item: c }) => (
          <Card onPress={() => navigation.navigate("CustomerDetails", { customer: c })}>
            <View style={styles.row}>
              <Avatar name={c.name} />
              <View style={styles.info}>
                <Text style={styles.name}>{c.name}</Text>
                {c.phone && <Text style={styles.sub}>{c.phone}</Text>}
              </View>
              <View style={styles.debtBox}>
                {c.totalDebt < 0 ? (
                  <View style={[styles.debtBadge, { backgroundColor: COLORS.success + "12" }]}>
                    <Text style={[styles.debtValue, { color: COLORS.success }]}>دائن: {Math.abs(c.totalDebt).toLocaleString("ar-EG")}</Text>
                    <Text style={[styles.debtCurrency, { color: COLORS.success }]}>{CURRENCY}</Text>
                  </View>
                ) : c.totalDebt > 0 ? (
                  <View style={styles.debtBadge}>
                    <Text style={styles.debtValue}>مدين: {c.totalDebt.toLocaleString("ar-EG")}</Text>
                    <Text style={styles.debtCurrency}>{CURRENCY}</Text>
                  </View>
                ) : (
                  <View style={styles.settledBadge}>
                    <Text style={styles.settledText}>✓ مسدد</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddCustomer")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, overflow: "hidden" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 4 },
  clearSearch: { padding: 4 },
  list: { padding: 14, paddingBottom: 90 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textAlign: "right" },
  debtBox: { alignItems: "flex-end" },
  debtBadge: { backgroundColor: COLORS.debtRed + "12", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignItems: "center" },
  debtValue: { fontSize: 14, fontWeight: "bold", color: COLORS.debtRed },
  debtCurrency: { fontSize: 10, color: COLORS.debtRed, marginTop: 1 },
  settledBadge: { backgroundColor: COLORS.success + "15", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  settledText: { fontSize: 12, color: COLORS.success, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 28, lineHeight: 32 },
});
