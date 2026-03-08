import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { COLORS } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { height } = Dimensions.get("window");

interface SwiperCardProps {
  card: {
    id: string;
    match_score: number;
    project_name: string;
    required_skills: string;
    project_description: string;
    founder_github: string;
    required_college: string;
    founder_college?: string; // 🚀 ADDED: To accept the founder's actual college
  };
}

export default function SwiperCard({ card }: SwiperCardProps) {
  const router = useRouter();

  const skills = card.required_skills
    ? card.required_skills.split(",").map((s) => s.trim())
    : [];

  // Now mapping to the exact data point Postgres sends us
  const matchPercentage = Math.round(card.match_score * 100);

  const openGitHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (card.founder_github) {
      Linking.openURL(`https://github.com/${card.founder_github}`);
    }
  };

  const openDossier = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/dossier",
      params: {
        id: card.id,
        name: card.project_name,
        match: matchPercentage,
        skills: card.required_skills,
        description: card.project_description,
        founder: card.founder_github,
        college: card.required_college,
      },
    });
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${COLORS.primary}10`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <View style={styles.matchBadge}>
          <Ionicons name="scan" size={14} color={COLORS.background} />
          <Text style={styles.matchText}>
            {isNaN(matchPercentage) ? "0" : matchPercentage}% TRUTH MATCH
          </Text>
        </View>
        <Text style={styles.systemId}>
          SYS_ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.kicker}>PROJECT_NAME //</Text>
        <Text style={styles.projectName}>{card.project_name}</Text>

        <Text style={styles.description} numberOfLines={3}>
          {card.project_description}
        </Text>

        <View style={styles.divider} />

        {/* 🚀 MOVED: Required College is now a dedicated recruitment domain constraint */}
        <Text style={styles.kicker}>REQUIRED_COLLEGE //</Text>
        <View style={styles.constraintBadge}>
          <Ionicons
            name="business-outline"
            size={12}
            color={COLORS.background}
          />
          <Text style={styles.constraintText}>
            {card.required_college?.toUpperCase() === "ANY"
              ? "ANY COLLEGE"
              : card.required_college?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.kicker}>REQUIRED_STACK //</Text>
        <View style={styles.skillsContainer}>
          {skills.slice(0, 4).map((skill, index) => (
            <View key={index} style={styles.skillTag} >
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.identityBlock}>
        <Text style={styles.kicker}>FOUNDER_INTEL //</Text>
        <TouchableOpacity
          style={styles.githubFullButton}
          onPress={openGitHub}
          activeOpacity={0.8}
        >
          <View style={styles.githubInfo}>
            <Ionicons name="logo-github" size={20} color={COLORS.primary} />
            <Text style={styles.githubUser}>
              @{card.founder_github || "UNKNOWN"}
            </Text>
          </View>

          {/* 🚀 FIXED: Only shows if founder_college exists, otherwise just shows the arrow */}
          {card.founder_college ? (
            <View style={styles.collegeInfo}>
              <Text style={styles.collegeText} numberOfLines={1}>
                {card.founder_college.toUpperCase()}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={COLORS.primary}
              />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.expandButton}
        activeOpacity={0.9}
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
    height: height * 0.7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(234, 179, 8, 0.3)",
    backgroundColor: COLORS.surface,
    padding: 24,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  },
  content: { flex: 1, overflow: "hidden" },
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
    marginBottom: 12,
  },
  description: {
    color: COLORS.grey,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 15,
  },
  // 🚀 NEW STYLES FOR DOMAIN CONSTRAINT BADGE
  constraintBadge: {
    backgroundColor: COLORS.white,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
    marginBottom: 15,
  },
  constraintText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
    maxHeight: 28, // 🚀 Locks container to exactly one line tall
    overflow: "hidden", // 🚀 Instantly hides any tag that gets pushed to line 2
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
    textTransform: "uppercase",
  },
  identityBlock: { marginTop: "auto", marginBottom: 15 },
  githubFullButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 14,
    borderRadius: 4,
  },
  githubInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  githubUser: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  collegeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "50%",
  },
  collegeText: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  expandButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 6,
    gap: 8,
  },
  expandText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1.5,
  },
});
