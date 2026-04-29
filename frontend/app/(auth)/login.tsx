import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { COLORS, RAD, SP } from "../../src/theme";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!phone || !password) return Alert.alert("Missing fields", "Enter phone & password");
    setLoading(true);
    try {
      const u = await login(phone.trim(), password);
      router.replace(u.role === "customer" ? "/(customer)/home" : "/(admin)/dashboard");
    } catch (e: any) {
      Alert.alert("Login failed", e?.response?.data?.detail || "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🧺</Text>
          <Text style={styles.heroTitle}>Daily Basket</Text>
          <Text style={styles.heroSub}>Welcome back · Login to shop fresh</Text>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            testID="login-phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="9999999999"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            maxLength={10}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="login-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
          />

          <TouchableOpacity
            testID="login-submit"
            style={[styles.cta, loading && { opacity: 0.6 }]}
            onPress={onLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>{loading ? "Signing in..." : "Sign in"}</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="goto-register" onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.altLink}>
              New to Daily Basket? <Text style={{ color: COLORS.primary, fontWeight: "800" }}>Create account</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo accounts</Text>
            <Text style={styles.demoTxt}>Admin: 9999999999 / admin123</Text>
            <Text style={styles.demoTxt}>Or create a new customer account</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  hero: { paddingTop: 80, paddingHorizontal: SP.xl, paddingBottom: SP.xxl, alignItems: "flex-start" },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1, marginTop: SP.sm },
  heroSub: { fontSize: 15, color: "#fff", opacity: 0.9, marginTop: 4 },
  sheet: {
    flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: SP.xl, paddingTop: SP.xxl,
  },
  title: { fontSize: 26, fontWeight: "900", color: COLORS.text, marginBottom: SP.lg },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.muted, marginTop: SP.md, marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RAD.md, paddingHorizontal: SP.lg, paddingVertical: 14,
    fontSize: 16, color: COLORS.text,
  },
  cta: {
    backgroundColor: COLORS.primary, marginTop: SP.xl,
    borderRadius: RAD.md, paddingVertical: 16, alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  altLink: { textAlign: "center", marginTop: SP.lg, color: COLORS.muted, fontSize: 14 },
  demoBox: { marginTop: SP.xl, padding: SP.lg, backgroundColor: "#fff", borderRadius: RAD.md, borderWidth: 1, borderColor: COLORS.border },
  demoTitle: { fontWeight: "800", color: COLORS.text, marginBottom: 6 },
  demoTxt: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
});
