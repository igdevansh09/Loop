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
import Animated, { ZoomIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAlertStore } from "../store/useAlertStore";

export const CustomAlert = () => {
  const {
    visible,
    title,
    message,
    type,
    isConfirm,
    confirmText,
    onConfirm,
    hideAlert,
  } = useAlertStore();

  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case "error":
        return { icon: "skull", color: "#ef4444" };
      case "success":
        return { icon: "checkmark-circle", color: "#22c55e" };
      case "warning":
        return { icon: "warning", color: "rgba(234, 179, 8, 1)" };
      default:
        return { icon: "information-circle", color: COLORS.primary };
    }
  };

  const theme = getTheme();

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (onConfirm) onConfirm();
    hideAlert();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideAlert();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          entering={ZoomIn.duration(200)}
          exiting={FadeOut}
          style={[styles.alertBox, { borderColor: theme.color }]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={theme.icon as any} size={36} color={theme.color} />
          </View>
          <Text style={[styles.title, { color: theme.color }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {isConfirm ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelText}>ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.color }]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.color }]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          )}
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
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 4,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: COLORS.background, fontWeight: "900", letterSpacing: 1 },
  buttonRow: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
  },
  cancelText: { color: COLORS.grey, fontWeight: "900", letterSpacing: 1 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 4,
  },
  confirmText: {
    color: COLORS.background,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
