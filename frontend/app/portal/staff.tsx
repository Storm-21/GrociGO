import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, ScrollView } from "react-native";
import { Plus, Trash2, X, Copy, ShieldCheck } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import PortalShell from "../../src/portalShell";
import { COLORS, RAD } from "../../src/theme";
import { adminApi } from "../../src/api";

export default function Staff() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try { setList(await adminApi.listStaff()); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = (s: any) => {
    if (s.role === "admin") return Alert.alert("Cannot delete admin");
    const fn = async () => { await adminApi.deleteStaff(s.id); load(); };
    if (Platform.OS === "web") { if (confirm(`Remove ${s.name}?`)) fn(); }
    else Alert.alert("Remove?", s.name, [{ text: "Cancel" }, { text: "Remove", style: "destructive", onPress: fn }]);
  };

  return (
    <PortalShell active="staff">
      <View style={s.head}>
        <View>
          <Text style={s.h}>Staff Management</Text>
          <Text style={s.sub}>Create login credentials for shop staff</Text>
        </View>
        <TouchableOpacity testID="add-staff" style={s.addBtn} onPress={() => setAdding(true)}>
          <Plus color="#fff" size={18} /><Text style={s.addT}>New staff</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={COLORS.primary} /> : (
        <View style={s.list}>
          {list.map((u) => (
            <View key={u.id} style={s.row} testID={`staff-${u.id}`}>
              <View style={[s.avatar, u.role === "admin" && { backgroundColor: COLORS.primary }]}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>{u.name?.[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.n}>{u.name} {u.role === "admin" && <Text style={s.adm}>· ADMIN</Text>}</Text>
                <Text style={s.id}>ID: <Text style={s.idB}>{u.staff_id}</Text> · Phone: {u.phone || "—"}</Text>
              </View>
              {u.role !== "admin" && (
                <TouchableOpacity style={s.delBtn} onPress={() => remove(u)} testID={`del-staff-${u.id}`}>
                  <Trash2 color={COLORS.danger} size={16} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {list.length === 0 && <Text style={s.empty}>No staff yet — click "New staff" to create one</Text>}
        </View>
      )}

      <View style={s.note}>
        <ShieldCheck color={COLORS.primary} size={18} />
        <Text style={s.noteT}>Staff can log in to this portal at <Text style={s.noteB}>/portal/login</Text> using their generated ID and password.</Text>
      </View>

      {adding && <CreateStaffModal onClose={(c) => { setAdding(false); if (c) { setCreated(c); load(); } }} />}
      {created && <CredentialsModal data={created} onClose={() => setCreated(null)} />}
    </PortalShell>
  );
}

function CreateStaffModal({ onClose }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name) return Alert.alert("Name required");
    setSaving(true);
    try {
      const r = await adminApi.createStaff({ name, phone });
      onClose(r);
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.detail || "Try again");
    } finally { setSaving(false); }
  };

  return (
    <Modal animationType="slide" transparent onRequestClose={() => onClose(null)}>
      <View style={m.bg}>
        <View style={m.card}>
          <View style={m.head}>
            <Text style={m.t}>Create staff account</Text>
            <TouchableOpacity onPress={() => onClose(null)}><X color={COLORS.text} size={22} /></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={m.sub}>An ID and password will be generated automatically.</Text>
            <Text style={m.lbl}>Full name *</Text>
            <TextInput testID="staff-name" value={name} onChangeText={setName} placeholder="e.g. Ramesh Kumar" placeholderTextColor={COLORS.muted} style={m.in} />
            <Text style={m.lbl}>Phone (optional)</Text>
            <TextInput testID="staff-phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="9999999999" placeholderTextColor={COLORS.muted} style={m.in} maxLength={10} />
            <TouchableOpacity testID="staff-save" disabled={saving} style={[m.cta, saving && { opacity: 0.6 }]} onPress={create}>
              <Text style={m.ctaT}>{saving ? "Creating..." : "Generate credentials"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CredentialsModal({ data, onClose }: any) {
  const copy = (txt: string) => {
    Clipboard.setStringAsync(txt);
    if (Platform.OS === "web") { try { (navigator as any).clipboard?.writeText(txt); } catch {} }
  };
  return (
    <Modal animationType="fade" transparent onRequestClose={onClose}>
      <View style={m.bg}>
        <View style={m.card}>
          <View style={m.head}>
            <Text style={m.t}>✓ Staff created</Text>
            <TouchableOpacity onPress={onClose}><X color={COLORS.text} size={22} /></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={m.sub}>Share these credentials with <Text style={{ fontWeight: "900" }}>{data.name}</Text>. Save it now — the password won't be shown again.</Text>
            <CredRow label="Staff ID" value={data.staff_id} onCopy={() => copy(data.staff_id)} />
            <CredRow label="Password" value={data.password} onCopy={() => copy(data.password)} />
            <TouchableOpacity style={[m.cta, { backgroundColor: COLORS.text, marginTop: 20 }]} onPress={onClose}>
              <Text style={m.ctaT}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CredRow({ label, value, onCopy }: any) {
  return (
    <View style={m.cred}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900", marginTop: 4, fontFamily: "Courier" }}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onCopy} style={m.copyBtn}>
        <Copy color={COLORS.primary} size={16} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  h: { fontSize: 32, fontWeight: "900", color: COLORS.text, letterSpacing: -1 },
  sub: { color: COLORS.muted, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  addT: { color: "#fff", fontWeight: "900" },
  list: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.muted, alignItems: "center", justifyContent: "center" },
  n: { fontWeight: "800", color: COLORS.text, fontSize: 15 },
  adm: { color: COLORS.primary, fontSize: 11, fontWeight: "900" },
  id: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  idB: { fontWeight: "900", color: COLORS.text, fontFamily: "Courier" },
  delBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", padding: 32, color: COLORS.muted },
  note: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 16, padding: 14, backgroundColor: COLORS.primaryMuted, borderRadius: 10 },
  noteT: { color: COLORS.text, flex: 1, fontSize: 13 },
  noteB: { fontWeight: "900", color: COLORS.primary, fontFamily: "Courier" },
});

const m = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", width: "92%", maxWidth: 480, borderRadius: 20 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  t: { fontWeight: "900", fontSize: 20, color: COLORS.text },
  sub: { color: COLORS.muted, marginBottom: 12 },
  lbl: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 12, marginBottom: 6 },
  in: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, color: COLORS.text },
  cta: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  ctaT: { color: "#fff", fontWeight: "900", fontSize: 15 },
  cred: { flexDirection: "row", alignItems: "center", padding: 14, marginTop: 10, backgroundColor: COLORS.bg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  copyBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
});
