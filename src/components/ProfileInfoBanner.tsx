import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CornerBrackets = ({ color = COLORS.primary }: { color?: string }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
  </View>
);

export default function ProfileInfoBanner() {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(550).springify()}
      style={styles.container}
    >
      <CornerBrackets color="#3b82f6" />

      <TouchableOpacity
        onPress={toggleExpand}
        style={styles.header}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="information-circle" size={16} color="#3b82f6" />
          <Text style={styles.headerText}>FORGE PROTOCOL // HOW IT WORKS</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#3b82f6"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Ionicons name="scan" size={14} color={COLORS.grey} />
            <Text style={styles.infoText}>
              Tumhari profile tumhare recent 30 GitHub repos aur Top 3 Flagship
              projects ke{" "}
              <Text style={styles.highlight}>
                code byte distribution aur README
              </Text>{" "}
              ko deep-scan karke generate ki gayi hai.
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="warning" size={14} color="#f97316" />
            <Text style={styles.infoText}>
              <Text style={styles.highlightOrange}>PRO TIP: </Text>
              Real engineers docs likhte hain. Agar tumhare projects me README
              khali hai ya default template hai, toh AI tumhe heavily penalize
              karega aur tumhara assessment brutal aayega. Apni agli sync se
              pehle apne best projects me proper README add karo.
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(59, 130, 246, 0.05)", // Slight blue tint
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    marginBottom: 20,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 8,
    height: 8,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    color: "#3b82f6",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoText: {
    color: COLORS.grey,
    fontSize: 11,
    lineHeight: 18,
    flex: 1,
    fontWeight: "500",
  },
  highlight: {
    color: COLORS.white,
    fontWeight: "800",
  },
  highlightOrange: {
    color: "#f97316",
    fontWeight: "900",
  },
});
