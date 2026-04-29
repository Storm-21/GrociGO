import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, TrendingUp } from "lucide-react-native";
import PortalShell from "../../src/portalShell";
import { COLORS, RAD, SP } from "../../src/theme";
import { adminApi } from "../../src/api";

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const { width } = useWindowDimensions();
  const cols = width > 900 ? 4 : 2;

  const load = async () => { try { setD(await adminApi.dashboard()); } catch {} };
  useFocusEffect(useCallback(() => { load(); }, []));

  if (!d) return <PortalShell active="dashboard"><ActivityIndicator color={COLORS.primary} /></PortalShell>;

  const cards = [
    { l: "Today's Revenue", v: `₹${d.today_revenue.toFixed(0)}`, big: true, c: COLORS.primary },
    { l: "Total Orders", v: d.today_orders, c: COLORS.text },
    { l: "Pending", v: d.today_pending, c: COLORS.warning },
    { l: "Delivered", v: d.today_delivered, c: COLORS.success },
    { l: "Total Products", v: d.total_products, c: COLORS.text },
    { l: "Low Stock Alerts", v: d.low_stock_count, c: d.low_stock_count > 0 ? COLORS.danger : COLORS.success },
  ];

  return (
    <PortalShell active="dashboard">
      <Text style={s.h}>Dashboard</Text>
      <Text style={s.sub}>Real-time snapshot of GrociGO operations</Text>
      <View style={s.grid}>
        {cards.map((c, i) => (
          <View key={i} style={[s.card, i === 0 && s.bigCard, i === 0 && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, { width: i === 0 ? "100%" : `${100/cols - 2}%` }]}>
            <Text style={[s.cardL, i === 0 && { color: "#fff", opacity: 0.9 }]}>{c.l}</Text>
            <Text style={[s.cardV, { color: i === 0 ? "#fff" : c.c }, i === 0 && { fontSize: 48 }]}>{c.v}</Text>
            {i === 0 && <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <TrendingUp color="#fff" size={14} />
              <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6, fontSize: 12 }}>Live · refreshes on focus</Text>
            </View>}
          </View>
        ))}
      </View>

      {d.low_stock_items.length > 0 && (
        <View style={s.alert}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle color={COLORS.danger} size={20} />
            <Text style={s.alertT}>Low stock items ({d.low_stock_items.length})</Text>
          </View>
          {d.low_stock_items.map((p: any) => (
            <View key={p.id} style={s.lsRow}>
              <Text style={s.lsN}>{p.name}</Text>
              <View style={s.lsBadge}><Text style={s.lsBadgeT}>{p.stock} left</Text></View>
            </View>
          ))}
        </View>
      )}
    </PortalShell>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 32, fontWeight: "900", color: COLORS.text, letterSpacing: -1 },
  sub: { color: COLORS.muted, marginTop: 4, marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, minWidth: 140 },
  bigCard: { padding: 28 },
  cardL: { color: COLORS.muted, fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  cardV: { fontWeight: "900", fontSize: 28, marginTop: 8 },
  alert: { marginTop: 24, padding: 20, backgroundColor: "#fff", borderRadius: 16, borderLeftWidth: 4, borderLeftColor: COLORS.danger, borderWidth: 1, borderColor: COLORS.border },
  alertT: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  lsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  lsN: { color: COLORS.text, fontWeight: "700" },
  lsBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  lsBadgeT: { color: "#fff", fontWeight: "900", fontSize: 11 },
});
