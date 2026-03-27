import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import Animated, { ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: "error" | "success" | "warning" | "info";
}

export const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  type = "info",
}: CustomAlertProps) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return <Ionicons name="skull" size={32} color="#ef4444" />;
      case "success":
        return <Ionicons name="checkmark-circle" size={32} color="#22c55e" />;
      case "warning":
        return (
          <Ionicons name="warning" size={32} color="rgba(234, 179, 8, 1)" />
        );
      default:
        return (
          <Ionicons
            name="information-circle"
            size={32}
            color={COLORS.primary}
          />
        );
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "error":
        return "#ef4444";
      case "success":
        return "#22c55e";
      case "warning":
        return "rgba(234, 179, 8, 1)";
      default:
        return COLORS.primary;
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          entering={ZoomIn.duration(200)}
          style={[styles.alertBox, { borderColor: getBorderColor() }]}
        >
          <View style={styles.iconContainer}>{getIcon()}</View>
          <Text style={[styles.title, { color: getBorderColor() }]}>
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: getBorderColor() }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <Text style={styles.buttonText}>ACKNOWLEDGE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    padding: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: { marginBottom: 16 },
  title: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    color: COLORS.grey,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
