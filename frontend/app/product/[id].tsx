import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Plus, Minus, Zap } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { shopApi } from "../../src/api";
import { useCart } from "../../src/cart";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, add, setQty } = useCart();
  const [p, setP] = useState<any>(null);

  useEffect(() => { shopApi.product(id!).then(setP); }, [id]);
  const ci = items.find((i) => i.product_id === id);

  if (!p) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;
  const final = p.price * (1 - (p.discount_pct || 0) / 100);

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <View style={s.head}>
        <TouchableOpacity testID="pd-back" onPress={() => router.back()} style={s.iconBtn}>
          <ChevronLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.imgBox}>
          {p.image ? <Image source={{ uri: p.image }} style={s.img} /> : <Text style={{ fontSize: 80 }}>🛒</Text>}
        </View>
        <View style={s.body}>
          <View style={s.eta}>
            <Zap color="#fff" size={12} fill="#fff" />
            <Text style={s.etaT}>Delivery in 10 mins</Text>
          </View>
          <Text style={s.name}>{p.name}</Text>
          <Text style={s.unit}>{p.unit}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>₹{final.toFixed(0)}</Text>
            {p.discount_pct > 0 && (
              <>
                <Text style={s.strike}>₹{p.price.toFixed(0)}</Text>
                <View style={s.discBadge}><Text style={s.discTxt}>{Math.round(p.discount_pct)}% OFF</Text></View>
              </>
            )}
          </View>

          <Text style={s.descH}>About this item</Text>
          <Text style={s.desc}>{p.description}</Text>

          <View style={s.infoBox}>
            <Text style={s.infoT}>✓ Fresh & quality assured</Text>
            <Text style={s.infoT}>✓ Easy returns</Text>
            <Text style={s.infoT}>✓ Sealed packaging</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.bbL}>Total</Text>
          <Text style={s.bbT}>₹{(final * (ci?.quantity || 1)).toFixed(0)}</Text>
        </View>
        {ci ? (
          <View style={s.qBox}>
            <TouchableOpacity testID="pd-dec" onPress={() => setQty(p.id, ci.quantity - 1)} style={s.qb}>
              <Minus color="#fff" size={18} />
            </TouchableOpacity>
            <Text style={s.qN}>{ci.quantity}</Text>
            <TouchableOpacity testID="pd-inc" onPress={() => setQty(p.id, ci.quantity + 1)} style={s.qb}>
              <Plus color="#fff" size={18} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity testID="pd-add" style={s.add} onPress={() => add(p)}>
            <Text style={s.addT}>Add to cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  head: { padding: SP.md, position: "absolute", top: 40, left: 0, zIndex: 5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  imgBox: { width: "100%", height: 320, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  img: { width: "70%", height: "70%", resizeMode: "contain" },
  body: { padding: SP.lg, marginTop: -16, backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  eta: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  etaT: { color: "#fff", fontWeight: "900", fontSize: 11 },
  name: { fontSize: 24, fontWeight: "900", color: COLORS.text, marginTop: SP.md },
  unit: { color: COLORS.muted, marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: SP.md },
  price: { fontSize: 32, fontWeight: "900", color: COLORS.text },
  strike: { fontSize: 16, color: COLORS.muted, textDecorationLine: "line-through" },
  discBadge: { backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  discTxt: { color: "#fff", fontWeight: "900", fontSize: 11 },
  descH: { fontWeight: "900", color: COLORS.text, marginTop: SP.lg, fontSize: 16 },
  desc: { color: COLORS.muted, marginTop: 4, lineHeight: 20 },
  infoBox: { marginTop: SP.lg, padding: SP.lg, backgroundColor: "#fff", borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  infoT: { color: COLORS.text, fontWeight: "600" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SP.lg, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: SP.md },
  bbL: { color: COLORS.muted, fontSize: 12 },
  bbT: { fontWeight: "900", fontSize: 22, color: COLORS.text },
  add: { backgroundColor: COLORS.primary, paddingHorizontal: SP.xxl, paddingVertical: 14, borderRadius: RAD.md },
  addT: { color: "#fff", fontWeight: "900", fontSize: 16 },
  qBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: RAD.md, padding: 4 },
  qb: { padding: 10 },
  qN: { color: "#fff", fontWeight: "900", fontSize: 16, paddingHorizontal: 10 },
});
