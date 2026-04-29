import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { COLORS, RAD, SP } from "../src/theme";
import { adminApi, shopApi } from "../src/api";

export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const editing = !!id;

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [unit, setUnit] = useState("1 pc");
  const [stock, setStock] = useState("100");
  const [image, setImage] = useState("");
  const [cats, setCats] = useState<any[]>([]);
  const [catId, setCatId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    shopApi.categories().then((c) => { setCats(c); if (!editing && c[0]) setCatId(c[0].id); });
    if (editing) {
      shopApi.product(id!).then((p) => {
        setName(p.name); setDesc(p.description); setPrice(String(p.price));
        setDiscount(String(p.discount_pct)); setUnit(p.unit); setStock(String(p.stock));
        setImage(p.image); setCatId(p.category_id);
      });
    }
  }, [id]);

  const save = async () => {
    if (!name || !price || !catId) return Alert.alert("Missing fields");
    setLoading(true);
    try {
      const payload = {
        name, description: desc, price: parseFloat(price), discount_pct: parseFloat(discount || "0"),
        category_id: catId, image, unit, stock: parseInt(stock || "0"), active: true,
      };
      if (editing) await adminApi.updateProduct(id!, payload);
      else await adminApi.createProduct(payload);
      router.back();
    } catch (e: any) {
      Alert.alert("Save failed", e?.response?.data?.detail || "Try again");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.c}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.head}>
          <TouchableOpacity testID="pf-close" onPress={() => router.back()}><X color={COLORS.text} size={24} /></TouchableOpacity>
          <Text style={s.t}>{editing ? "Edit Product" : "New Product"}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 100 }}>
          <Field testID="pf-name" label="Name *" v={name} on={setName} />
          <Field testID="pf-desc" label="Description" v={desc} on={setDesc} multiline />
          <View style={{ flexDirection: "row", gap: SP.sm }}>
            <View style={{ flex: 1 }}><Field testID="pf-price" label="Price (₹) *" v={price} on={setPrice} k="numeric" /></View>
            <View style={{ flex: 1 }}><Field testID="pf-disc" label="Discount %" v={discount} on={setDiscount} k="numeric" /></View>
          </View>
          <View style={{ flexDirection: "row", gap: SP.sm }}>
            <View style={{ flex: 1 }}><Field testID="pf-unit" label="Unit" v={unit} on={setUnit} /></View>
            <View style={{ flex: 1 }}><Field testID="pf-stock" label="Stock" v={stock} on={setStock} k="numeric" /></View>
          </View>
          <Field testID="pf-image" label="Image URL" v={image} on={setImage} />

          <Text style={s.lbl}>Category *</Text>
          <View style={s.catRow}>
            {cats.map((c) => (
              <TouchableOpacity key={c.id} testID={`pf-cat-${c.name}`}
                style={[s.cat, catId === c.id && s.catA]} onPress={() => setCatId(c.id)}>
                <Text style={[s.catT, catId === c.id && { color: "#fff" }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={s.foot}>
          <TouchableOpacity testID="pf-save" disabled={loading} style={[s.cta, loading && { opacity: 0.6 }]} onPress={save}>
            <Text style={s.ctaT}>{loading ? "Saving..." : (editing ? "Update Product" : "Create Product")}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Field({ label, v, on, testID, k, multiline }: any) {
  return (
    <>
      <Text style={s.lbl}>{label}</Text>
      <TextInput testID={testID} value={v} onChangeText={on} keyboardType={k} multiline={multiline}
        placeholderTextColor={COLORS.muted} style={[s.in, multiline && { minHeight: 70 }]} />
    </>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SP.lg, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  t: { fontWeight: "900", fontSize: 18, color: COLORS.text },
  lbl: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: SP.sm, marginBottom: 4 },
  in: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: SP.md, paddingVertical: 10, color: COLORS.text },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: SP.sm, marginTop: 4 },
  cat: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: "#fff" },
  catA: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catT: { fontWeight: "700", color: COLORS.text, fontSize: 12 },
  foot: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SP.lg, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: COLORS.border },
  cta: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RAD.md, alignItems: "center" },
  ctaT: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
