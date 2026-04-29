import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import PortalShell from "../../src/portalShell";
import { COLORS } from "../../src/theme";
import { adminApi } from "../../src/api";

export default function Reports() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any>(null);

  useEffect(() => { adminApi.balanceSheet(days).then(setData); }, [days]);

  if (!data) return <PortalShell active="reports"><ActivityIndicator color={COLORS.primary} /></PortalShell>;

  return (
    <PortalShell active="reports">
      <Text style={s.h}>Balance Sheet</Text>
      <Text style={s.sub}>Daily revenue, tax, and order trends</Text>

      <View style={s.tabs}>
        {[7, 14, 30].map((d) => (
          <TouchableOpacity key={d} testID={`days-${d}`} style={[s.tab, days === d && s.tabA]} onPress={() => setDays(d)}>
            <Text style={[s.tabT, days === d && { color: "#fff" }]}>Last {d} days</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.summaryRow}>
        <Stat l="Total Revenue" v={`₹${data.summary.total_revenue.toFixed(0)}`} big />
        <Stat l="Total Orders" v={data.summary.total_orders} />
        <Stat l="Tax Collected" v={`₹${data.summary.total_tax.toFixed(0)}`} />
      </View>

      <Text style={s.sec}>Daily Breakdown</Text>
      <View style={s.table}>
        <View style={[s.row, s.thead]}>
          <Text style={[s.cell, s.th, { flex: 1.5 }]}>Date</Text>
          <Text style={[s.cell, s.th]}>Orders</Text>
          <Text style={[s.cell, s.th, { flex: 1.5 }]}>Revenue</Text>
          <Text style={[s.cell, s.th]}>Tax</Text>
          <Text style={[s.cell, s.th]}>Delivery</Text>
        </View>
        {data.days.map((r: any, i: number) => (
          <View key={r.day} style={[s.row, i % 2 === 1 && { backgroundColor: COLORS.bg }]}>
            <Text style={[s.cell, { flex: 1.5, fontWeight: "700" }]}>{r.day}</Text>
            <Text style={s.cell}>{r.orders}</Text>
            <Text style={[s.cell, { flex: 1.5, fontWeight: "900", color: COLORS.primary }]}>₹{r.revenue.toFixed(0)}</Text>
            <Text style={s.cell}>₹{r.tax.toFixed(0)}</Text>
            <Text style={s.cell}>₹{r.delivery.toFixed(0)}</Text>
          </View>
        ))}
        {data.days.length === 0 && <Text style={s.empty}>No order data for this period</Text>}
      </View>
    </PortalShell>
  );
}

function Stat({ l, v, big }: any) {
  return (
    <View style={[s.stat, big && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
      <Text style={[s.statL, big && { color: "#fff", opacity: 0.9 }]}>{l}</Text>
      <Text style={[s.statV, big && { color: "#fff" }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 32, fontWeight: "900", color: COLORS.text, letterSpacing: -1 },
  sub: { color: COLORS.muted, marginTop: 4, marginBottom: 20 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: "#fff" },
  tabA: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  tabT: { fontWeight: "800", color: COLORS.text, fontSize: 13 },
  summaryRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  stat: { flex: 1, minWidth: 160, padding: 20, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border },
  statL: { color: COLORS.muted, fontWeight: "700", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  statV: { color: COLORS.text, fontWeight: "900", fontSize: 28, marginTop: 6 },
  sec: { fontSize: 18, fontWeight: "900", color: COLORS.text, marginTop: 28, marginBottom: 12 },
  table: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  row: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  thead: { backgroundColor: COLORS.text },
  cell: { flex: 1, color: COLORS.text, fontSize: 14 },
  th: { color: "#fff", fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  empty: { textAlign: "center", color: COLORS.muted, padding: 32 },
});
