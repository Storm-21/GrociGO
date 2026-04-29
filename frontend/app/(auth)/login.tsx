import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../../src/api";
import { useAuth } from "../../src/auth";
import { COLORS, RAD, SP } from "../../src/theme";

export default function CustomerLogin() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length < 10) return Alert.alert("Phone", "Enter a valid 10-digit number");
    setLoading(true);
    try {
      const r = await authApi.requestOtp(phone.trim());
      setDevOtp(r.dev_otp || "");
      setStep("otp");
    } catch (e: any) {
      Alert.alert("OTP failed", e?.response?.data?.detail || "Try again");
    } finally { setLoading(false); }
  };

  const verify = async () => {
    if (otp.length < 4) return Alert.alert("OTP", "Enter the 6-digit code");
    setLoading(true);
    try {
      const r = await authApi.verifyOtp(phone.trim(), otp.trim());
      if (r.new_user) {
        setStep("name");
      } else {
        await AsyncStorage.setItem("token", r.access_token);
        setUser(r.user);
        router.replace("/(customer)/home");
      }
    } catch (e: any) {
      Alert.alert("Verify failed", e?.response?.data?.detail || "Try again");
    } finally { setLoading(false); }
  };

  const completeSignup = async () => {
    if (!name.trim()) return Alert.alert("Name", "Enter your name");
    setLoading(true);
    try {
      const r = await authApi.verifyOtp(phone.trim(), otp.trim(), name.trim());
      await AsyncStorage.setItem("token", r.access_token);
      setUser(r.user);
      router.replace("/(customer)/home");
    } catch (e: any) {
      Alert.alert("Signup failed", e?.response?.data?.detail || "Try again");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.c}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🥬</Text>
          <Text style={styles.heroTitle}>GrociGO</Text>
          <Text style={styles.heroSub}>Fresh in 10 mins · Login to start shopping</Text>
        </View>

        <View style={styles.sheet}>
          {step === "phone" && (
            <>
              <Text style={styles.title}>Enter your phone</Text>
              <Text style={styles.label}>Mobile number</Text>
              <View style={styles.phoneBox}>
                <Text style={styles.cc}>+91</Text>
                <TextInput
                  testID="login-phone"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="9999999999"
                  placeholderTextColor={COLORS.muted}
                  style={styles.phoneInput}
                  maxLength={10}
                />
              </View>
              <TouchableOpacity testID="send-otp" style={[styles.cta, loading && { opacity: 0.6 }]}
                onPress={sendOtp} disabled={loading} activeOpacity={0.9}>
                <Text style={styles.ctaText}>{loading ? "Sending..." : "Send OTP"}</Text>
              </TouchableOpacity>
              <Text style={styles.note}>Staff member? You'll need an admin-issued ID via the staff portal.</Text>
            </>
          )}

          {step === "otp" && (
            <>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subT}>Sent to +91 {phone}</Text>
              <Text style={styles.label}>6-digit code</Text>
              <TextInput
                testID="login-otp"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="• • • • • •"
                placeholderTextColor={COLORS.muted}
                style={styles.otpInput}
                maxLength={6}
              />
              {!!devOtp && (
                <View style={styles.devBox}>
                  <Text style={styles.devT}>Dev mode OTP</Text>
                  <Text style={styles.devC}>{devOtp}</Text>
                </View>
              )}
              <TouchableOpacity testID="verify-otp" style={[styles.cta, loading && { opacity: 0.6 }]}
                onPress={verify} disabled={loading} activeOpacity={0.9}>
                <Text style={styles.ctaText}>{loading ? "Verifying..." : "Verify & Continue"}</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="change-phone" onPress={() => setStep("phone")}>
                <Text style={styles.altLink}>Change phone number</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "name" && (
            <>
              <Text style={styles.title}>Welcome to GrociGO!</Text>
              <Text style={styles.subT}>One last step — what should we call you?</Text>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                testID="signup-name" value={name} onChangeText={setName}
                placeholder="John Doe" placeholderTextColor={COLORS.muted} style={styles.input}
              />
              <TouchableOpacity testID="complete-signup" style={[styles.cta, loading && { opacity: 0.6 }]}
                onPress={completeSignup} disabled={loading} activeOpacity={0.9}>
                <Text style={styles.ctaText}>{loading ? "Creating..." : "Start shopping →"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.primary },
  hero: { paddingTop: 80, paddingHorizontal: SP.xl, paddingBottom: SP.xxl },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1, marginTop: SP.sm },
  heroSub: { fontSize: 14, color: "#fff", opacity: 0.9, marginTop: 4 },
  sheet: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SP.xl, paddingTop: SP.xxl },
  title: { fontSize: 26, fontWeight: "900", color: COLORS.text, marginBottom: SP.sm },
  subT: { color: COLORS.muted, marginBottom: SP.lg },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.muted, marginTop: SP.md, marginBottom: 6 },
  phoneBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RAD.md, paddingHorizontal: SP.lg,
  },
  cc: { fontWeight: "900", color: COLORS.text, fontSize: 16, marginRight: SP.sm },
  phoneInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: RAD.md,
    paddingHorizontal: SP.lg, paddingVertical: 14, fontSize: 16, color: COLORS.text,
  },
  otpInput: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: RAD.md,
    paddingHorizontal: SP.lg, paddingVertical: 18, fontSize: 28, color: COLORS.text,
    textAlign: "center", letterSpacing: 8, fontWeight: "900",
  },
  cta: { backgroundColor: COLORS.primary, marginTop: SP.xl, borderRadius: RAD.md, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  altLink: { textAlign: "center", marginTop: SP.lg, color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  note: { textAlign: "center", marginTop: SP.xl, color: COLORS.muted, fontSize: 12 },
  devBox: {
    marginTop: SP.md, padding: SP.md, backgroundColor: COLORS.successMuted,
    borderRadius: RAD.sm, borderWidth: 1, borderColor: COLORS.success, alignItems: "center",
  },
  devT: { fontSize: 11, color: COLORS.success, fontWeight: "700" },
  devC: { fontSize: 22, fontWeight: "900", color: COLORS.success, letterSpacing: 6, marginTop: 2 },
});
