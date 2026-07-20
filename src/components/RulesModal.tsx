import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RulesModal({ visible, onClose }: RulesModalProps) {
  const handleAcknowledge = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="warning" size={18} color="#ef4444" />
              <Text style={styles.title}>EVALUATION PROTOCOLS</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
          >
            <Text style={styles.kicker}>READ BEFORE UPLINK //</Text>
            <Text style={styles.mainText}>
              Our AI operates as a ruthless technical recruiter. It does NOT
              care about your tutorial clones or empty repositories. Before
              executing the GitHub uplink, ensure your profile reflects actual
              engineering depth.
            </Text>
            <View style={styles.divider} />
            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>1. THE DOCUMENTATION PENALTY</Text>
              <Text style={styles.ruleText}>
                The AI extracts and reads the README of your top 3 flagship
                projects. If your README is missing, empty, or just a default
                <Text style={{ fontStyle: "italic" }}> Create React App </Text>
                template, you will be heavily penalized. Real engineers write
                docs.
              </Text>
            </View>
            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>2. THE STACK TRUTH</Text>
              <Text style={styles.ruleText}>
                Do not fake your tech stack. The AI analyzes the actual
                byte-level breakdown of your repositories. If your repository is
                named{" "}
                <Text style={{ fontStyle: "italic" }}> Go-MicroServices </Text>{" "}
                but contains 90% HTML/CSS, you will be exposed.
              </Text>
            </View>
            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>3. ONE CHANCE POLICY</Text>
              <Text style={styles.ruleText}>
                Your first neural uplink is on the house. If you waste it on a
                garbage GitHub profile, you will have to inject your own Gemini
                API Key to run a new scan.
              </Text>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.ackButton}
              onPress={handleAcknowledge}
              activeOpacity={0.8}
            >
              <Text style={styles.ackText}>I UNDERSTAND. PROCEED.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.4)",
    borderRadius: 4,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(234, 179, 8, 0.2)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  scrollArea: {
    padding: 20,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  mainText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 20,
  },
  ruleBlock: {
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
  },
  ruleTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  ruleText: {
    color: COLORS.grey,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  ackButton: {
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ackText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
