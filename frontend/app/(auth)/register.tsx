import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { COLORS, RAD, SP } from "../../src/theme";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "staff">("customer");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!phone || !password || !name) return Alert.alert("Missing", "Fill all fields");
    setLoading(true);
    try {
      const u = await register(phone.trim(), password, name.trim(), role);
      router.replace(u.role === "customer" ? "/(customer)/home" : "/(admin)/dashboard");
    } catch (e: any) {
      Alert.alert("Register failed", e?.response?.data?.detail || "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.c}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🧺</Text>
          <Text style={styles.heroTitle}>Create account</Text>
          <Text style={styles.heroSub}>Save preferences & track orders</Text>
        </View>
        <View style={styles.sheet}>
          <Text style={styles.label}>Full name</Text>
          <TextInput testID="reg-name" value={name} onChangeText={setName} placeholder="Your name"
            placeholderTextColor={COLORS.muted} style={styles.input} />

          <Text style={styles.label}>Phone number</Text>
          <TextInput testID="reg-phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad"
            placeholder="9999999999" placeholderTextColor={COLORS.muted} style={styles.input} maxLength={10} />

          <Text style={styles.label}>Password</Text>
          <TextInput testID="reg-password" value={password} onChangeText={setPassword} secureTextEntry
            placeholder="At least 6 chars" placeholderTextColor={COLORS.muted} style={styles.input} />

          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleRow}>
            {(["customer", "staff"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                testID={`reg-role-${r}`}
                onPress={() => setRole(r)}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
              >
                <Text style={[styles.roleTxt, role === r && { color: "#fff" }]}>
                  {r === "customer" ? "🛒 Customer" : "👨‍💼 Staff"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity testID="reg-submit" style={[styles.cta, loading && { opacity: 0.6 }]}
            onPress={onRegister} disabled={loading} activeOpacity={0.9}>
            <Text style={styles.ctaText}>{loading ? "Creating..." : "Create account"}</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="goto-login" onPress={() => router.back()}>
            <Text style={styles.altLink}>
              Already have an account? <Text style={{ color: COLORS.primary, fontWeight: "800" }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.primary },
  hero: { paddingTop: 80, paddingHorizontal: SP.xl, paddingBottom: SP.xxl },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 32, fontWeight: "900", color: "#fff", marginTop: SP.sm },
  heroSub: { color: "#fff", opacity: 0.9, marginTop: 4 },
  sheet: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SP.xl },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.muted, marginTop: SP.md, marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: RAD.md,
    paddingHorizontal: SP.lg, paddingVertical: 14, fontSize: 16, color: COLORS.text,
  },
  roleRow: { flexDirection: "row", gap: SP.sm, marginTop: 4 },
  roleChip: {
    flex: 1, paddingVertical: 14, borderRadius: RAD.md, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: "#fff", alignItems: "center",
  },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleTxt: { fontWeight: "700", color: COLORS.text },
  cta: { backgroundColor: COLORS.primary, marginTop: SP.xl, borderRadius: RAD.md, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  altLink: { textAlign: "center", marginTop: SP.lg, color: COLORS.muted, fontSize: 14 },
});
