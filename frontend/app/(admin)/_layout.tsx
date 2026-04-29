import React from "react";
import { Tabs } from "expo-router";
import { LayoutDashboard, Boxes, ClipboardList, BarChart3 } from "lucide-react-native";
import { COLORS } from "../../src/theme";

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.muted,
      tabBarStyle: { backgroundColor: "#fff", borderTopColor: COLORS.border, height: 64, paddingTop: 6, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
    }}>
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tabs.Screen name="inventory" options={{ title: "Inventory", tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Tabs.Screen name="reports" options={{ title: "Reports", tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />
    </Tabs>
  );
}
