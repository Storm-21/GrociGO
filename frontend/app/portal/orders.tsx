import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Receipt, ArrowRight } from "lucide-react-native";
import PortalShell from "../../src/portalShell";
import { COLORS, RAD, SP } from "../../src/theme";
import { orderApi } from "../../src/api";

const TABS = [
  { id: "placed", label: "New Orders" },
  { id: "preparing", label: "Preparing" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
];
const NEXT: any = { placed: "preparing", preparing: "out_for_delivery", out_for_delivery: "delivered" };

export default function Orders() {
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
    <PortalShell active="orders">
      <Text style={s.h}>Orders Console</Text>
      <Text style={s.sub}>Track and fulfill incoming orders in real-time</Text>

      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.id} testID={`tab-${t.id}`} style={[s.tab, tab === t.id && s.tabA]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabT, tab === t.id && { color: "#fff" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} /> :
        orders.length === 0 ? <Text style={s.empty}>No orders in "{TABS.find(t => t.id === tab)?.label}"</Text> :
          <View style={s.cards}>
            {orders.map((o) => (
              <View key={o.id} style={s.card} testID={`adm-order-${o.id}`}>
                <View style={s.cardH}>
                  <View>
                    <Text style={s.no}>#{o.order_no}</Text>
                    <Text style={s.dt}>{new Date(o.created_at).toLocaleString()}</Text>
                  </View>
                  <Text style={s.tot}>₹{o.total.toFixed(0)}</Text>
                </View>
                <View style={s.divider} />
                <Text style={s.cus}>👤 {o.user_name} · 📞 {o.user_phone}</Text>
                <Text style={s.addr}>📍 {o.address.line1}, {o.address.city} - {o.address.pincode}</Text>
                <Text style={s.it}>🛍 {o.items.length} items · 💳 {o.payment_method.toUpperCase()} ({o.payment_status})</Text>

                <View style={s.actions}>
                  <TouchableOpacity testID={`adm-bill-${o.id}`} style={s.bill} onPress={() => router.push(`/bill/${o.id}`)}>
                    <Receipt color={COLORS.text} size={14} /><Text style={s.billT}>Print Bill</Text>
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
          </View>}
    </PortalShell>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 32, fontWeight: "900", color: COLORS.text, letterSpacing: -1 },
  sub: { color: COLORS.muted, marginTop: 4, marginBottom: 20 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: "#fff" },
  tabA: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabT: { fontWeight: "800", color: COLORS.text, fontSize: 13 },
  empty: { textAlign: "center", color: COLORS.muted, padding: 48, fontSize: 14 },
  cards: { gap: 12 },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  cardH: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  no: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  dt: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  tot: { fontWeight: "900", color: COLORS.primary, fontSize: 22 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  cus: { color: COLORS.text, fontWeight: "700", marginVertical: 2 },
  addr: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  it: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  bill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  billT: { fontWeight: "800", color: COLORS.text, fontSize: 13 },
  adv: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.primary, flex: 1 },
  advT: { color: "#fff", fontWeight: "900", fontSize: 13, textTransform: "capitalize" },
});
