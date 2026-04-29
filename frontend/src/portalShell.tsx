import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import {
  LayoutDashboard, Boxes, ClipboardList, BarChart3, Users, Settings, LogOut, Menu, X,
} from "lucide-react-native";
import { COLORS, RAD, SP } from "./theme";
import { useAuth } from "./auth";

const ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "staff", label: "Staff", icon: Users, adminOnly: true },
  { id: "settings", label: "Shop Settings", icon: Settings, adminOnly: true },
];

export default function PortalShell({ active, children }: { active: string; children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const [drawer, setDrawer] = useState(false);

  const onLogout = async () => { await logout(); router.replace("/portal/login"); };
  const isAdmin = user?.role === "admin";
  const items = ITEMS.filter((i) => !i.adminOnly || isAdmin);

  const Sidebar = (
    <View style={[s.sidebar, !isDesktop && s.sidebarMobile]}>
      <View style={s.brandRow}>
        <Text style={s.brandEmoji}>🥬</Text>
        <View>
          <Text style={s.brand}>GrociGO</Text>
          <Text style={s.brandT}>Staff Portal</Text>
        </View>
        {!isDesktop && (
          <TouchableOpacity onPress={() => setDrawer(false)} style={{ marginLeft: "auto", padding: 4 }}>
            <X color="#fff" size={22} />
          </TouchableOpacity>
        )}
      </View>
      <View style={s.userBox}>
        <View style={s.avatar}><Text style={{ color: "#fff", fontWeight: "900" }}>{user?.name?.[0]}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.userN}>{user?.name}</Text>
          <Text style={s.userR}>{user?.role?.toUpperCase()} · {(user as any)?.staff_id}</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 12 }} />
      {items.map((it) => {
        const isActive = active === it.id;
        const Icon = it.icon;
        return (
          <Pressable
            key={it.id}
            testID={`nav-${it.id}`}
            style={[s.navItem, isActive && s.navActive]}
            onPress={() => { setDrawer(false); router.push(`/portal/${it.id}` as any); }}
          >
            <Icon color={isActive ? COLORS.primary : "#fff"} size={18} />
            <Text style={[s.navT, isActive && { color: COLORS.primary }]}>{it.label}</Text>
          </Pressable>
        );
      })}
      <View style={{ flex: 1 }} />
      <TouchableOpacity testID="logout" style={s.logout} onPress={onLogout}>
        <LogOut color="#fff" size={16} />
        <Text style={s.logoutT}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <View style={[s.shell, isDesktop && s.shellDesktop]}>
        {isDesktop ? Sidebar : (
          <View style={s.topbar}>
            <TouchableOpacity testID="open-drawer" onPress={() => setDrawer(true)}>
              <Menu color={COLORS.text} size={24} />
            </TouchableOpacity>
            <Text style={s.tbBrand}>🥬 GrociGO Portal</Text>
            <TouchableOpacity onPress={onLogout}><LogOut color={COLORS.text} size={20} /></TouchableOpacity>
          </View>
        )}
        {!isDesktop && drawer && (
          <View style={s.drawer}>
            <View style={s.backdrop} onTouchStart={() => setDrawer(false)} />
            {Sidebar}
          </View>
        )}
        <ScrollView style={[s.main, isDesktop && s.mainDesktop]} contentContainerStyle={{ padding: isDesktop ? 32 : 16, paddingBottom: 64 }}>
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  shell: { flex: 1 },
  shellDesktop: { flexDirection: "row" },
  sidebar: { width: 240, backgroundColor: COLORS.text, padding: 16, paddingTop: 24 },
  sidebarMobile: { position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 10, paddingTop: 32 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  brandEmoji: { fontSize: 32 },
  brand: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  brandT: { color: COLORS.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  userBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  userN: { color: "#fff", fontWeight: "800", fontSize: 13 },
  userR: { color: COLORS.accent, fontSize: 10, fontWeight: "700", marginTop: 2 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, marginVertical: 2 },
  navActive: { backgroundColor: "#fff" },
  navT: { color: "#fff", fontWeight: "700", fontSize: 14 },
  logout: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  logoutT: { color: "#fff", fontWeight: "700" },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tbBrand: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  drawer: { ...StyleSheet.absoluteFillObject, zIndex: 9 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  main: { flex: 1 },
  mainDesktop: { flex: 1, maxWidth: 1280 },
});
