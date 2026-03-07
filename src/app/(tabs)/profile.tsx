import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";

// 🛡️ Strict Database Schema Contract
export interface ExtendedUserProfile {
  id: string;
  training_ground: string | null;
  available_hours_per_day: number | null;
  verified_profile: string | null;
  raw_github_data: any | null;
}

export interface GitHubMetadata {
  user_name?: string;
  avatar_url?: string;
}

interface Repo {
  name: string;
  stars: number;
  language: string | null;
  description: string | null;
}

export default function ProfileScreen() {
  const { user, profile, burnTrainingGround, signOut } = useAuthStore();

  const currentProfile = profile as ExtendedUserProfile | null;
  const githubData = user?.user_metadata as GitHubMetadata | undefined;

  // 1. Identity
  const sysId = githubData?.user_name || "UNKNOWN_USER";
  const avatar = githubData?.avatar_url || "https://via.placeholder.com/150";
  const aiDossier = currentProfile?.verified_profile;

  // Mutable State
  const [collegeInput, setCollegeInput] = useState("");
  const [isBurning, setIsBurning] = useState(false);

  // 2. 🚀 The Parser: Dynamically process raw_github_data
  const githubStats = useMemo(() => {
    let repos: Repo[] = [];
    const rawData = currentProfile?.raw_github_data;

    if (typeof rawData === "string") {
      try {
        repos = JSON.parse(rawData);
      } catch (e) {
        console.error("Parse error");
      }
    } else if (Array.isArray(rawData)) {
      repos = rawData;
    }

    const repoCount = repos.length;
    let totalStars = 0;
    const langCounts: Record<string, number> = {};

    repos.forEach((repo) => {
      totalStars += repo.stars || 0;
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    });

    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(
        ([lang, count]) =>
          `${lang} (${Math.round((count / repoCount) * 100)}%)`,
      );

    return { repoCount, totalStars, topLanguages };
  }, [currentProfile?.raw_github_data]);

  // Aggregations (Placeholders)
  const totalInbounds = 0;
  const totalOutbounds = 0;

  const handleLockCollege = async () => {
    if (!collegeInput.trim()) {
      Alert.alert("Logic Error", "Enter a valid origin/college name.");
      return;
    }

    setIsBurning(true);
    const success = await burnTrainingGround(collegeInput.trim());
    setIsBurning(false);

    if (!success)
      Alert.alert("Rejection", "Failed to lock parameters into the database.");
  };

  const handleLogout = () => {
    Alert.alert("Disconnect", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleDeactivate = () => {
    Alert.alert(
      "Burn Identity",
      "Total account deletion requires elevated server privileges. Your session will be terminated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Terminate Session",
          style: "destructive",
          onPress: () => signOut(),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. IDENTITY MATRIX */}
      <View style={styles.headerCard}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.identityText}>
          <Text style={styles.sysId}>@{sysId}</Text>
          <Text
            style={[
              styles.badge,
              { color: aiDossier ? COLORS.primary : COLORS.grey },
            ]}
          >
            {aiDossier ? "AI VERIFIED" : "UNVERIFIED"}
          </Text>
        </View>
      </View>

      {/* 2. THE AI DOSSIER (The Brutal Truth) */}
      {aiDossier ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI DOSSIER (VERIFIED TRUTH)</Text>
          <View style={styles.dossierBox}>
            <Text style={styles.dossierText}>{aiDossier}</Text>
          </View>
        </View>
      ) : null}

      {/* 3. RAW GITHUB TELEMETRY */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>RAW GITHUB DATA</Text>
        <View style={styles.telemetryBox}>
          <Text style={styles.telemetryText}>
            PUBLIC REPOS:{" "}
            <Text style={styles.highlight}>{githubStats.repoCount}</Text>
          </Text>
          <Text style={styles.telemetryText}>
            TOTAL STARS:{" "}
            <Text style={styles.highlight}>{githubStats.totalStars}</Text>
          </Text>

          <Text style={[styles.telemetryText, { marginTop: 10 }]}>
            TOP LANGUAGES:
          </Text>
          {githubStats.topLanguages.length > 0 ? (
            githubStats.topLanguages.map((lang, index) => (
              <Text key={index} style={styles.subText}>
                {" "}
                {">"} {lang}
              </Text>
            ))
          ) : (
            <Text style={styles.subText}> {">"} NO DETECTABLE STACK</Text>
          )}
        </View>
      </View>

      {/* 4. NETWORK ACTIVITY */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NETWORK ACTIVITY</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalInbounds}</Text>
            <Text style={styles.statName}>TOTAL INBOUNDS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalOutbounds}</Text>
            <Text style={styles.statName}>TOTAL OUTBOUNDS</Text>
          </View>
        </View>
      </View>

      {/* 5. OPERATING PARAMETERS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>OPERATING PARAMETERS</Text>

        <Text style={styles.inputLabel}>
          Available Hours / Day (System Locked)
        </Text>
        <View style={styles.lockedInput}>
          <Text style={styles.lockedText}>
            {currentProfile?.available_hours_per_day || "0"} Hours
          </Text>
        </View>

        <Text style={styles.inputLabel}>Origin / College</Text>
        {currentProfile?.training_ground ? (
          <View style={styles.lockedInput}>
            <Text style={styles.lockedText}>
              {currentProfile.training_ground}
            </Text>
            <Text style={styles.lockIcon}>🔒 FIXED</Text>
          </View>
        ) : (
          <View>
            <TextInput
              style={styles.input}
              placeholder="e.g., NSUT (Cannot be changed later)"
              placeholderTextColor={COLORS.grey}
              value={collegeInput}
              onChangeText={setCollegeInput}
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLockCollege}
              disabled={isBurning}
            >
              <Text style={styles.actionButtonText}>
                {isBurning ? "LOCKING..." : "LOCK ORIGIN"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 6. EXIT PROTOCOLS */}
      <View style={styles.exitContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>DISCONNECT / LOGOUT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deactivateButton}
          onPress={handleDeactivate}
        >
          <Text style={styles.deactivateText}>DEACTIVATE ACCOUNT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  section: { marginBottom: 30 },
  sectionLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 15,
  },

  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  identityText: { marginLeft: 20, flex: 1 },
  sysId: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  badge: { fontSize: 12, marginTop: 4, fontWeight: "bold" },

  dossierBox: {
    backgroundColor: "#0A0A0A",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  dossierText: {
    color: COLORS.grey,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "monospace",
  },

  telemetryBox: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  telemetryText: {
    color: COLORS.grey,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  highlight: { color: COLORS.white },
  subText: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 4,
    fontFamily: "monospace",
  },

  statsGrid: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  statValue: { color: COLORS.white, fontSize: 28, fontWeight: "bold" },
  statName: {
    color: COLORS.grey,
    fontSize: 11,
    marginTop: 5,
    fontWeight: "bold",
  },

  inputLabel: {
    color: COLORS.grey,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    color: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  lockedInput: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockedText: { color: COLORS.grey, fontSize: 16, fontWeight: "bold" },
  lockIcon: { color: "#ff4444", fontSize: 12, fontWeight: "bold" },

  actionButton: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: { color: COLORS.background, fontWeight: "900" },

  exitContainer: { marginTop: 10, gap: 15 },
  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.grey,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: COLORS.grey, fontWeight: "bold" },
  deactivateButton: {
    borderWidth: 1,
    borderColor: "#8A0000",
    backgroundColor: "#1A0000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  deactivateText: { color: "#FF4444", fontWeight: "bold" },
});
