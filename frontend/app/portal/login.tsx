import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, useWindowDimensions, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lock, ShieldCheck } from "lucide-react-native";
import { useAuth } from "../../src/auth";
import { authApi } from "../../src/api";
import { COLORS, RAD, SP } from "../../src/theme";

export default function StaffLogin() {
  const router = useRouter();
  const { staffLogin, setUser } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const hash = (typeof window !== "undefined" ? window.location.hash : "") || "";
    if (!hash.includes("session_id=")) return;
    const sid = hash.split("session_id=")[1].split("&")[0];
    if (!sid) return;
    setProcessing(true);
    (async () => {
      try {
        const r = await authApi.googleCallback(sid);
        await AsyncStorage.setItem("token", r.access_token);
        setUser(r.user);
        if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname);
        if (r.user.role === "customer") {
          Alert.alert("Not authorized", "This Gmail is not in the admin allowlist. Ask the existing admin to add your email in Shop Settings.");
          router.replace("/(customer)/home");
        } else {
          router.replace("/portal/dashboard");
        }
      } catch (e) { setProcessing(false); }
    })();
  }, []);

  const onLogin = async () => {
    if (!staffId || !password) return Alert.alert("Missing", "Enter ID and password");
    setLoading(true);
    try {
      const u = await staffLogin(staffId.trim(), password);
      router.replace("/portal/dashboard");
    } catch (e: any) {
      Alert.alert("Login failed", e?.response?.data?.detail || "Try again");
    } finally { setLoading(false); }
  };

  const onGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (Platform.OS !== "web") {
      Alert.alert("Use browser", "Open this URL in a browser to use Google sign-in.");
      return;
    }
    const redirect = window.location.origin + "/portal/login";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };

  if (processing) {
    return (
      <View style={[s.c, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={{ color: COLORS.muted, marginTop: 12, fontWeight: "700" }}>Signing in…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.c}>
      <ScrollView contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}>
        {isDesktop && (
          <View style={s.left}>
            <Text style={s.brandLogo}>🥬</Text>
            <Text style={s.brand}>GrociGO</Text>
            <Text style={s.brandT}>Staff Portal</Text>
            <Text style={s.brandS}>Manage inventory, orders, billing, and reports — all in one place. Optimized for desktop, works on mobile too.</Text>
            <View style={s.featList}>
              <Feat n="📊" t="Live dashboard with daily revenue & order tracking" />
              <Feat n="📦" t="Inventory: catalog edits (staff), discounts (admin)" />
              <Feat n="🧾" t="Print-ready bill slips + Excel export" />
              <Feat n="👥" t="Admin creates staff accounts" />
              <Feat n="🎨" t="Customize app branding & contact details" />
            </View>
          </View>
        )}

        <View style={[s.right, isDesktop && s.rightDesktop]}>
          <View style={s.card}>
            <View style={s.iconBox}><ShieldCheck color={COLORS.primary} size={28} /></View>
            <Text style={s.title}>Staff sign in</Text>
            <Text style={s.sub}>Admins use Google · Staff use admin-issued ID + password</Text>

            <TouchableOpacity testID="admin-google" style={s.gBtn} onPress={onGoogle} activeOpacity={0.9}>
              <View style={s.gIcon}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#1F2937" }}>G</Text>
              </View>
              <Text style={s.gT}>Admin: Sign in with Google</Text>
            </TouchableOpacity>
            <Text style={s.gNote}>Your Gmail must be in the admin allowlist (Shop Settings).</Text>

            <View style={s.divider}><View style={s.line} /><Text style={s.dT}>OR STAFF</Text><View style={s.line} /></View>

            <Text style={s.label}>Staff ID</Text>
            <TextInput
              testID="staff-id" value={staffId} onChangeText={setStaffId}
              placeholder="ADMIN001 or STF123456" placeholderTextColor={COLORS.muted}
              style={s.input} autoCapitalize="characters"
            />

            <Text style={s.label}>Password</Text>
            <TextInput
              testID="staff-pw" value={password} onChangeText={setPassword} secureTextEntry
              placeholder="••••••••" placeholderTextColor={COLORS.muted} style={s.input}
            />

            <TouchableOpacity
              testID="staff-submit" style={[s.cta, loading && { opacity: 0.6 }]}
              onPress={onLogin} disabled={loading} activeOpacity={0.9}
            >
              <Lock color="#fff" size={16} />
              <Text style={s.ctaT}>{loading ? "Signing in..." : "Sign in"}</Text>
            </TouchableOpacity>

            <View style={s.demo}>
              <Text style={s.demoT}>Demo admin (fallback)</Text>
              <Text style={s.demoL}>ID: <Text style={s.demoB}>ADMIN001</Text> · PW: <Text style={s.demoB}>admin123</Text></Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Feat({ n, t }: any) {
  return (
    <View style={s.feat}>
      <Text style={s.featN}>{n}</Text>
      <Text style={s.featT}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: SP.lg, justifyContent: "center" },
  scrollDesktop: { flexDirection: "row", padding: 0 },
  left: { flex: 1, backgroundColor: COLORS.primary, padding: 64, justifyContent: "center" },
  brandLogo: { fontSize: 64 },
  brand: { fontSize: 56, fontWeight: "900", color: "#fff", letterSpacing: -2, marginTop: 12 },
  brandT: { fontSize: 22, fontWeight: "800", color: COLORS.accent, marginTop: 8 },
  brandS: { color: "#fff", opacity: 0.92, marginTop: SP.md, fontSize: 16, lineHeight: 24, maxWidth: 480 },
  featList: { marginTop: 32, gap: 12 },
  feat: { flexDirection: "row", alignItems: "center", gap: 12 },
  featN: { fontSize: 22 },
  featT: { color: "#fff", opacity: 0.92, fontWeight: "600" },
  right: { width: "100%", maxWidth: 460, alignSelf: "center" },
  rightDesktop: { width: 480, justifyContent: "center", padding: 64 },
  card: { backgroundColor: "#fff", padding: 32, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primaryMuted, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "900", color: COLORS.text, marginTop: 16 },
  sub: { color: COLORS.muted, marginTop: 4, fontSize: 13 },
  gBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 18, justifyContent: "center" },
  gIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  gT: { color: "#1F2937", fontWeight: "800", fontSize: 14 },
  gNote: { color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 6 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dT: { color: COLORS.muted, fontSize: 10, fontWeight: "900", marginHorizontal: 8, letterSpacing: 2 },
  label: { fontSize: 12, color: COLORS.muted, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RAD.md,
    paddingHorizontal: SP.lg, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, marginTop: 18, borderRadius: RAD.md, paddingVertical: 14,
  },
  ctaT: { color: "#fff", fontWeight: "900", fontSize: 16 },
  demo: { marginTop: 16, padding: 12, backgroundColor: COLORS.bg, borderRadius: RAD.md },
  demoT: { color: COLORS.muted, fontWeight: "800", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  demoL: { color: COLORS.text, marginTop: 4, fontSize: 13 },
  demoB: { fontWeight: "900", color: COLORS.primary, fontFamily: "Courier" },
});
