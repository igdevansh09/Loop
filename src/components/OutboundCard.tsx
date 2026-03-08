import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
      private_community_url?: string;
    };
  };
  onAction: (id: string, status: "withdrawn") => Promise<void>;
}

export const OutboundCard = ({ item, onAction }: OutboundCardProps) => {
  const isAccepted = item.status === "accepted";
  const isRejected = item.status === "rejected";

  const statusColor = isAccepted
    ? "#22c55e"
    : isRejected
      ? "#ef4444"
      : COLORS.primary;

  const openFounderGitHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://github.com/${item.teams.founder_github}`);
  };

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
    <View style={[styles.hudBox, { opacity: isRejected ? 0.6 : 1 }]}>
      <CornerBrackets />

      <View style={styles.cardLayout}>
        {/* LEFT: Core Intel */}
        <View style={styles.intelBlock}>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.kicker, { color: statusColor }]}>
              OUTBOUND // {item.status.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.projectName} numberOfLines={1}>
            {(item.teams?.project_name || "UNKNOWN_TARGET").toUpperCase()}
          </Text>

          <TouchableOpacity
            style={styles.identityRow}
            onPress={openFounderGitHub}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-github" size={14} color={COLORS.grey} />
            <Text style={styles.handleText}>@{item.teams.founder_github}</Text>
          </TouchableOpacity>
        </View>

        {/* RIGHT: Dynamic Action Pill */}
        <View style={styles.actionBlock}>
          {isAccepted ? (
            <TouchableOpacity
              style={[styles.actionPill, styles.acceptedPill]}
              onPress={joinMission}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubbles"
                size={14}
                color={COLORS.background}
              />
              <Text style={styles.acceptedText}>UPLINK</Text>
            </TouchableOpacity>
          ) : item.status === "pending" ? (
            <TouchableOpacity
              style={[styles.actionPill, styles.pendingPill]}
              onPress={handleWithdraw}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={14} color={COLORS.grey} />
              <Text style={styles.pendingText}>DROP</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionPill, styles.rejectedPill]}>
              <Ionicons name="skull" size={14} color="#ef4444" />
              <Text style={styles.rejectedText}>DENIED</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 14,
    marginBottom: 12,
    position: "relative",
  },

  corner: { position: "absolute", width: 8, height: 8, borderWidth: 0 },
  topLeft: { top: -1, left: -1, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  topRight: { top: -1, right: -1, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },

  cardLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
  },
  intelBlock: {
    flex: 1,
    justifyContent: "center",
  },
  actionBlock: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Typography & Identifiers
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  kicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  projectName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  handleText: {
    color: COLORS.grey,
    fontSize: 12,
    fontWeight: "700",
  },

  // Dynamic Action Pills
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },

  acceptedPill: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  acceptedText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  pendingPill: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  pendingText: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  rejectedPill: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  rejectedText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
