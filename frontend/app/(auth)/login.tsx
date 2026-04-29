import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/auth";
import { authApi } from "../../src/api";
import { COLORS, RAD, SP } from "../../src/theme";

export default function CustomerLogin() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Synchronously check for session_id in URL fragment (web only)
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
        // Clear hash and route based on role
        if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname);
        router.replace(r.user.role === "customer" ? "/(customer)/home" : "/portal/dashboard");
      } catch (e) {
        setProcessing(false);
      }
    })();
  }, []);

  const onGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (Platform.OS !== "web") return;
    const redirect = window.location.origin + "/(auth)/login";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <View style={s.c}>
      <View style={s.hero}>
        <Text style={s.emoji}>🥬</Text>
        <Text style={s.brand}>GrociGO</Text>
        <Text style={s.tag}>Fresh groceries · 10 min delivery</Text>
      </View>

      <View style={s.sheet}>
        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Sign in with your Google account to continue shopping</Text>

          {processing ? (
            <View style={{ alignItems: "center", marginTop: 24 }}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={s.proc}>Signing you in…</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity testID="google-login" style={s.gBtn} onPress={onGoogle} activeOpacity={0.9}>
                <View style={s.gIcon}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#1F2937" }}>G</Text>
                </View>
                <Text style={s.gT}>Continue with Google</Text>
              </TouchableOpacity>
              {Platform.OS !== "web" && (
                <Text style={s.warn}>📱 On mobile (Expo Go), open this app in your phone's browser to use Google sign-in.</Text>
              )}
            </>
          )}

          <View style={s.divider}><View style={s.line} /><Text style={s.dT}>OR</Text><View style={s.line} /></View>
          <TouchableOpacity testID="staff-link" style={s.staffLink} onPress={() => router.push("/portal/login")}>
            <Text style={s.staffT}>Staff or Admin? Sign in →</Text>
          </TouchableOpacity>

          <Text style={s.note}>By signing in, you agree to GrociGO's terms. Customer privacy first — we never share your info.</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.primary },
  hero: { paddingTop: 80, paddingHorizontal: SP.xl, paddingBottom: SP.xxl },
  emoji: { fontSize: 56 },
  brand: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1, marginTop: SP.sm },
  tag: { fontSize: 14, color: "#fff", opacity: 0.9, marginTop: 4 },
  sheet: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SP.xl, paddingTop: SP.xxl },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 28, borderWidth: 1, borderColor: COLORS.border, maxWidth: 460, width: "100%", alignSelf: "center" },
  title: { fontSize: 26, fontWeight: "900", color: COLORS.text },
  sub: { color: COLORS.muted, marginTop: 6, fontSize: 14, lineHeight: 20 },
  gBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, marginTop: 24, justifyContent: "center" },
  gIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  gT: { color: "#1F2937", fontWeight: "800", fontSize: 16 },
  warn: { fontSize: 12, color: COLORS.warning, fontWeight: "700", textAlign: "center", marginTop: 12 },
  proc: { color: COLORS.muted, marginTop: 12, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dT: { color: COLORS.muted, fontSize: 11, fontWeight: "800", marginHorizontal: 12, letterSpacing: 1 },
  staffLink: { alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  staffT: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  note: { color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 16 },
});
