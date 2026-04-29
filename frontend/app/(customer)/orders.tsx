import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Package, ChevronRight, MapPin, Receipt } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { orderApi } from "../../src/api";

const STATUS_COLORS: any = {
  placed: COLORS.warning, preparing: COLORS.warning, out_for_delivery: COLORS.primary,
  delivered: COLORS.success, cancelled: COLORS.muted,
};

const STATUS_LABEL: any = {
  placed: "Order placed", preparing: "Preparing", out_for_delivery: "Out for delivery",
  delivered: "Delivered", cancelled: "Cancelled",
};

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.mine().then((d) => { setOrders(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;
  if (orders.length === 0)
    return (
      <SafeAreaView style={s.empty} edges={["top"]}>
        <Package color={COLORS.muted} size={64} />
        <Text style={s.emptyT}>No orders yet</Text>
        <Text style={s.emptyS}>Your past orders appear here</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <Text style={s.h}>My Orders</Text>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 32 }}>
        {orders.map((o) => (
          <View key={o.id} style={s.card} testID={`order-${o.id}`}>
            <View style={s.cardHead}>
              <Text style={s.no}>#{o.order_no}</Text>
              <View style={[s.pill, { backgroundColor: STATUS_COLORS[o.status] + "22" }]}>
                <Text style={[s.pillT, { color: STATUS_COLORS[o.status] }]}>{STATUS_LABEL[o.status]}</Text>
              </View>
            </View>
            <Text style={s.items}>{o.items.length} items · ₹{o.total.toFixed(0)} · {o.payment_method.toUpperCase()}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <MapPin color={COLORS.muted} size={12} />
              <Text style={s.addr} numberOfLines={1}> {o.address.line1}, {o.address.city}</Text>
            </View>

            <View style={s.actions}>
              {o.status !== "delivered" && o.status !== "cancelled" && (
                <TouchableOpacity testID={`track-${o.id}`} style={s.trackBtn} onPress={() => router.push(`/track/${o.id}`)}>
                  <Text style={s.trackTxt}>Track live →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity testID={`bill-${o.id}`} style={s.billBtn} onPress={() => router.push(`/bill/${o.id}`)}>
                <Receipt color={COLORS.text} size={14} />
                <Text style={s.billTxt}>Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  empty: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  emptyT: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginTop: SP.lg },
  emptyS: { color: COLORS.muted, marginTop: 4 },
  h: { fontSize: 24, fontWeight: "900", color: COLORS.text, padding: SP.lg },
  card: { backgroundColor: "#fff", borderRadius: RAD.md, padding: SP.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SP.md },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  no: { fontWeight: "900", color: COLORS.text },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillT: { fontWeight: "800", fontSize: 11 },
  items: { color: COLORS.muted, marginTop: 6, fontSize: 13 },
  addr: { color: COLORS.muted, fontSize: 12, flex: 1 },
  actions: { flexDirection: "row", gap: SP.sm, marginTop: SP.md },
  trackBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  trackTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  billBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  billTxt: { color: COLORS.text, fontWeight: "800", fontSize: 13 },
});
