import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Linking as RNLinking,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
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
    founder_college?: string;
    max_capacity?: number; // 🚀 ADDED CAPACITY
    required_gender?: string; // 🚀 ADDED GENDER
    hackathon_url?: string;
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
      RNLinking.openURL(`https://github.com/${card.founder_github}`);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const shareUrl = Linking.createURL("/dossier", {
        queryParams: { id: card.id },
      });

      await Share.share({
        message: `[ENCRYPTED INTEL] I found a high-value project in the Arena: ${card.project_name}.\n\nDecrypt the dossier here: ${shareUrl}`,
      });
    } catch (error) {
      console.error("Transmission failed:", error);
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
        founder_college: card.founder_college, // 🚀 ADDED
        capacity: card.max_capacity?.toString(), // 🚀 ADDED
        gender: card.required_gender, // 🚀 ADDED
        hackathon_url: card.hackathon_url,
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="share-social" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.kicker}>PROJECT_NAME //</Text>
        <Text style={styles.projectName}>{card.project_name}</Text>

        <Text style={styles.description} numberOfLines={3}>
          {card.project_description}
        </Text>

        <View style={styles.divider} />

        {/* 🚀 UPGRADED: Team Constraints Row */}
        <Text style={styles.kicker}>TEAM_CONSTRAINTS //</Text>
        <View style={styles.constraintsRow}>
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

          <View style={styles.constraintBadge}>
            <Ionicons
              name="people-outline"
              size={12}
              color={COLORS.background}
            />
            <Text style={styles.constraintText}>
              MAX: {card.max_capacity || "ANY"}
            </Text>
          </View>

          <View style={styles.constraintBadge}>
            <Ionicons
              name="male-female-outline"
              size={12}
              color={COLORS.background}
            />
            <Text style={styles.constraintText}>
              {card.required_gender?.toUpperCase() || "ANY"}
            </Text>
          </View>
        </View>

        <Text style={styles.kicker}>REQUIRED_STACK //</Text>
        <View style={styles.skillsContainer}>
          {skills.slice(0, 4).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          <Text style={{ color: COLORS.grey, fontSize: 10, marginTop: 6 }}>
            {skills.length > 4 && `+${skills.length - 4} more`}
          </Text>
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
  // 🚀 NEW: Constraints Row Layout
  constraintsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },
  constraintBadge: {
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
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
    maxHeight: 28,
    overflow: "hidden",
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
