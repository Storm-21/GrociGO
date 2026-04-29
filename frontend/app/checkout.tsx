import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Banknote, CreditCard } from "lucide-react-native";
import { COLORS, RAD, SP } from "../src/theme";
import { useCart } from "../src/cart";
import { orderApi } from "../src/api";

const PAY_OPTS = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay when delivered" },
  { id: "razorpay", label: "Razorpay (UPI / Card / Wallet / NetBanking)", desc: "Secure online payment" },
];

export default function Checkout() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [line1, setLine1] = useState("221B Bakery Street");
  const [line2, setLine2] = useState("Near Park");
  const [city, setCity] = useState("Delhi");
  const [pincode, setPincode] = useState("110001");
  const [pay, setPay] = useState("cod");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const delivery = subtotal >= 199 ? 0 : 25;
  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + delivery + tax).toFixed(2);

  const place = async () => {
    if (!line1 || !city || !pincode) return Alert.alert("Address", "Fill address fields");
    if (items.length === 0) return Alert.alert("Empty cart");
    setLoading(true);
    try {
      const order = await orderApi.place({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        address: { line1, line2, city, pincode, label: "Home" },
        payment_method: pay,
        notes,
      });
      if (pay === "razorpay") {
        if (Platform.OS !== "web") {
          Alert.alert("Razorpay", "Razorpay checkout works on web. Order placed (pay later in browser).");
          clear();
          router.replace(`/track/${order.id}`);
          return;
        }
        try {
          const rp = await (await import("../src/api")).adminApi.rpCreate(order.id);
          await openRazorpay(rp, order.id);
        } catch (e: any) {
          Alert.alert("Razorpay error", e?.response?.data?.detail || "Admin must configure Razorpay keys in Shop Settings.");
          // fall back to COD-style success (order is placed; payment pending)
        }
      }
      clear();
      router.replace(`/track/${order.id}`);
    } catch (e: any) {
      Alert.alert("Order failed", e?.response?.data?.detail || "Try again");
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = async (rp: any, orderId: string) =>
    new Promise<void>((resolve, reject) => {
      // Inject Razorpay script
      const w: any = window as any;
      const open = () => {
        const options = {
          key: rp.key_id,
          amount: rp.rp_order.amount,
          currency: rp.rp_order.currency,
          name: "GrociGO",
          description: `Order ${rp.order.id.slice(0, 8)}`,
          order_id: rp.rp_order.id,
          prefill: { name: rp.order.name },
          theme: { color: "#0D9488" },
          handler: async (resp: any) => {
            try {
              await (await import("../src/api")).adminApi.rpVerify({
                order_id: orderId,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              });
              resolve();
            } catch (err) { reject(err); }
          },
          modal: { ondismiss: () => resolve() },  // user closed → order stays unpaid
        };
        const r = new w.Razorpay(options);
        r.open();
      };
      if (w.Razorpay) return open();
      const sc = document.createElement("script");
      sc.src = "https://checkout.razorpay.com/v1/checkout.js";
      sc.onload = open;
      sc.onerror = () => reject(new Error("Razorpay script failed"));
      document.body.appendChild(sc);
    });

  return (
    <SafeAreaView style={s.c}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.head}>
          <TouchableOpacity testID="ch-back" onPress={() => router.back()}><ChevronLeft color={COLORS.text} size={24} /></TouchableOpacity>
          <Text style={s.title}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 140 }}>
          <View style={s.section}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: SP.sm }}>
              <MapPin color={COLORS.primary} size={18} />
              <Text style={s.secT}> Delivery address</Text>
            </View>
            <Field testID="ch-line1" label="Address line 1" v={line1} on={setLine1} />
            <Field testID="ch-line2" label="Landmark / line 2" v={line2} on={setLine2} />
            <View style={{ flexDirection: "row", gap: SP.sm }}>
              <View style={{ flex: 1 }}><Field testID="ch-city" label="City" v={city} on={setCity} /></View>
              <View style={{ flex: 1 }}><Field testID="ch-pin" label="Pincode" v={pincode} on={setPincode} k="number-pad" /></View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.secT}>Payment method</Text>
            {PAY_OPTS.map((p) => (
              <TouchableOpacity
                key={p.id}
                testID={`pay-${p.id}`}
                style={[s.pay, pay === p.id && s.payActive]}
                onPress={() => setPay(p.id)}
              >
                {p.id === "cod" ? <Banknote color={pay === p.id ? COLORS.primary : COLORS.muted} size={20} /> :
                 p.id === "card" ? <CreditCard color={pay === p.id ? COLORS.primary : COLORS.muted} size={20} /> :
                 <Smartphone color={pay === p.id ? COLORS.primary : COLORS.muted} size={20} />}
                <View style={{ flex: 1, marginLeft: SP.md }}>
                  <Text style={s.payL}>{p.label}</Text>
                  <Text style={s.payD}>{p.desc}</Text>
                </View>
                <View style={[s.radio, pay === p.id && s.radioOn]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.section}>
            <Text style={s.secT}>Delivery instructions</Text>
            <TextInput
              testID="ch-notes" value={notes} onChangeText={setNotes}
              placeholder="Leave at door, ring bell once..." placeholderTextColor={COLORS.muted}
              style={s.notes} multiline
            />
          </View>

          <View style={s.summary}>
            <Text style={s.secT}>Order summary</Text>
            <Row k={`Items (${items.length})`} v={`₹${subtotal.toFixed(0)}`} />
            <Row k="Delivery" v={delivery === 0 ? "FREE" : `₹${delivery}`} />
            <Row k="Tax" v={`₹${tax.toFixed(0)}`} />
            <View style={s.div} />
            <Row k="Total" v={`₹${total.toFixed(0)}`} bold />
          </View>
        </ScrollView>

        <View style={s.footer}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>Pay {pay === "cod" ? "later (COD)" : "via " + pay.toUpperCase()}</Text>
            <Text style={{ fontWeight: "900", fontSize: 22, color: COLORS.text }}>₹{total.toFixed(0)}</Text>
          </View>
          <TouchableOpacity testID="place-order" disabled={loading} style={[s.cta, loading && { opacity: 0.6 }]} onPress={place}>
            <Text style={s.ctaT}>{loading ? "Placing..." : "Place Order"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, v, on, testID, k }: any) {
  return (
    <>
      <Text style={s.lbl}>{label}</Text>
      <TextInput testID={testID} value={v} onChangeText={on} keyboardType={k} placeholderTextColor={COLORS.muted} style={s.in} />
    </>
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
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SP.lg, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  section: { backgroundColor: "#fff", padding: SP.lg, borderRadius: RAD.md, marginBottom: SP.md, borderWidth: 1, borderColor: COLORS.border },
  secT: { fontWeight: "900", color: COLORS.text, fontSize: 15 },
  lbl: { fontSize: 12, color: COLORS.muted, fontWeight: "700", marginTop: SP.sm, marginBottom: 4 },
  in: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: SP.md, paddingVertical: 10, color: COLORS.text },
  pay: { flexDirection: "row", alignItems: "center", padding: SP.md, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, marginTop: SP.sm },
  payActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  payL: { fontWeight: "800", color: COLORS.text },
  payD: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.border },
  radioOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  notes: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SP.md, color: COLORS.text, minHeight: 60, marginTop: SP.sm },
  summary: { backgroundColor: "#fff", padding: SP.lg, borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border },
  div: { height: 1, backgroundColor: COLORS.border, marginVertical: SP.sm },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SP.lg, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: SP.md },
  cta: { backgroundColor: COLORS.primary, paddingHorizontal: SP.xl, paddingVertical: 14, borderRadius: RAD.md },
  ctaT: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
