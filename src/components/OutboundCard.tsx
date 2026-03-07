import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import * as Haptics from "expo-haptics";

const CornerBrackets = ({ color = COLORS.primary }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
  </View>
);

interface OutboundCardProps {
  item: {
    id: string;
    status: "pending" | "accepted" | "rejected";
    teams: {
      project_name: string;
      founder_github: string;
      required_college: string;
      private_community_url?: string; // 🚀 The decrypted reward
    };
  };
  onAction: (id: string, status: "withdrawn") => Promise<void>;
}

export const OutboundCard = ({ item, onAction }: OutboundCardProps) => {
  const statusColor =
    item.status === "accepted"
      ? "#22c55e"
      : item.status === "rejected"
        ? "#ef4444"
        : COLORS.primary;

  const openFounderGitHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://github.com/${item.teams.founder_github}`);
  };

  // 🚀 THE REWARD: Open the Private Comms Link
  const joinMission = () => {
    if (!item.teams.private_community_url) {
      Alert.alert("ENCRYPTION ERROR", "Comms link not found in data packet.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Linking.openURL(item.teams.private_community_url);
  };

  const handleWithdraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAction(item.id, "withdrawn");
  };

  return (
    <View
      style={[styles.hudBox, { opacity: item.status === "rejected" ? 0.7 : 1 }]}
    >
      <CornerBrackets />

      {/* 1. STATUS HEADER */}
      <View style={styles.sectionHeader}>
        <View style={styles.statusRow}>
          <Text style={[styles.kicker, { color: statusColor }]}>
            OUTBOUND_SIGNAL // {item.status.toUpperCase()}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <Text style={styles.projectName} numberOfLines={1}>
          {(item.teams?.project_name || "DELETED_BY_FOUNDER").toUpperCase()}
        </Text>
      </View>

      {/* 2. FOUNDER INTEL (GitHub) */}
      <View style={styles.identityContainer}>
        <Text style={styles.kicker}>FOUNDER_INTEL //</Text>
        <TouchableOpacity
          style={styles.githubSourceButton}
          onPress={openFounderGitHub}
        >
          <View style={styles.githubRow}>
            <Ionicons name="logo-github" size={20} color={COLORS.primary} />
            <Text style={styles.handleText}>@{item.teams.founder_github}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 3. DYNAMIC BOTTOM SECTION */}
      <View style={styles.bottomSection}>
        {item.status === "accepted" ? (
          /* 🚀 REVEALED: THE MISSION HUB */
          <View style={styles.acceptedBlock}>
            <Text style={[styles.kicker, { color: "#22c55e" }]}>
              COMMUNICATION_UPLINK // OPEN
            </Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={joinMission}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubbles"
                size={18}
                color={COLORS.background}
              />
              <Text style={styles.joinButtonText}>JOIN MISSION CONTROL</Text>
            </TouchableOpacity>
            <Text style={styles.successSubtext}>
              Secure link decrypted. Deploy immediately.
            </Text>
          </View>
        ) : item.status === "pending" ? (
          /* PENDING: WITHDRAW OPTION */
          <View>
            <Text style={styles.kicker}>TARGET_ORIGIN //</Text>
            <View style={styles.originBox}>
              <Ionicons name="location-outline" size={14} color={COLORS.grey} />
              <Text style={styles.originText}>
                {item.teams.required_college || "OPEN_DOMAIN"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={handleWithdraw}
            >
              <Text style={styles.withdrawText}>WITHDRAW SIGNAL</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* REJECTED: STATUS ONLY */
          <View style={styles.rejectedBox}>
            <Ionicons name="skull-outline" size={24} color="#ef4444" />
            <Text style={styles.rejectedText}>
              SIGNAL TERMINATED BY FOUNDER
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 16,
    marginBottom: 20,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 10,
    height: 10,
    borderColor: COLORS.primary,
  },
  topLeft: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },

  sectionHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  kicker: { fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  projectName: { color: COLORS.white, fontSize: 18, fontWeight: "900" },

  identityContainer: { marginBottom: 20 },
  githubSourceButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
  },
  githubRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  handleText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },

  bottomSection: { marginTop: 5 },
  originBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    marginBottom: 15,
  },
  originText: {
    color: COLORS.grey,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // Join Button (The Big Reveal)
  acceptedBlock: { marginTop: 5 },
  joinButton: {
    backgroundColor: "#22c55e",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 10,
    marginTop: 10,
  },
  joinButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  successSubtext: {
    color: "#22c55e",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },

  // Withdraw
  withdrawButton: {
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  withdrawText: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Rejected
  rejectedBox: {
    padding: 20,
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  rejectedText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
