import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS, RAD, SP } from "../../src/theme";
import { shopApi } from "../../src/api";
import { useCart } from "../../src/cart";
import { ProductCard } from "./home";

export default function Categories() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { add, items } = useCart();
  const [cats, setCats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const c = await shopApi.categories();
      setCats(c);
      if (!active && c.length) setActive(c[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!active) return;
    shopApi.products({ category_id: active }).then(setProducts);
  }, [active]);

  const qtyOf = (pid: string) => items.find((i) => i.product_id === pid)?.quantity || 0;

  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <Text style={s.h}>Categories</Text>
      <View style={s.row}>
        <ScrollView style={s.side} contentContainerStyle={{ paddingVertical: 8 }}>
          {cats.map((c) => (
            <TouchableOpacity
              key={c.id}
              testID={`side-cat-${c.name}`}
              style={[s.sideItem, active === c.id && s.sideActive]}
              onPress={() => setActive(c.id)}
            >
              <View style={[s.sideDot, { backgroundColor: c.color }]} />
              <Text style={[s.sideTxt, active === c.id && { color: COLORS.primary }]} numberOfLines={2}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SP.md, paddingBottom: 32 }}>
          <View style={s.grid}>
            {products.map((p) => (
              <ProductCard key={p.id} p={p} qty={qtyOf(p.id)} onAdd={() => add(p)} onPress={() => router.push(`/product/${p.id}`)} />
            ))}
          </View>
          {products.length === 0 && <Text style={s.empty}>No products in this category</Text>}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  h: { fontSize: 24, fontWeight: "900", color: COLORS.text, paddingHorizontal: SP.lg, paddingVertical: SP.md },
  row: { flex: 1, flexDirection: "row" },
  side: { width: 100, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: COLORS.border },
  sideItem: { padding: SP.md, alignItems: "center", borderLeftWidth: 3, borderLeftColor: "transparent" },
  sideActive: { backgroundColor: COLORS.bg, borderLeftColor: COLORS.primary },
  sideDot: { width: 24, height: 24, borderRadius: 12, marginBottom: 6 },
  sideTxt: { fontSize: 11, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SP.sm },
  empty: { textAlign: "center", color: COLORS.muted, padding: SP.xl },
});
