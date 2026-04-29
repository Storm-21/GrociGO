import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, MapPin, CreditCard, Heart, Bell, ChevronRight, Phone, User as UserIcon } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { useAuth } from "../../src/auth";

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const onLogout = () => {
    Alert.alert("Sign out?", "You'll need to log in again.", [
      { text: "Cancel" },
      {
        text: "Sign out", style: "destructive",
        onPress: async () => { await logout(); router.replace("/(auth)/login"); },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{user?.name?.[0]?.toUpperCase() || "U"}</Text>
          </View>
          <Text style={s.name} testID="profile-name">{user?.name || "Guest"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
            <Phone color={COLORS.muted} size={14} />
            <Text style={s.phone}> {user?.phone}</Text>
          </View>
        </View>

        <View style={s.list}>
          <Item icon={<MapPin color={COLORS.primary} size={20} />} label="Saved addresses" sub="Add or edit delivery addresses" />
          <Item icon={<CreditCard color={COLORS.primary} size={20} />} label="Payment methods" sub="UPI, Cards, COD" />
          <Item icon={<Heart color={COLORS.primary} size={20} />} label="My preferences" sub="Diet, brand favorites" />
          <Item icon={<Bell color={COLORS.primary} size={20} />} label="Notifications" sub="Order updates & offers" />
        </View>

        <TouchableOpacity testID="logout-btn" style={s.logout} onPress={onLogout}>
          <LogOut color={COLORS.primary} size={18} />
          <Text style={s.logoutT}>Sign out</Text>
        </TouchableOpacity>

        <Text style={s.foot}>Daily Basket · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Item({ icon, label, sub }: any) {
  return (
    <TouchableOpacity style={s.item}>
      <View style={s.itemIc}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.itemL}>{label}</Text>
        <Text style={s.itemS}>{sub}</Text>
      </View>
      <ChevronRight color={COLORS.muted} size={18} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SP.xl, alignItems: "center", backgroundColor: "#fff" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontSize: 32, fontWeight: "900" },
  name: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginTop: SP.sm },
  phone: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  list: { backgroundColor: "#fff", marginTop: SP.md },
  item: { flexDirection: "row", alignItems: "center", padding: SP.lg, gap: SP.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemIc: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primaryMuted, alignItems: "center", justifyContent: "center" },
  itemL: { fontWeight: "800", color: COLORS.text },
  itemS: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SP.sm, margin: SP.lg, padding: SP.lg, borderRadius: RAD.md, borderWidth: 1.5, borderColor: COLORS.primary },
  logoutT: { color: COLORS.primary, fontWeight: "900" },
  foot: { textAlign: "center", color: COLORS.muted, fontSize: 12, marginTop: SP.md },
});
