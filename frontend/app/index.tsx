import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/auth";
import { COLORS } from "../src/theme";

export default function Index() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.replace("/(auth)/login");
    } else if (user.role === "customer") {
      router.replace("/(customer)/home");
    } else {
      router.replace("/(admin)/dashboard");
    }
  }, [user]);

  return (
    <View style={styles.container} testID="splash-screen">
      <View style={styles.logoBox}>
        <Text style={styles.logoEmoji}>🧺</Text>
      </View>
      <Text style={styles.brand} testID="splash-brand">Daily Basket</Text>
      <Text style={styles.tag}>Fresh groceries · 10 min delivery</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  logoBox: {
    width: 96, height: 96, borderRadius: 28, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  logoEmoji: { fontSize: 56 },
  brand: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  tag: { fontSize: 14, color: "#fff", opacity: 0.85, marginTop: 6, fontWeight: "600" },
});
