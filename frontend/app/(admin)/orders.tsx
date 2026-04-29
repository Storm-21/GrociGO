import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Receipt, ArrowRight } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { orderApi } from "../../src/api";

const TABS = [
  { id: "placed", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "out_for_delivery", label: "Out" },
  { id: "delivered", label: "Done" },
];
const NEXT: any = { placed: "preparing", preparing: "out_for_delivery", out_for_delivery: "delivered" };

export default function AdminOrders() {
  const router = useRouter();
  const [tab, setTab] = useState("placed");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setOrders(await orderApi.all(tab)); } catch {}
    setLoading(false);
  };
  useFocusEffect(useCallback(() => { load(); }, [tab]));

  const advance = async (o: any) => {
    if (!NEXT[o.status]) return;
    await orderApi.status(o.id, NEXT[o.status]);
    load();
  };

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <Text style={s.h}>Orders Console</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.id} testID={`tab-${t.id}`} style={[s.tab, tab === t.id && s.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabT, tab === t.id && { color: "#fff" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} /> :
        <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 32 }}>
          {orders.length === 0 && <Text style={s.empty}>No orders in this tab</Text>}
          {orders.map((o) => (
            <View key={o.id} style={s.card} testID={`adm-order-${o.id}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={s.no}>#{o.order_no}</Text>
                <Text style={s.tot}>₹{o.total.toFixed(0)}</Text>
              </View>
              <Text style={s.cus}>{o.user_name} · {o.user_phone}</Text>
              <Text style={s.addr}>{o.address.line1}, {o.address.city}</Text>
              <Text style={s.it}>{o.items.length} items · {o.payment_method.toUpperCase()}</Text>

              <View style={s.actions}>
                <TouchableOpacity testID={`adm-bill-${o.id}`} style={s.bill} onPress={() => router.push(`/bill/${o.id}`)}>
                  <Receipt color={COLORS.text} size={14} />
                  <Text style={s.billT}>Print Bill</Text>
                </TouchableOpacity>
                {NEXT[o.status] && (
                  <TouchableOpacity testID={`adv-${o.id}`} style={s.adv} onPress={() => advance(o)}>
                    <Text style={s.advT}>Move to {NEXT[o.status].replace(/_/g, " ")}</Text>
                    <ArrowRight color="#fff" size={14} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  h: { fontSize: 22, fontWeight: "900", color: COLORS.text, padding: SP.lg, paddingBottom: SP.sm },
  tabs: { paddingHorizontal: SP.lg, gap: SP.sm, paddingBottom: SP.md },
  tab: { paddingHorizontal: SP.lg, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: "#fff" },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabT: { fontWeight: "800", color: COLORS.text, fontSize: 13 },
  empty: { textAlign: "center", color: COLORS.muted, padding: 32 },
  card: { backgroundColor: "#fff", padding: SP.lg, borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SP.md },
  no: { fontWeight: "900", color: COLORS.text },
  tot: { fontWeight: "900", color: COLORS.primary, fontSize: 18 },
  cus: { color: COLORS.text, fontWeight: "700", marginTop: 6 },
  addr: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  it: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: "row", gap: SP.sm, marginTop: SP.md },
  bill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  billT: { fontWeight: "800", color: COLORS.text, fontSize: 12 },
  adv: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.primary, flex: 1, justifyContent: "center" },
  advT: { color: "#fff", fontWeight: "800", fontSize: 12, textTransform: "capitalize" },
});
