import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import Animated, { FadeInDown } from "react-native-reanimated";

// HUD Corner Brackets
const CornerBrackets = ({ color = COLORS.primary }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
  </View>
);

export default function DossierScreen() {
  const router = useRouter();
  const [isTransmitting, setIsTransmitting] = useState(false);

  // 🚀 Catch the data. Make sure SwiperCard passes 'id' (the team ID) here!
  const { id, name, match, description, skills, founder, college } =
    useLocalSearchParams<{
      id: string;
      name: string;
      match: string;
      description: string;
      skills: string;
      founder: string;
      college: string;
    }>();

  const skillArray = skills ? skills.split(",").map((s) => s.trim()) : [];
  const safeMatch = isNaN(Number(match)) ? "0" : match;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openGitHub = () => {
    if (!founder) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://github.com/${founder}`);
  };

  // 🚀 The Application Trigger
  const handleApply = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsTransmitting(true);

    try {
      // TODO: Call your Zustand store's swipe right/apply function here
      // await useArenaStore.getState().swipeRight(id);

      // Simulating a network delay for the tactical feel
      await new Promise((resolve) => setTimeout(resolve, 800));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto-return to Arena after successful transmission
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsTransmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${COLORS.primary}10`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

      {/* Header Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>ARENA</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>DATA_STREAM</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.matchBadge}>
            <Ionicons name="scan" size={16} color={COLORS.background} />
            <Text style={styles.matchText}>{safeMatch}% TRUTH MATCH</Text>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(200).springify()}
          style={styles.title}
        >
          {name}
        </Animated.Text>

        {/* Founder Intel & Origin Block */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <Text style={styles.kicker}>FOUNDER_INTEL //</Text>

          <TouchableOpacity
            style={styles.githubButton}
            onPress={openGitHub}
            activeOpacity={0.8}
          >
            <View style={styles.githubRow}>
              <Ionicons name="logo-github" size={20} color={COLORS.primary} />
              <Text style={styles.handleText}>@{founder || "UNKNOWN"}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>VIEW SOURCE</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerSmall} />

          <Text style={styles.kicker}>TARGET_ORIGIN //</Text>
          <View style={styles.originBox}>
            <Ionicons name="business-outline" size={16} color={COLORS.grey} />
            <Text style={styles.originText} numberOfLines={1}>
              {college?.toUpperCase() || "OPEN_DOMAIN / SELF_TAUGHT"}
            </Text>
          </View>
        </Animated.View>

        {/* Required Stack */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <Text style={styles.kicker}>REQUIRED_STACK //</Text>
          <View style={styles.skillsContainer}>
            {skillArray.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Mission Briefing */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <Text style={styles.kicker}>MISSION_BRIEFING //</Text>
          <Text style={styles.description}>{description}</Text>
        </Animated.View>

        {/* 🚀 NEW: THE APPLY BUTTON */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <TouchableOpacity
            style={[
              styles.applyButton,
              isTransmitting && styles.applyButtonActive,
            ]}
            onPress={handleApply}
            disabled={isTransmitting}
            activeOpacity={0.9}
          >
            {isTransmitting ? (
              <>
                <ActivityIndicator color={COLORS.background} size="small" />
                <Text style={styles.applyText}>TRANSMITTING SIGNAL...</Text>
              </>
            ) : (
              <>
                <Ionicons name="radio" size={20} color={COLORS.background} />
                <Text style={styles.applyText}>REQUEST CLEARANCE // APPLY</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* End of File Indicator */}
        <Animated.View
          entering={FadeInDown.delay(700)}
          style={styles.eofContainer}
        >
          <Text style={styles.eofText}>[ END OF FILE ]</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  navTitle: {
    color: COLORS.grey,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10,
    letterSpacing: 2,
  },
  scrollContent: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 100 },

  hudBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
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

  matchBadge: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 8,
    marginBottom: 20,
  },
  matchText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 30,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },

  githubButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
  },
  githubRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  handleText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  badge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: COLORS.primary, fontSize: 8, fontWeight: "900" },
  dividerSmall: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 15,
  },
  originBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  originText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
  },

  skillsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skillTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  skillText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  description: {
    color: COLORS.grey,
    fontSize: 15,
    lineHeight: 26,
    fontWeight: "500",
  },

  // 🚀 NEW: Apply Button Styles
  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 4,
    marginTop: 10,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  applyButtonActive: {
    backgroundColor: COLORS.grey,
    shadowOpacity: 0,
  },
  applyText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  eofContainer: { marginTop: 40, alignItems: "center" },
  eofText: {
    color: "rgba(255, 255, 255, 0.2)",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    letterSpacing: 3,
  },
});
