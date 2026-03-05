import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/theme";
import OutboundLedger from "@/components/OutboundLedger";
import InboundLedger from "@/components/InboundLedger";
import { LinearGradient } from "expo-linear-gradient";

export default function LedgerScreen() {
  const { userId: clerkId } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {
    clerkId: clerkId ?? undefined,
  });

  const [activeTab, setActiveTab] = useState<"outbound" | "inbound">(
    "outbound",
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Crossfade animation when switching tabs
  const handleTabSwitch = (tab: "outbound" | "inbound") => {
    if (tab === activeTab) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setActiveTab(tab), 150); // Swap component while opacity is 0
  };

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(234, 179, 8, 0.1)", "transparent"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transaction Ledger</Text>
          <Text style={styles.headerSubtitle}>Monitor your network state</Text>
        </View>

        {/* Brutalist Segmented Control */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "outbound" && styles.activeTab]}
            onPress={() => handleTabSwitch("outbound")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "outbound" && styles.activeTabText,
              ]}
            >
              Outbound
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "inbound" && styles.activeTab]}
            onPress={() => handleTabSwitch("inbound")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "inbound" && styles.activeTabText,
              ]}
            >
              Inbound
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* The Animated View Port */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {activeTab === "outbound" ? (
          <OutboundLedger userId={currentUser._id} />
        ) : (
          <InboundLedger userId={currentUser._id} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  headerGradient: { paddingTop: 60, paddingBottom: 8 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
    fontWeight: "600",
  },

  tabContainer: { flexDirection: "row", paddingHorizontal: 20 },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: {
    color: COLORS.grey,
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  activeTabText: { color: COLORS.primary },
});
