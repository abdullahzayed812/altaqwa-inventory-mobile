import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDashboardStats } from "../../api";
import { DashboardStats } from "../../types";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { COLORS, CURRENCY } from "../../constants/theme";
import BgLogo from "../../components/BgLogo";

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setStats(await getDashboardStats());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <BgLogo />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {/* Header */}
        {/* <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>مرحباً 👋</Text>
            <Text style={styles.headerTitle}>لوحة التحكم</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>🌾</Text>
          </View>
        </View> */}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="إجمالي المبيعات" value={stats?.totalSales ?? 0} icon="💰" color={COLORS.primary} isCurrency />
          <StatCard label="إجمالي مديونية العملاء" value={stats?.totalDebt ?? 0} icon="📋" color={COLORS.debtRed} isCurrency />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="إجمالي مدفوعات العملاء" value={stats?.totalPayments ?? 0} icon="✅" color={COLORS.success} isCurrency />
          <StatCard label="مخزون منخفض" value={stats?.lowStockCount ?? 0} icon="⚠️" color={COLORS.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="إجمالي المشتريات" value={stats?.totalPurchases ?? 0} icon="🛒" color={COLORS.primary} isCurrency />
          <StatCard label="إجمالي دفعات الشركات" value={stats?.totalCompanyPayments ?? 0} icon="🏢" color={COLORS.success} isCurrency />
        </View>

        {/* Top Products */}
        <SectionTitle title="أعلى المنتجات مخزوناً" />
        {(stats?.topProducts ?? []).length === 0 ? (
          <Text style={styles.empty}>لا توجد منتجات</Text>
        ) : (
          (stats?.topProducts ?? []).map((product) => (
            <Card key={product.id}>
              <View style={styles.productRow}>
                <View style={styles.productIconBox}>
                  <Text style={{ fontSize: 18 }}>🌾</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>
                    {product.price.toLocaleString("ar-EG")} {CURRENCY}
                  </Text>
                </View>
                <View style={[styles.stockBadge, product.stock < 10 && styles.lowStockBadge]}>
                  <Text style={styles.stockText}>{product.stock} وحدة</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={st.row}>
      <View style={st.accent} />
      <Text style={st.text}>{title}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 12 },
  accent: { width: 4, height: 20, backgroundColor: COLORS.primary, borderRadius: 2, marginRight: 10 },
  text: { fontSize: 17, fontWeight: "bold", color: COLORS.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, overflow: "hidden" },
  content: { padding: 16, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: { fontSize: 26 },
  statsRow: { flexDirection: "row", marginHorizontal: -6, marginBottom: 0 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  productIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  productPrice: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  stockBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  lowStockBadge: { backgroundColor: COLORS.warning },
  stockText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  empty: { color: COLORS.textSecondary, textAlign: "center", padding: 24 },
});
