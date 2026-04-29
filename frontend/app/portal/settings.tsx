import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Save, Palette } from "lucide-react-native";
import PortalShell from "../../src/portalShell";
import { COLORS, RAD } from "../../src/theme";
import { adminApi, shopApi } from "../../src/api";

const COLOR_PRESETS = [
  { name: "Teal (Default)", primary: "#0D9488", accent: "#5EEAD4" },
  { name: "Emerald", primary: "#059669", accent: "#6EE7B7" },
  { name: "Cyan", primary: "#0891B2", accent: "#67E8F9" },
  { name: "Forest", primary: "#15803D", accent: "#86EFAC" },
  { name: "Indigo", primary: "#4F46E5", accent: "#A5B4FC" },
  { name: "Coral", primary: "#FF4C29", accent: "#FFCDB2" },
];

export default function Settings() {
  const [d, setD] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { shopApi.shopSettings().then(setD); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await adminApi.updateShop(d);
      setD(r);
      if (typeof window !== "undefined") {
        Alert.alert("Saved", "Settings updated. Customer app picks up changes on next refresh.");
      }
    } catch (e: any) {
      Alert.alert("Save failed", e?.response?.data?.detail || "Try again");
    } finally { setSaving(false); }
  };

  if (!d) return <PortalShell active="settings"><ActivityIndicator color={COLORS.primary} /></PortalShell>;

  const upd = (k: string, v: any) => setD({ ...d, [k]: v });

  return (
    <PortalShell active="settings">
      <Text style={s.h}>Shop Settings</Text>
      <Text style={s.sub}>Configure store info, branding, and contact details</Text>

      <View style={s.section}>
        <Text style={s.secT}>Store information</Text>
        <Field label="Store name" v={d.name} on={(v: string) => upd("name", v)} testID="set-name" />
        <Field label="Tagline" v={d.tagline} on={(v: string) => upd("tagline", v)} testID="set-tagline" />
        <Field label="Address" v={d.address} on={(v: string) => upd("address", v)} testID="set-address" multi />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Owner name" v={d.owner_name} on={(v: string) => upd("owner_name", v)} testID="set-owner" /></View>
          <View style={{ flex: 1 }}><Field label="GST Number" v={d.gst} on={(v: string) => upd("gst", v)} testID="set-gst" /></View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Contact phone" v={d.phone} on={(v: string) => upd("phone", v)} testID="set-phone" /></View>
          <View style={{ flex: 1 }}><Field label="Email" v={d.email} on={(v: string) => upd("email", v)} testID="set-email" /></View>
        </View>
      </View>

      <View style={s.section}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Palette color={COLORS.primary} size={18} />
          <Text style={s.secT}>App theme</Text>
        </View>
        <Text style={s.secS}>Pick a color scheme. Customer app picks this up on next refresh.</Text>
        <View style={s.presetRow}>
          {COLOR_PRESETS.map((p) => (
            <TouchableOpacity key={p.name} testID={`preset-${p.name}`} onPress={() => { upd("primary_color", p.primary); upd("accent_color", p.accent); }}
              style={[s.preset, d.primary_color === p.primary && s.presetA]}>
              <View style={[s.swatch, { backgroundColor: p.primary }]} />
              <View style={[s.swatch, { backgroundColor: p.accent, marginLeft: -10, borderColor: "#fff", borderWidth: 2 }]} />
              <Text style={s.presetT}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <View style={{ flex: 1 }}><Field label="Primary color (hex)" v={d.primary_color} on={(v: string) => upd("primary_color", v)} testID="set-pcolor" /></View>
          <View style={{ flex: 1 }}><Field label="Accent color (hex)" v={d.accent_color} on={(v: string) => upd("accent_color", v)} testID="set-acolor" /></View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.secT}>Admin access (Google login allowlist)</Text>
        <Text style={s.secS}>Comma-separated Gmail addresses. These users get admin role when they log in with Google.</Text>
        <TextInput
          testID="set-admins"
          value={(d.admin_emails || []).join(", ")}
          onChangeText={(v: string) => upd("admin_emails", v.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="owner@gmail.com, manager@gmail.com"
          placeholderTextColor={COLORS.muted}
          style={s.in}
          autoCapitalize="none"
        />
      </View>

      <View style={s.section}>
        <Text style={s.secT}>Razorpay payment gateway</Text>
        <Text style={s.secS}>Get test/live keys from https://dashboard.razorpay.com/app/keys. Customers see Razorpay checkout once both are filled.</Text>
        <Field label="Key ID" v={d.razorpay_key_id} on={(v: string) => upd("razorpay_key_id", v)} testID="set-rp-key" />
        <Field label="Key Secret" v={d.razorpay_key_secret} on={(v: string) => upd("razorpay_key_secret", v)} testID="set-rp-secret" />
      </View>

      <View style={s.section}>
        <Text style={s.secT}>Logo & cover (base64 image data)</Text>
        <Text style={s.secS}>Paste a base64-encoded image (data:image/png;base64,...) to replace the customer app's logo or cover banner.</Text>
        <Field label="Logo base64" v={d.logo_base64} on={(v: string) => upd("logo_base64", v)} testID="set-logo" multi />
        <Field label="Cover banner base64" v={d.cover_base64} on={(v: string) => upd("cover_base64", v)} testID="set-cover" multi />
      </View>

      <TouchableOpacity testID="save-settings" disabled={saving} style={[s.cta, saving && { opacity: 0.6 }]} onPress={save}>
        <Save color="#fff" size={16} /><Text style={s.ctaT}>{saving ? "Saving..." : "Save all changes"}</Text>
      </TouchableOpacity>
    </PortalShell>
  );
}

function Field({ label, v, on, testID, multi }: any) {
  return (
    <>
      <Text style={s.lbl}>{label}</Text>
      <TextInput testID={testID} value={v || ""} onChangeText={on} placeholderTextColor={COLORS.muted}
        style={[s.in, multi && { minHeight: 60 }]} multiline={multi} />
    </>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 32, fontWeight: "900", color: COLORS.text, letterSpacing: -1 },
  sub: { color: COLORS.muted, marginTop: 4, marginBottom: 24 },
  section: { backgroundColor: "#fff", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  secT: { fontWeight: "900", fontSize: 16, color: COLORS.text },
  secS: { color: COLORS.muted, marginTop: 4, fontSize: 13 },
  lbl: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 12, marginBottom: 6 },
  in: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  preset: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: "#fff", gap: 4 },
  presetA: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  presetT: { fontWeight: "700", color: COLORS.text, fontSize: 12, marginLeft: 8 },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, marginTop: 8 },
  ctaT: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
