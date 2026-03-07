import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DossierScreen() {
  const router = useRouter();

  // 🚀 Catch the data sent from the SwiperCard
  const { name, match, description, skills } = useLocalSearchParams<{
    name: string;
    match: string;
    description: string;
    skills: string;
  }>();

  // Parse the skills back into an array
  const skillArray = skills ? skills.split(",").map((s) => s.trim()) : [];

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back(); // Returns user precisely back to the Arena
  };

  return (
    <View style={styles.container}>
      {/* Background Ambience */}
      <LinearGradient
        colors={[`${COLORS.primary}10`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

      {/* 🚀 Header Navbar */}
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
            <Ionicons name="scan" size={18} color={COLORS.background} />
            <Text style={styles.matchText}>{match}% TRUTH MATCH</Text>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(200).springify()}
          style={styles.title}
        >
          {name}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={styles.kicker}>// REQUIRED_STACK</Text>
          <View style={styles.skillsContainer}>
            {skillArray.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.divider} />

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={styles.kicker}>// MISSION_BRIEFING</Text>
          <Text style={styles.description}>{description}</Text>
        </Animated.View>

        {/* End of File Indicator */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.eofContainer}
        >
          <Text style={styles.eofText}>[ END OF FILE ]</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60, // Adjust for notch
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  scrollContent: {
    padding: 30,
    paddingBottom: 100, // Breathing room for scrolling
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
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1.5,
    lineHeight: 46,
    marginBottom: 30,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 15,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  skillTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  skillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 30,
  },
  description: {
    color: COLORS.grey,
    fontSize: 16,
    lineHeight: 28,
    fontWeight: "500",
  },
  eofContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  eofText: {
    color: "rgba(255, 255, 255, 0.2)",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    letterSpacing: 3,
  },
});
