import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, TextInput, ScrollView, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { Plus, Edit3, Eye, EyeOff, Trash2, X } from "lucide-react-native";
import PortalShell from "../../src/portalShell";
import { COLORS, RAD, SP } from "../../src/theme";
import { adminApi, shopApi } from "../../src/api";

export default function Inventory() {
  const [list, setList] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([shopApi.products({ include_inactive: true }), shopApi.categories(true)]);
      setList(p); setCats(c);
    } catch {}
    setLoading(false);
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const toggle = async (p: any) => { await adminApi.toggleActive(p.id, !p.active); load(); };
  const del = (p: any) => {
    if (Platform.OS === "web") {
      if (!confirm(`Delete ${p.name}?`)) return;
      adminApi.deleteProduct(p.id).then(load);
    } else {
      Alert.alert("Delete?", p.name, [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: async () => { await adminApi.deleteProduct(p.id); load(); } }]);
    }
  };

  return (
    <PortalShell active="inventory">
      <View style={s.head}>
        <View>
          <Text style={s.h}>Inventory</Text>
          <Text style={s.sub}>{list.length} products · {list.filter(p => !p.active).length} delisted</Text>
        </View>
        <TouchableOpacity testID="add-product" style={s.addBtn} onPress={() => setEditing({})}>
          <Plus color="#fff" size={18} /><Text style={s.addT}>New product</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} /> : (
        <View style={s.table}>
          <View style={[s.row, s.thead]}>
            <Text style={[s.cell, s.th, { flex: 0.6 }]}>Image</Text>
            <Text style={[s.cell, s.th, { flex: 2 }]}>Product</Text>
            <Text style={[s.cell, s.th]}>Stock</Text>
            <Text style={[s.cell, s.th]}>Price</Text>
            <Text style={[s.cell, s.th]}>Discount</Text>
            <Text style={[s.cell, s.th]}>Status</Text>
            <Text style={[s.cell, s.th, { flex: 1.5 }]}>Actions</Text>
          </View>
          {list.map((p, i) => {
            const cat = cats.find(c => c.id === p.category_id);
            return (
              <View key={p.id} style={[s.row, i % 2 === 1 && { backgroundColor: COLORS.bg }, !p.active && { opacity: 0.55 }]} testID={`inv-${p.id}`}>
                <View style={[s.cell, { flex: 0.6 }]}>
                  {p.image ? <Image source={{ uri: p.image }} style={s.img} /> : <Text>🛒</Text>}
                </View>
                <View style={[s.cell, { flex: 2 }]}>
                  <Text style={s.pName}>{p.name}</Text>
                  <Text style={s.pCat}>{cat?.name || "—"} · {p.unit}</Text>
                </View>
                <Text style={s.cell}>{p.stock}</Text>
                <Text style={[s.cell, s.bold]}>₹{p.price}</Text>
                <Text style={[s.cell, p.discount_pct > 0 && { color: COLORS.success, fontWeight: "900" }]}>{p.discount_pct > 0 ? `${p.discount_pct}%` : "—"}</Text>
                <View style={s.cell}>
                  <View style={[s.statusPill, p.active ? s.statusOn : s.statusOff]}>
                    <Text style={[s.statusT, p.active ? { color: COLORS.success } : { color: COLORS.muted }]}>
                      {p.active ? "ACTIVE" : "DELISTED"}
                    </Text>
                  </View>
                </View>
                <View style={[s.cell, { flex: 1.5, flexDirection: "row", gap: 6 }]}>
                  <TouchableOpacity testID={`edit-${p.id}`} style={s.iBtn} onPress={() => setEditing(p)}>
                    <Edit3 color={COLORS.primary} size={14} />
                  </TouchableOpacity>
                  <TouchableOpacity testID={`toggle-${p.id}`} style={s.iBtn} onPress={() => toggle(p)}>
                    {p.active ? <EyeOff color={COLORS.warning} size={14} /> : <Eye color={COLORS.success} size={14} />}
                  </TouchableOpacity>
                  <TouchableOpacity testID={`del-${p.id}`} style={s.iBtn} onPress={() => del(p)}>
                    <Trash2 color={COLORS.danger} size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {editing && (
        <ProductFormModal product={editing} cats={cats} onClose={() => { setEditing(null); load(); }} />
      )}
    </PortalShell>
  );
}

function ProductFormModal({ product, cats, onClose }: any) {
  const editing = !!product?.id;
  const [name, setName] = useState(product?.name || "");
  const [desc, setDesc] = useState(product?.description || "");
  const [price, setPrice] = useState(String(product?.price || ""));
  const [disc, setDisc] = useState(String(product?.discount_pct || "0"));
  const [unit, setUnit] = useState(product?.unit || "1 pc");
  const [stock, setStock] = useState(String(product?.stock || "100"));
  const [image, setImage] = useState(product?.image || "");
  const [catId, setCatId] = useState(product?.category_id || cats[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name || !price || !catId) return Alert.alert("Missing fields");
    setSaving(true);
    try {
      const payload = { name, description: desc, price: parseFloat(price), discount_pct: parseFloat(disc || "0"), category_id: catId, image, unit, stock: parseInt(stock || "0"), active: true };
      if (editing) await adminApi.updateProduct(product.id, payload);
      else await adminApi.createProduct(payload);
      onClose();
    } catch (e: any) {
      Alert.alert("Save failed", e?.response?.data?.detail || "Try again");
    } finally { setSaving(false); }
  };

  return (
    <Modal animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.bg}>
        <View style={m.card}>
          <View style={m.head}>
            <Text style={m.t}>{editing ? "Edit product" : "New product"}</Text>
            <TouchableOpacity onPress={onClose}><X color={COLORS.text} size={22} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Field label="Name" v={name} on={setName} testID="pf-name" />
            <Field label="Description" v={desc} on={setDesc} testID="pf-desc" multiline />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}><Field label="Price (₹)" v={price} on={setPrice} testID="pf-price" k="numeric" /></View>
              <View style={{ flex: 1 }}><Field label="Discount %" v={disc} on={setDisc} testID="pf-disc" k="numeric" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}><Field label="Unit" v={unit} on={setUnit} testID="pf-unit" /></View>
              <View style={{ flex: 1 }}><Field label="Stock" v={stock} on={setStock} testID="pf-stock" k="numeric" /></View>
            </View>
            <Field label="Image URL" v={image} on={setImage} testID="pf-image" />
            <Text style={m.lbl}>Category</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {cats.map((c: any) => (
                <TouchableOpacity key={c.id} testID={`pf-cat-${c.id}`} onPress={() => setCatId(c.id)} style={[m.chip, catId === c.id && m.chipA]}>
                  <Text style={[m.chipT, catId === c.id && { color: "#fff" }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity testID="pf-save" disabled={saving} style={[m.cta, saving && { opacity: 0.6 }]} onPress={save}>
              <Text style={m.ctaT}>{saving ? "Saving..." : (editing ? "Save changes" : "Create product")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, v, on, testID, k, multiline }: any) {
  return (
    <>
      <Text style={m.lbl}>{label}</Text>
      <TextInput testID={testID} value={v} onChangeText={on} keyboardType={k} multiline={multiline} placeholderTextColor={COLORS.muted} style={[m.in, multiline && { minHeight: 60 }]} />
    </>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  h: { fontSize: 32, fontWeight: "900", color: COLORS.text, letterSpacing: -1 },
  sub: { color: COLORS.muted, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  addT: { color: "#fff", fontWeight: "900" },
  table: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  row: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  thead: { backgroundColor: COLORS.text },
  cell: { flex: 1 },
  th: { color: "#fff", fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  img: { width: 36, height: 36, borderRadius: 8, resizeMode: "cover" },
  pName: { fontWeight: "800", color: COLORS.text, fontSize: 14 },
  pCat: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  bold: { fontWeight: "900", color: COLORS.text },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
  statusOn: { backgroundColor: COLORS.successMuted },
  statusOff: { backgroundColor: "#F1F5F9" },
  statusT: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  iBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
});

const m = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", width: "92%", maxWidth: 560, maxHeight: "90%", borderRadius: 20 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  t: { fontWeight: "900", fontSize: 20, color: COLORS.text },
  lbl: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 12, marginBottom: 6 },
  in: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#fff" },
  chipA: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipT: { fontWeight: "700", color: COLORS.text, fontSize: 12 },
  cta: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  ctaT: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
