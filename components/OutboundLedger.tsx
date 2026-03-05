import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Linking,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return COLORS.primary;
    case "rejected":
      return "#EF4444";
    default:
      return COLORS.secondary;
  }
};

function AnimatedOutboundCard({ item, index }: { item: any; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.nodeTitle}>
        {item.requirement?.title || "Unknown Node"}
      </Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Sync Status:</Text>
        <Text
          style={[styles.statusValue, { color: getStatusColor(item.status) }]}
        >
          {item.status.toUpperCase()}
        </Text>
      </View>

      {item.status === "accepted" && item.requirement?.commsLink && (
        <TouchableOpacity
          style={styles.commsButton}
          onPress={() => Linking.openURL(item.requirement.commsLink)}
          activeOpacity={0.8}
        >
          <Ionicons name="lock-open" size={16} color={COLORS.background} />
          <Text style={styles.commsButtonText}>Access Secure Community</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function OutboundLedger({ userId }: { userId: any }) {
  const applications = useQuery(api.applications.getMyApplications, {
    applicantId: userId,
  });

  if (applications === undefined)
    return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  // 1. THE SHIELD: Filter out any null elements or orphaned records
  const validApplications = applications.filter((app) => app !== null);

  // 2. Check the sanitized array, not the raw array
  if (validApplications.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="flash-off-outline"
          size={48}
          color={COLORS.surfaceLight}
        />
        <Text style={styles.emptyText}>No outbound syncs initiated.</Text>
      </View>
    );
  }

  return (
    <FlatList
      // 3. Pass only the strictly verified objects to the renderer
      data={validApplications}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item, index }) => (
        <AnimatedOutboundCard item={item} index={index} />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: COLORS.grey, marginTop: 16, fontWeight: "600" },
  listContainer: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 8,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  statusLabel: {
    color: COLORS.grey,
    fontSize: 13,
    marginRight: 8,
    fontWeight: "600",
  },
  statusValue: { fontWeight: "900", fontSize: 13, letterSpacing: 0.5 },
  commsButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  commsButtonText: {
    color: COLORS.background,
    fontWeight: "800",
    fontSize: 14,
  },
});
