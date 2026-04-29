import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring } from "react-native-reanimated";
import { ChevronLeft, Phone, Check, Bike, Receipt } from "lucide-react-native";
import { COLORS, RAD, SP } from "../../src/theme";
import { orderApi } from "../../src/api";

export default function TrackOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [t, setT] = useState<any>(null);
  const pulse = useSharedValue(0);
  const riderX = useSharedValue(0);
  const riderY = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
    let mounted = true;
    const tick = async () => {
      try {
        const data = await orderApi.tracking(id!);
        if (!mounted) return;
        setT(data);
        const w = 280; const h = 200;
        const sx = 0, sy = h - 30;
        const cx = w - 30, cy = 20;
        riderX.value = withSpring(sx + (cx - sx) * data.progress, { damping: 18 });
        riderY.value = withSpring(sy + (cy - sy) * data.progress, { damping: 18 });
      } catch {}
    };
    tick();
    const i = setInterval(tick, 4000);
    return () => { mounted = false; clearInterval(i); };
  }, [id]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value,
    transform: [{ scale: 1 + pulse.value * 2 }],
  }));
  const riderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: riderX.value }, { translateY: riderY.value }],
  }));

  if (!t) return <SafeAreaView style={s.center}><ActivityIndicator color={COLORS.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.c} edges={["top"]}>
      <View style={s.head}>
        <TouchableOpacity testID="tr-back" onPress={() => router.replace("/(customer)/orders")}><ChevronLeft color={COLORS.text} size={24} /></TouchableOpacity>
        <Text style={s.title}>Live Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.map}>
        <View style={s.mapLines} />
        {/* Store */}
        <View style={[s.pin, { left: 0, bottom: 30, backgroundColor: COLORS.text }]}>
          <Text style={s.pinT}>🏪</Text>
        </View>
        {/* Customer */}
        <View style={[s.pin, { right: 0, top: 20, backgroundColor: COLORS.success }]}>
          <Text style={s.pinT}>🏠</Text>
        </View>
        {/* Rider with pulse */}
        <Animated.View style={[s.rider, riderStyle]}>
          <Animated.View style={[s.pulse, pulseStyle]} />
          <View style={s.riderInner}>
            <Bike color="#fff" size={16} />
          </View>
        </Animated.View>
      </View>

      <View style={s.sheet}>
        <View style={s.eta}>
          <Text style={s.etaN}>{t.eta_min}</Text>
          <Text style={s.etaU}>min</Text>
          <View style={{ flex: 1, marginLeft: SP.md }}>
            <Text style={s.etaH}>{t.status === "delivered" ? "Delivered ✓" : "Arriving soon"}</Text>
            <Text style={s.etaS}>Order #{t.order_id?.slice(0, 8)}</Text>
          </View>
        </View>

        <View style={s.timeline}>
          {t.timeline.map((step: any, i: number) => (
            <View key={i} style={s.tlRow}>
              <View style={[s.tlDot, step.done && s.tlDotDone]}>
                {step.done && <Check color="#fff" size={12} />}
              </View>
              <Text style={[s.tlT, step.done && { color: COLORS.text, fontWeight: "800" }]}>{step.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.rider2}>
          <View style={s.rAvatar}><Text style={{ color: "#fff", fontWeight: "900" }}>{t.rider_info?.name?.[0] || "R"}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.rN}>{t.rider_info?.name || "Rider"}</Text>
            <Text style={s.rV}>{t.rider_info?.vehicle || "Bike"}</Text>
          </View>
          <TouchableOpacity testID="call-rider" style={s.callBtn} onPress={() => Linking.openURL(`tel:${t.rider_info?.phone || ""}`)}>
            <Phone color="#fff" size={16} />
          </TouchableOpacity>
          <TouchableOpacity testID="view-bill" style={s.billBtn2} onPress={() => router.push(`/bill/${id}`)}>
            <Receipt color={COLORS.text} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SP.lg, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontWeight: "900", fontSize: 18, color: COLORS.text },
  map: { flex: 1, backgroundColor: "#E8F5EE", margin: SP.lg, borderRadius: RAD.lg, overflow: "hidden", position: "relative" },
  mapLines: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#D5EADD" },
  pin: { position: "absolute", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff", margin: SP.lg },
  pinT: { fontSize: 18 },
  rider: { position: "absolute", top: SP.lg, left: SP.lg, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pulse: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary },
  riderInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  sheet: { backgroundColor: "#fff", padding: SP.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: COLORS.border },
  eta: { flexDirection: "row", alignItems: "baseline" },
  etaN: { fontSize: 48, fontWeight: "900", color: COLORS.primary },
  etaU: { fontSize: 16, color: COLORS.muted, fontWeight: "800", marginLeft: 4 },
  etaH: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  etaS: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  timeline: { marginTop: SP.lg, gap: SP.sm },
  tlRow: { flexDirection: "row", alignItems: "center", gap: SP.md },
  tlDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  tlDotDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  tlT: { color: COLORS.muted },
  rider2: { flexDirection: "row", alignItems: "center", gap: SP.md, marginTop: SP.lg, padding: SP.md, backgroundColor: COLORS.bg, borderRadius: RAD.md },
  rAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  rN: { fontWeight: "900", color: COLORS.text },
  rV: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  billBtn2: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
});
