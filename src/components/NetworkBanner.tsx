import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStore } from "../store/useNetworkStore";

export const NetworkBanner = () => {
  const isConnected = useNetworkStore((state) => state.isOffline);
  const insets = useSafeAreaInsets();

  if (!isConnected) return null;

  const topPadding =
    Platform.OS === "ios" ? insets.top : RNStatusBar.currentHeight || 0;

  return (
    <Animated.View
      entering={SlideInUp.duration(400)}
      exiting={SlideOutUp.duration(400)}
      style={[styles.container, { paddingTop: topPadding }]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Ionicons name="alert-circle" size={16} color="#000" />
          <Text style={styles.text}>CONNECTION_LOST // OFFLINE_MODE</Text>
        </View>
        <View style={styles.blinkContainer}>
          <View style={styles.dot} />
        </View>
      </View>
      <View style={styles.glitchLine} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ef4444",
    zIndex: 9999,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.2)",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  blinkContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000",
    opacity: 0.8,
  },
  glitchLine: {
    height: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    width: "100%",
  },
});
