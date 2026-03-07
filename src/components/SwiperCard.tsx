import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // 🚀 Added Router
import { COLORS } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { height } = Dimensions.get("window");

interface SwiperCardProps {
  card: {
    similarity: number;
    project_name: string;
    required_skills: string;
    project_description: string;
  };
}

export default function SwiperCard({ card }: SwiperCardProps) {
  const router = useRouter();
  const skills = card.required_skills
    ? card.required_skills.split(",").map((s) => s.trim())
    : [];
  const matchPercentage = Math.round(card.similarity * 100);

  const openDossier = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 🚀 Pass the data cleanly through the router parameters
    router.push({
      pathname: "/dossier",
      params: {
        name: card.project_name,
        match: matchPercentage,
        skills: card.required_skills,
        description: card.project_description,
      },
    });
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${COLORS.primary}15`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.header}>
        <View style={styles.matchBadge}>
          <Ionicons name="scan" size={16} color={COLORS.background} />
          <Text style={styles.matchText}>{matchPercentage}% TRUTH MATCH</Text>
        </View>
        <Text style={styles.systemId}>
          SYS_ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.kicker}>PROJECT_NAME //</Text>
        <Text style={styles.projectName}>{card.project_name}</Text>

        {/* 🚀 Truncated back to 4 lines so it fits perfectly */}
        <Text style={styles.description} numberOfLines={4}>
          {card.project_description}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.kicker}>REQUIRED_STACK //</Text>
        <View style={styles.skillsContainer}>
          {skills.slice(0, 4).map(
            (
              skill,
              index, // Only show first 4 skills on the card
            ) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ),
          )}
          {skills.length > 4 && (
            <Text style={styles.moreSkillsText}>+{skills.length - 4} MORE</Text>
          )}
        </View>
      </View>

      {/* 🚀 The Trigger Button */}
      <TouchableOpacity
        style={styles.expandButton}
        activeOpacity={0.8}
        onPress={openDossier}
      >
        <Ionicons name="terminal-outline" size={18} color={COLORS.background} />
        <Text style={styles.expandText}>DECRYPT FULL DOSSIER</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: height * 0.65,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(234, 179, 8, 0.3)",
    backgroundColor: COLORS.surface,
    padding: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  matchBadge: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  matchText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  systemId: {
    color: COLORS.grey,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
  },
  projectName: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 15,
  },
  description: {
    color: COLORS.grey,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 20,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  skillTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  skillText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  moreSkillsText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 5,
  },
  expandButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 6,
    marginTop: 20,
    gap: 8,
  },
  expandText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1.5,
  },
});
