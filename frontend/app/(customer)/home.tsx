import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, FlatList,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, MapPin, Zap, Plus, Minus } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { shopApi } from "../../src/api";
import { useCart } from "../../src/cart";

const BANNERS = [
  { color: "#FF4C29", title: "10-MIN\nDELIVERY", sub: "Fresh in a flash", emoji: "🚀" },
  { color: "#30A46C", title: "FRESH\nFRUITS", sub: "Up to 30% off", emoji: "🥭" },
  { color: "#11181C", title: "BAKERY\nNEW!", sub: "Hot from oven", emoji: "🥐" },
];

export default function Home() {
  const router = useRouter();
  const { add, items } = useCart();
  const [cats, setCats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [c, p] = await Promise.all([shopApi.categories(), shopApi.products()]);
      setCats(c);
      setProducts(p);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = q
    ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    : products;

  const flashDeals = products.filter((p) => p.discount_pct > 0).slice(0, 8);
  const qtyOf = (id: string) => items.find((i) => i.product_id === id)?.quantity || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.c} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={styles.etaBadge}>
            <Zap color="#fff" size={14} fill="#fff" />
            <Text style={styles.etaTxt}>10 MIN</Text>
          </View>
          <Text style={styles.deliveryTo}>Delivery to</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <MapPin color={COLORS.text} size={16} />
          <Text style={styles.addr}> Home · Delhi 110001</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search color={COLORS.muted} size={18} />
        <TextInput
          testID="home-search"
          value={q}
          onChangeText={setQ}
          placeholder="Search 'milk', 'apple', 'chips'..."
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {!q && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerRow}>
            {BANNERS.map((b, i) => (
              <View key={i} style={[styles.banner, { backgroundColor: b.color }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>{b.title}</Text>
                  <Text style={styles.bannerSub}>{b.sub}</Text>
                </View>
                <Text style={styles.bannerEmoji}>{b.emoji}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {!q && (
          <>
            <Text style={styles.section}>Shop by category</Text>
            <View style={styles.catGrid}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  testID={`cat-${c.name}`}
                  style={[styles.catCard, { backgroundColor: c.color + "18" }]}
                  onPress={() => router.push({ pathname: "/(customer)/categories", params: { id: c.id, name: c.name } })}
                >
                  <View style={[styles.catDot, { backgroundColor: c.color }]} />
                  <Text style={styles.catName} numberOfLines={2}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {flashDeals.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.section}>⚡ Flash Deals</Text>
                  <View style={styles.flashTag}><Text style={styles.flashTagTxt}>HOT</Text></View>
                </View>
                <FlatList
                  data={flashDeals}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(i) => i.id}
                  contentContainerStyle={{ paddingHorizontal: SP.lg, gap: SP.md }}
                  renderItem={({ item }) => <ProductCard p={item} qty={qtyOf(item.id)} onAdd={() => add(item)} onPress={() => router.push(`/product/${item.id}`)} compact />}
                />
              </>
            )}
          </>
        )}

        <Text style={styles.section}>{q ? `Results for "${q}"` : "All products"}</Text>
        <View style={styles.grid}>
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} qty={qtyOf(p.id)} onAdd={() => add(p)} onPress={() => router.push(`/product/${p.id}`)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ProductCard({ p, qty, onAdd, onPress, compact }: any) {
  const final = p.price * (1 - (p.discount_pct || 0) / 100);
  return (
    <TouchableOpacity
      testID={`product-card-${p.id}`}
      style={[styles.pCard, compact && { width: 150 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.pImageBox}>
        {p.image ? <Image source={{ uri: p.image }} style={styles.pImage} /> : <Text style={{ fontSize: 36 }}>🛒</Text>}
        {p.discount_pct > 0 && (
          <View style={styles.discBadge}>
            <Text style={styles.discTxt}>{Math.round(p.discount_pct)}% OFF</Text>
          </View>
        )}
      </View>
      <Text style={styles.pName} numberOfLines={2}>{p.name}</Text>
      <Text style={styles.pUnit}>{p.unit}</Text>
      <View style={styles.priceRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pPrice}>₹{final.toFixed(0)}</Text>
          {p.discount_pct > 0 && <Text style={styles.pStrike}>₹{p.price.toFixed(0)}</Text>}
        </View>
        {qty > 0 ? (
          <View style={styles.qPill}>
            <Text style={styles.qPillTxt}>{qty} in cart</Text>
          </View>
        ) : (
          <TouchableOpacity testID={`add-${p.id}`} style={styles.addBtn} onPress={onAdd}>
            <Plus color={COLORS.primary} size={18} />
            <Text style={styles.addBtnTxt}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SP.lg, paddingTop: SP.sm, paddingBottom: SP.sm },
  etaBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  etaTxt: { color: "#fff", fontWeight: "900", fontSize: 11, letterSpacing: 0.5 },
  deliveryTo: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  addr: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  searchBox: {
    flexDirection: "row", alignItems: "center", marginHorizontal: SP.lg,
    backgroundColor: "#fff", borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SP.md, gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, color: COLORS.text, fontSize: 15 },
  bannerRow: { paddingHorizontal: SP.lg, gap: SP.md, paddingVertical: SP.lg },
  banner: { width: 280, height: 130, borderRadius: RAD.lg, padding: SP.lg, flexDirection: "row", alignItems: "center" },
  bannerTitle: { color: "#fff", fontSize: 22, fontWeight: "900", lineHeight: 24 },
  bannerSub: { color: "#fff", opacity: 0.9, fontWeight: "700", marginTop: 4 },
  bannerEmoji: { fontSize: 56 },
  section: { fontSize: 18, fontWeight: "900", color: COLORS.text, paddingHorizontal: SP.lg, marginTop: SP.md, marginBottom: SP.sm },
  sectionRow: { flexDirection: "row", alignItems: "center" },
  flashTag: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  flashTagTxt: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: SP.lg, gap: SP.sm },
  catCard: {
    width: "23.5%", aspectRatio: 0.95, borderRadius: RAD.md, padding: SP.sm,
    justifyContent: "space-between",
  },
  catDot: { width: 16, height: 16, borderRadius: 8 },
  catName: { fontSize: 11, fontWeight: "800", color: COLORS.text },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: SP.lg, gap: SP.md, marginTop: SP.sm },
  pCard: {
    width: "47.5%", backgroundColor: "#fff", borderRadius: RAD.md, padding: SP.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pImageBox: {
    width: "100%", aspectRatio: 1, backgroundColor: COLORS.bg, borderRadius: RAD.sm,
    alignItems: "center", justifyContent: "center", marginBottom: SP.sm, position: "relative",
  },
  pImage: { width: "85%", height: "85%", resizeMode: "contain", borderRadius: 8 },
  discBadge: { position: "absolute", top: 6, left: 6, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discTxt: { color: "#fff", fontWeight: "900", fontSize: 9 },
  pName: { fontSize: 13, fontWeight: "700", color: COLORS.text, minHeight: 32 },
  pUnit: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: SP.sm },
  pPrice: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  pStrike: { fontSize: 11, color: COLORS.muted, textDecorationLine: "line-through" },
  addBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 2 },
  addBtnTxt: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },
  qPill: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  qPillTxt: { color: "#fff", fontWeight: "800", fontSize: 11 },
});
