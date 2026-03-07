import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Linking 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import * as Haptics from "expo-haptics";

// HUD Corner Brackets
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
      ai_primary_stack: string; // 🚀 The AI Summary
    };
    teams: {
      project_name: string;
    };
  };
  onAction: (id: string, status: 'accepted' | 'rejected') => Promise<void>;
}

export const InboundCard = ({ item, onAction }: InboundCardProps) => {
  
  const openGitHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://github.com/${item.profiles.github_handle}`);
  };

  const handlePress = (status: 'accepted' | 'rejected') => {
    if (status === 'accepted') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onAction(item.id, status);
  };

  return (
    <View style={styles.hudBox}>
      <CornerBrackets />
      
      {/* 1. Header Segment */}
      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>INBOUND_CLEARANCE //</Text>
        <Text style={styles.projectName} numberOfLines={1}>
          TARGET: {item.teams?.project_name?.toUpperCase() || "UNKNOWN"}
        </Text>
      </View>

      {/* 2. Tactical Identity Button & AI Stack Summary */}
      <View style={styles.identityContainer}>
        <Text style={styles.kicker}>IDENTITY_VERIFICATION //</Text>
        <TouchableOpacity 
          style={styles.githubSourceButton} 
          onPress={openGitHub}
          activeOpacity={0.8}
        >
          <View style={styles.githubRow}>
            <Ionicons name="logo-github" size={20} color={COLORS.primary} />
            <Text style={styles.handleText}>@{item.profiles.github_handle}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>VIEW SOURCE</Text>
          </View>
        </TouchableOpacity>
        
        {/* 🚀 THE AI SUMMARY RESTORED */}
        <Text style={styles.stackText}>
          PRIMARY_STACK: {item.profiles.ai_primary_stack || "UNSET"}
        </Text>
      </View>

      {/* 3. Origin Signature (College) */}
      <View style={styles.originContainer}>
        <Text style={styles.kicker}>ORIGIN_SIGNATURE //</Text>
        <View style={styles.originBox}>
          <Ionicons name="school-outline" size={16} color={COLORS.grey} />
          <Text style={styles.originText} numberOfLines={1}>
            {item.profiles.training_ground?.toUpperCase() || "OPEN_DOMAIN / SELF_TAUGHT"}
          </Text>
        </View>
      </View>

      {/* 4. Full-Width Action Grid */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.rejectButton} 
          onPress={() => handlePress('rejected')}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectText}>DENY ACCESS</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={() => handlePress('accepted')}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptText}>APPROVE DEPLOYMENT</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Brutalist HUD Box
  hudBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 16,
    marginBottom: 20,
    position: "relative",
  },
  corner: { position: "absolute", width: 10, height: 10, borderColor: COLORS.primary },
  topLeft: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },

  // Typography
  kicker: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 2, marginBottom: 8 },
  projectName: { color: COLORS.white, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  sectionHeader: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", paddingBottom: 12 },

  // Identity Block
  identityContainer: { marginBottom: 20 },
  githubSourceButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    marginBottom: 8,
  },
  githubRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  handleText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  badge: { backgroundColor: `${COLORS.primary}20`, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: COLORS.primary, fontSize: 8, fontWeight: "900" },
  stackText: { color: COLORS.grey, fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginLeft: 2, lineHeight: 16 },

  // Origin Signature
  originContainer: { marginBottom: 25 },
  originBox: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10, 
    backgroundColor: "rgba(0,0,0,0.4)", 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "rgba(255, 255, 255, 0.05)" 
  },
  originText: { color: COLORS.white, fontSize: 12, fontWeight: "600", fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 0.5 },

  // Action Grid
  actionContainer: { gap: 10 },
  rejectButton: { 
    width: "100%", 
    padding: 14, 
    borderWidth: 1, 
    borderColor: "rgba(239, 68, 68, 0.3)", 
    backgroundColor: "rgba(239, 68, 68, 0.05)", 
    alignItems: "center" 
  },
  rejectText: { color: "#ef4444", fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  
  acceptButton: { 
    width: "100%", 
    padding: 16, 
    backgroundColor: COLORS.primary, 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    gap: 8 
  },
  acceptText: { color: COLORS.background, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
});