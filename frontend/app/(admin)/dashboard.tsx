import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { LogOut, AlertTriangle } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { adminApi } from "../../src/api";
import { useAuth } from "../../src/auth";

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [d, setD] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setD(await adminApi.dashboard()); } catch {}
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onR = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!d) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <View style={s.head}>
        <View>
          <Text style={s.hi}>Hi, {user?.name}</Text>
          <Text style={s.role}>{user?.role?.toUpperCase()} CONSOLE</Text>
        </View>
        <TouchableOpacity testID="adm-logout" onPress={async () => { await logout(); router.replace("/(auth)/login"); }}>
          <LogOut color={COLORS.text} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onR} />}>
        <Text style={s.sec}>Today</Text>
        <View style={s.grid}>
          <Stat big label="Revenue" v={`₹${d.today_revenue.toFixed(0)}`} bg={COLORS.primary} fg="#fff" />
          <Stat label="Orders" v={d.today_orders} />
          <Stat label="Pending" v={d.today_pending} fg={COLORS.warning} />
          <Stat label="Delivered" v={d.today_delivered} fg={COLORS.success} />
        </View>

        <Text style={s.sec}>Inventory</Text>
        <View style={s.grid}>
          <Stat label="Total Products" v={d.total_products} />
          <Stat label="Low Stock" v={d.low_stock_count} fg={d.low_stock_count > 0 ? COLORS.primary : COLORS.success} />
        </View>

        {d.low_stock_items.length > 0 && (
          <View style={s.alert}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <AlertTriangle color={COLORS.primary} size={18} />
              <Text style={s.alertT}>Low stock items</Text>
            </View>
            {d.low_stock_items.map((p: any) => (
              <View key={p.id} style={s.lsRow}>
                <Text style={s.lsN}>{p.name}</Text>
                <Text style={s.lsS}>{p.stock} left</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, v, bg, fg, big }: any) {
  return (
    <View style={[s.stat, big && { width: "100%" }, bg && { backgroundColor: bg, borderColor: bg }]}>
      <Text style={[s.statL, fg && { color: fg, opacity: 0.9 }]}>{label}</Text>
      <Text style={[s.statV, fg && { color: fg }, big && { fontSize: 36 }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SP.lg, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  hi: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  role: { fontSize: 11, color: COLORS.primary, fontWeight: "900", letterSpacing: 1, marginTop: 2 },
  sec: { fontSize: 16, fontWeight: "900", color: COLORS.text, marginTop: SP.lg, marginBottom: SP.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SP.sm },
  stat: { width: "48%", backgroundColor: "#fff", padding: SP.lg, borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border },
  statL: { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  statV: { color: COLORS.text, fontWeight: "900", fontSize: 24, marginTop: 4 },
  alert: { marginTop: SP.lg, padding: SP.lg, backgroundColor: "#fff", borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.primary },
  alertT: { fontWeight: "900", color: COLORS.text },
  lsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  lsN: { color: COLORS.text, fontWeight: "600" },
  lsS: { color: COLORS.primary, fontWeight: "900" },
});
