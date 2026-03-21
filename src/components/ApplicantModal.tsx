import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import * as Haptics from "expo-haptics";
import Animated, { ZoomIn } from "react-native-reanimated";

interface ApplicantModalProps {
  visible: boolean;
  applicant: {
    id: string;
    profiles: {
      github_handle: string;
      training_ground: string;
      ai_assessment: string; // 🚀 Swapped to ai_assessment
    };
    teams: {
      project_name: string;
    };
  } | null;
  onClose: () => void;
}

export const ApplicantModal = ({
  visible,
  applicant,
  onClose,
}: ApplicantModalProps) => {
  if (!applicant) return null;

  const openGitHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://github.com/${applicant.profiles.github_handle}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
      >
        <Animated.View
          entering={ZoomIn.duration(300).springify().damping(18)}
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {applicant.teams?.project_name?.toUpperCase()} //
            </Text>
          </View>


          {/* GitHub Identity */}
          <View style={styles.infoBlock}>
            <Text style={styles.label}>IDENTITY_SIGNATURE:</Text>
            <TouchableOpacity
              style={styles.githubButton}
              onPress={openGitHub}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-github" size={20} color={COLORS.primary} />
              <Text style={styles.githubText}>
                @{applicant.profiles.github_handle}
              </Text>
              <Ionicons
                name="open-outline"
                size={16}
                color={COLORS.grey}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          </View>

          {/* 🚀 Restored AI Summary Block */}
          <View style={styles.infoBlock}>
            <Text style={styles.label}>AI_DOSSIER_SUMMARY:</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                {applicant.profiles.ai_assessment || "NO INTEL AVAILABLE"}
              </Text>
            </View>
          </View>

          {/* Training Ground */}
          <View style={styles.infoBlock}>
            <Text style={styles.label}>TRAINING_GROUND / ORIGIN:</Text>
            <View style={styles.originBox}>
              <Ionicons name="school-outline" size={16} color={COLORS.grey} />
              <Text style={styles.originText}>
                {applicant.profiles.training_ground?.toUpperCase() ||
                  "OPEN_DOMAIN / SELF_TAUGHT"}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 24,
    borderRadius: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  infoBlock: { marginBottom: 16 },
  label: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 16,
  },
  githubButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  githubText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },

  // 🚀 New Styles for Summary
  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  summaryText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 22, // Better line-height for a paragraph
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  originBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  originText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
