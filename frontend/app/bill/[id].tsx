import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, Printer } from "lucide-react-native";
import { COLORS, SP, FONT } from "../../src/theme";
import { orderApi } from "../../src/api";

export default function Bill() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => { orderApi.bill(id!).then(setData); }, [id]);

  if (!data) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;
  const { order: o, shop } = data;
  const dt = new Date(o.created_at);

  return (
    <SafeAreaView style={s.c}>
      <View style={s.head}>
        <TouchableOpacity testID="bill-close" onPress={() => router.back()}><X color={COLORS.text} size={24} /></TouchableOpacity>
        <Text style={s.title}>Bill / Receipt</Text>
        <TouchableOpacity testID="bill-print"><Printer color={COLORS.text} size={20} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: SP.lg }}>
        <View style={s.paper}>
          <Text style={s.shopName}>{shop?.name || "Daily Basket"}</Text>
          <Text style={s.shopMeta}>{shop?.tagline || ""}</Text>
          <Text style={s.shopMeta}>{shop?.address || ""}</Text>
          <Text style={s.shopMeta}>Tel: {shop?.phone || ""}</Text>
          {shop?.gst ? <Text style={s.shopMeta}>GSTIN: {shop.gst}</Text> : null}

          <Dashed />

          <Row k="Bill No" v={o.order_no} />
          <Row k="Date" v={dt.toLocaleString()} />
          <Row k="Customer" v={o.user_name} />
          <Row k="Phone" v={o.user_phone} />
          <Row k="Address" v={`${o.address.line1}, ${o.address.city} - ${o.address.pincode}`} small />
          <Row k="Payment" v={o.payment_method.toUpperCase() + " · " + o.payment_status.toUpperCase()} />

          <Dashed />
          <Row k="ITEM" v="QTY  RATE  TOTAL" head />
          <Dashed />

          {o.items.map((it: any, i: number) => {
            const rate = it.price * (1 - (it.discount_pct || 0) / 100);
            return (
              <View key={i} style={{ marginVertical: 2 }}>
                <Text style={s.iName}>{it.name}</Text>
                <Text style={s.iLine}>{`  ${it.quantity} x ₹${rate.toFixed(0)}  =  ₹${it.line_total.toFixed(0)}`}</Text>
              </View>
            );
          })}

          <Dashed />
          <Row k="Subtotal" v={`₹${o.subtotal.toFixed(2)}`} />
          <Row k="Delivery" v={`₹${o.delivery_fee.toFixed(2)}`} />
          <Row k="Tax (5%)" v={`₹${o.tax.toFixed(2)}`} />
          <Dashed />
          <Row k="GRAND TOTAL" v={`₹${o.total.toFixed(2)}`} bold />
          <Dashed />

          <Text style={s.foot}>** Thank you for shopping **</Text>
          <Text style={s.foot}>Visit again at {shop?.name || "Daily Basket"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Dashed() {
  return <Text style={{ fontFamily: FONT.mono, color: COLORS.muted, marginVertical: 4 }}>{"- - - - - - - - - - - - - - - - - - - - - - -"}</Text>;
}
function Row({ k, v, bold, small, head }: any) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={[s.tx, { fontWeight: bold || head ? "900" : "600", fontSize: small ? 11 : 13, flex: 1 }]}>{k}</Text>
      <Text style={[s.tx, { fontWeight: bold || head ? "900" : "600", fontSize: small ? 11 : 13 }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SP.lg, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontWeight: "900", color: COLORS.text },
  paper: { backgroundColor: "#fff", padding: SP.lg, borderRadius: 4, borderStyle: "dashed", borderWidth: 1, borderColor: COLORS.muted },
  shopName: { fontFamily: FONT.mono, fontSize: 22, fontWeight: "900", color: COLORS.text, textAlign: "center" },
  shopMeta: { fontFamily: FONT.mono, fontSize: 11, color: COLORS.text, textAlign: "center", marginTop: 2 },
  tx: { fontFamily: FONT.mono, color: COLORS.text },
  iName: { fontFamily: FONT.mono, fontSize: 13, color: COLORS.text, fontWeight: "700" },
  iLine: { fontFamily: FONT.mono, fontSize: 12, color: COLORS.text },
  foot: { fontFamily: FONT.mono, fontSize: 11, color: COLORS.muted, textAlign: "center", marginTop: 4 },
});
