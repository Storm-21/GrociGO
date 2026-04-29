import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus, Edit3, Eye, EyeOff, Trash2 } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { adminApi, shopApi } from "../../src/api";

export default function Inventory() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setList(await shopApi.products({ include_inactive: true })); } catch {}
    setLoading(false);
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const toggle = async (p: any) => {
    await adminApi.toggleActive(p.id, !p.active);
    load();
  };
  const del = (p: any) => {
    Alert.alert("Delete?", p.name, [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await adminApi.deleteProduct(p.id); load(); } },
    ]);
  };

  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.h}>Inventory</Text>
        <TouchableOpacity testID="add-product" style={s.addBtn} onPress={() => router.push("/admin-product")}>
          <Plus color="#fff" size={18} />
          <Text style={s.addT}>Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 32 }}>
        {list.map((p) => (
          <View key={p.id} style={[s.row, !p.active && { opacity: 0.5 }]} testID={`inv-${p.id}`}>
            <View style={s.imgB}>
              {p.image ? <Image source={{ uri: p.image }} style={s.img} /> : <Text>🛒</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.n} numberOfLines={1}>{p.name}</Text>
              <Text style={s.u}>{p.unit} · Stock: {p.stock}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Text style={s.pr}>₹{p.price}</Text>
                {p.discount_pct > 0 && <View style={s.disc}><Text style={s.discT}>{p.discount_pct}% OFF</Text></View>}
                {!p.active && <Text style={s.delisted}>· DELISTED</Text>}
              </View>
            </View>
            <TouchableOpacity testID={`edit-${p.id}`} style={s.iconB} onPress={() => router.push({ pathname: "/admin-product", params: { id: p.id } })}>
              <Edit3 color={COLORS.text} size={16} />
            </TouchableOpacity>
            <TouchableOpacity testID={`toggle-${p.id}`} style={s.iconB} onPress={() => toggle(p)}>
              {p.active ? <Eye color={COLORS.success} size={16} /> : <EyeOff color={COLORS.muted} size={16} />}
            </TouchableOpacity>
            <TouchableOpacity testID={`del-${p.id}`} style={s.iconB} onPress={() => del(p)}>
              <Trash2 color={COLORS.primary} size={16} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SP.lg, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  h: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addT: { color: "#fff", fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: SP.sm, backgroundColor: "#fff", padding: SP.md, borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SP.sm },
  imgB: { width: 50, height: 50, borderRadius: 8, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  img: { width: 44, height: 44, resizeMode: "contain", borderRadius: 6 },
  n: { fontWeight: "800", color: COLORS.text },
  u: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  pr: { fontWeight: "900", color: COLORS.text },
  disc: { backgroundColor: COLORS.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discT: { color: "#fff", fontWeight: "900", fontSize: 9 },
  delisted: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  iconB: { padding: 8 },
});
