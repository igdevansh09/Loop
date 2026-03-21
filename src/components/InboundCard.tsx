import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
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

interface InboundCardProps {
  item: {
    id: string;
    profiles: {
      github_handle: string;
      training_ground: string;
      ai_primary_stack: string;
    };
    teams: {
      project_name: string;
    };
  };
  onAction: (id: string, status: "accepted" | "rejected") => Promise<void>;
  onOpenModal?: (item: any) => void;
}

export const InboundCard = ({
  item,
  onAction,
  onOpenModal,
}: InboundCardProps) => {
  const handlePress = (status: "accepted" | "rejected") => {
    if (status === "accepted") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onAction(item.id, status);
  };

  return (
    <TouchableOpacity
      style={styles.hudBox}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onOpenModal) onOpenModal(item);
      }}
    >
      <CornerBrackets />

      <View style={styles.cardLayout}>
        {/* LEFT: Core Intel */}
        <View style={styles.intelBlock}>
          <Text style={styles.kicker} numberOfLines={1}>
            TARGET // {item.teams?.project_name?.toUpperCase() || "UNKNOWN"}
          </Text>

          <View style={styles.identityRow}>
            <Ionicons name="logo-github" size={16} color={COLORS.white} />
            <Text style={styles.handleText}>
              @{item.profiles.github_handle}
            </Text>
          </View>

          {/* 🚀 RESTORED: Expanding AI Summary / Primary Stack */}
          <Text style={styles.stackText}>
            {item.profiles.ai_primary_stack || "UNSET"}
          </Text>
        </View>

        {/* RIGHT: Quick Actions */}
        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            activeOpacity={0.6}
            onPress={() => handlePress("rejected")}
          >
            <Ionicons name="close" size={18} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            activeOpacity={0.6}
            onPress={() => handlePress("accepted")}
          >
            <Ionicons name="checkmark" size={18} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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

  corner: {
    position: "absolute",
    width: 8,
    height: 8,
    borderColor: COLORS.primary,
  },
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
    alignItems: "center", // Action buttons will stay centered even if text gets tall
    gap: 15,
  },
  intelBlock: {
    flex: 1, // Takes up remaining space so buttons don't get squished
    justifyContent: "center",
  },
  actionBlock: {
    flexDirection: "row",
    gap: 8,
  },

  kicker: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  handleText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  // 🚀 FIXED: Allowed wrapping and gave it line-height for readability
  stackText: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textTransform: "uppercase",
    flexWrap: "wrap",
    lineHeight: 16,
  },

  actionBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
  },
  rejectBtn: {
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  acceptBtn: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
});
