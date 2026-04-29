import React from "react";
import { Tabs } from "expo-router";
import { Home, Grid3x3, ShoppingCart, Package, User } from "lucide-react-native";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../src/theme";
import { useCart } from "../../src/cart";

function CartIcon({ color, size }: { color: string; size: number }) {
  const { count } = useCart();
  return (
    <View>
      <ShoppingCart color={color} size={size} />
      {count > 0 && (
        <View style={styles.badge} testID="cart-badge">
          <Text style={styles.badgeTxt}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: COLORS.border, height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="categories" options={{ title: "Categories", tabBarIcon: ({ color, size }) => <Grid3x3 color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarIcon: ({ color, size }) => <CartIcon color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute", top: -6, right: -10, backgroundColor: COLORS.primary,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    alignItems: "center", justifyContent: "center",
  },
  badgeTxt: { color: "#fff", fontWeight: "800", fontSize: 11 },
});
