import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RAD, SP } from "../../src/theme";
import { adminApi } from "../../src/api";

export default function Reports() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any>(null);

  useEffect(() => { adminApi.balanceSheet(days).then(setData); }, [days]);

  if (!data) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <Text style={s.h}>Balance Sheet</Text>
      <View style={s.tabs}>
        {[7, 14, 30].map((d) => (
          <TouchableOpacity key={d} testID={`days-${d}`} style={[s.tab, days === d && s.tabA]} onPress={() => setDays(d)}>
            <Text style={[s.tabT, days === d && { color: "#fff" }]}>{d} days</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 32 }}>
        <View style={s.summary}>
          <Stat label="Total Revenue" v={`₹${data.summary.total_revenue.toFixed(0)}`} big />
          <View style={{ flexDirection: "row", gap: SP.sm, marginTop: SP.md }}>
            <Stat label="Orders" v={data.summary.total_orders} />
            <Stat label="Tax collected" v={`₹${data.summary.total_tax.toFixed(0)}`} />
          </View>
        </View>

        <Text style={s.sec}>Daily breakdown</Text>
        <View style={s.table}>
          <View style={[s.row, s.head]}>
            <Text style={[s.cell, s.cellH, { flex: 1.5 }]}>Day</Text>
            <Text style={[s.cell, s.cellH]}>Orders</Text>
            <Text style={[s.cell, s.cellH, { flex: 1.5 }]}>Revenue</Text>
            <Text style={[s.cell, s.cellH]}>Tax</Text>
          </View>
          {data.days.map((r: any, i: number) => (
            <View key={r.day} style={[s.row, i % 2 === 0 && { backgroundColor: COLORS.bg }]}>
              <Text style={[s.cell, { flex: 1.5 }]}>{r.day}</Text>
              <Text style={s.cell}>{r.orders}</Text>
              <Text style={[s.cell, s.bold, { flex: 1.5 }]}>₹{r.revenue.toFixed(0)}</Text>
              <Text style={s.cell}>₹{r.tax.toFixed(0)}</Text>
            </View>
          ))}
          {data.days.length === 0 && <Text style={s.empty}>No data yet — orders will appear here</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, v, big }: any) {
  return (
    <View style={[s.stat, big && { backgroundColor: COLORS.primary }]}>
      <Text style={[s.statL, big && { color: "#fff", opacity: 0.9 }]}>{label}</Text>
      <Text style={[s.statV, big && { color: "#fff", fontSize: 32 }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  h: { fontSize: 22, fontWeight: "900", color: COLORS.text, padding: SP.lg, paddingBottom: SP.sm },
  tabs: { flexDirection: "row", gap: SP.sm, paddingHorizontal: SP.lg, paddingBottom: SP.md },
  tab: { paddingHorizontal: SP.lg, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: "#fff" },
  tabA: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  tabT: { fontWeight: "800", color: COLORS.text, fontSize: 13 },
  summary: {},
  stat: { flex: 1, backgroundColor: "#fff", padding: SP.lg, borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border },
  statL: { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  statV: { color: COLORS.text, fontWeight: "900", fontSize: 22, marginTop: 4 },
  sec: { fontSize: 16, fontWeight: "900", color: COLORS.text, marginTop: SP.lg, marginBottom: SP.sm },
  table: { backgroundColor: "#fff", borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  row: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: SP.md },
  head: { backgroundColor: COLORS.text },
  cell: { flex: 1, color: COLORS.text, fontSize: 13 },
  cellH: { color: "#fff", fontWeight: "900", fontSize: 12 },
  bold: { fontWeight: "900" },
  empty: { textAlign: "center", color: COLORS.muted, padding: 32 },
});
