import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { useCart } from "../../src/cart";

export default function Cart() {
  const router = useRouter();
  const { items, setQty, remove, subtotal } = useCart();
  const delivery = subtotal === 0 ? 0 : subtotal >= 199 ? 0 : 25;
  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + delivery + tax).toFixed(2);

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.empty} edges={["top"]}>
        <ShoppingBag color={COLORS.muted} size={64} />
        <Text style={s.emptyT}>Your cart is empty</Text>
        <Text style={s.emptyS}>Add fresh items to get started</Text>
        <TouchableOpacity testID="cart-shop" style={s.shopBtn} onPress={() => router.push("/(customer)/home")}>
          <Text style={s.shopTxt}>Start shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.title}>My Cart</Text>
        <Text style={s.sub}>{items.length} items · arriving in 10 min</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 200 }}>
        {items.map((i) => {
          const lp = i.price * (1 - i.discount_pct / 100);
          return (
            <View key={i.product_id} style={s.row} testID={`cart-row-${i.product_id}`}>
              <View style={s.imgBox}>
                {i.image ? <Image source={{ uri: i.image }} style={s.img} /> : <Text>🛒</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={2}>{i.name}</Text>
                <Text style={s.unit}>{i.unit}</Text>
                <Text style={s.price}>₹{(lp * i.quantity).toFixed(0)}</Text>
              </View>
              <View style={s.qtyBox}>
                <TouchableOpacity testID={`dec-${i.product_id}`} style={s.qBtn} onPress={() => setQty(i.product_id, i.quantity - 1)}>
                  <Minus color={COLORS.primary} size={16} />
                </TouchableOpacity>
                <Text style={s.qty}>{i.quantity}</Text>
                <TouchableOpacity testID={`inc-${i.product_id}`} style={s.qBtn} onPress={() => setQty(i.product_id, i.quantity + 1)}>
                  <Plus color={COLORS.primary} size={16} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity testID={`rm-${i.product_id}`} style={s.rm} onPress={() => remove(i.product_id)}>
                <Trash2 color={COLORS.muted} size={16} />
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={s.bill}>
          <Text style={s.billH}>Bill details</Text>
          <Row k="Item total" v={`₹${subtotal.toFixed(0)}`} />
          <Row k="Delivery fee" v={delivery === 0 ? "FREE" : `₹${delivery}`} />
          <Row k="Taxes & charges" v={`₹${tax.toFixed(0)}`} />
          <View style={s.divider} />
          <Row k="To pay" v={`₹${total.toFixed(0)}`} bold />
          {delivery > 0 && <Text style={s.tip}>Add ₹{(199 - subtotal).toFixed(0)} more for FREE delivery</Text>}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <View style={{ flex: 1 }}>
          <Text style={s.fLabel}>{items.length} items</Text>
          <Text style={s.fTotal}>₹{total.toFixed(0)}</Text>
        </View>
        <TouchableOpacity testID="checkout-btn" style={s.checkoutBtn} onPress={() => router.push("/checkout")}>
          <Text style={s.checkoutTxt}>Checkout →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({ k, v, bold }: any) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={{ color: bold ? COLORS.text : COLORS.muted, fontWeight: bold ? "900" : "600", fontSize: bold ? 16 : 14 }}>{k}</Text>
      <Text style={{ color: COLORS.text, fontWeight: bold ? "900" : "700", fontSize: bold ? 16 : 14 }}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  empty: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", padding: SP.xl },
  emptyT: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginTop: SP.lg },
  emptyS: { color: COLORS.muted, marginTop: 4 },
  shopBtn: { marginTop: SP.xl, backgroundColor: COLORS.primary, paddingHorizontal: SP.xxl, paddingVertical: 14, borderRadius: RAD.md },
  shopTxt: { color: "#fff", fontWeight: "800" },
  header: { padding: SP.lg, paddingBottom: 0 },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  sub: { color: COLORS.muted, marginTop: 2 },
  row: {
    flexDirection: "row", backgroundColor: "#fff", padding: SP.md, borderRadius: RAD.md,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SP.sm, alignItems: "center", gap: SP.md,
  },
  imgBox: { width: 56, height: 56, borderRadius: 8, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  img: { width: 50, height: 50, resizeMode: "contain", borderRadius: 6 },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  unit: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  price: { fontWeight: "900", color: COLORS.text, marginTop: 4 },
  qtyBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 6, padding: 2 },
  qBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  qty: { fontWeight: "900", color: COLORS.primary, paddingHorizontal: 6 },
  rm: { padding: 4 },
  bill: { backgroundColor: "#fff", padding: SP.lg, borderRadius: RAD.md, marginTop: SP.md, borderWidth: 1, borderColor: COLORS.border },
  billH: { fontWeight: "900", fontSize: 16, color: COLORS.text, marginBottom: SP.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SP.sm },
  tip: { marginTop: SP.sm, color: COLORS.success, fontSize: 12, fontWeight: "700" },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0, padding: SP.lg,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: COLORS.border,
    flexDirection: "row", alignItems: "center", gap: SP.md,
  },
  fLabel: { color: COLORS.muted, fontSize: 12 },
  fTotal: { fontWeight: "900", fontSize: 22, color: COLORS.text },
  checkoutBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SP.xl, paddingVertical: 14, borderRadius: RAD.md },
  checkoutTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
