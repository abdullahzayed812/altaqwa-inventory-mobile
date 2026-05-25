import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getSuppliers } from "../../api";
import { Supplier } from "../../types";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { COLORS, CURRENCY } from "../../constants/theme";

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initial = name.trim()[0] ?? "?";
  const hue = (([...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 360) + 180) % 360;
  const bg = `hsl(${hue}, 40%, 52%)`;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  );
}

export default function SuppliersScreen({ navigation }: any) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
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

  React.useEffect(() => {
    if (!search.trim()) {
      setFiltered(suppliers);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.phone?.includes(q)));
  }, [search, suppliers]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
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
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🏭" message="لا يوجد موردون" />}
        renderItem={({ item: s }) => (
          <Card onPress={() => navigation.navigate("SupplierDetails", { supplier: s })}>
            <View style={styles.row}>
              <Avatar name={s.name} />
              <View style={styles.info}>
                <Text style={styles.name}>{s.name}</Text>
                {s.phone && <Text style={styles.sub}>{s.phone}</Text>}
              </View>
              <View style={styles.balanceBox}>
                {s.totalBalance > 0 ? (
                  <View style={[styles.balanceBadge, { backgroundColor: COLORS.success + "12" }]}>
                    <Text style={[styles.balanceValue, { color: COLORS.success }]}>دائن: {Math.abs(s.totalBalance).toLocaleString("ar-EG")}</Text>
                    <Text style={[styles.balanceCurrency, { color: COLORS.success }]}>{CURRENCY}</Text>
                  </View>
                ) : s.totalBalance < 0 ? (
                  <View style={styles.balanceBadge}>
                    <Text style={styles.balanceValue}>مدين: {Math.abs(s.totalBalance).toLocaleString("ar-EG")}</Text>
                    <Text style={styles.balanceCurrency}>{CURRENCY}</Text>
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

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddSupplier")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
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
  balanceBox: { alignItems: "flex-end" },
  balanceBadge: { backgroundColor: COLORS.balanceBlue + "12", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignItems: "center" },
  balanceValue: { fontSize: 14, fontWeight: "bold", color: COLORS.balanceBlue },
  balanceCurrency: { fontSize: 10, color: COLORS.balanceBlue, marginTop: 1 },
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
