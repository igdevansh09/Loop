import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { useAuthStore, UserProfile } from "../../store/useAuthStore";

interface ExtendedProfile extends UserProfile {
  training_ground: string | null;
  available_hours_per_day: number | null;
  ai_assessment: string | null;
  ai_primary_stack: string | null;
  ai_weekend_build: string | null;
}

// --- 1. HUD Corner Brackets ---
const CornerBrackets = ({ color = COLORS.primary }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
  </View>
);

// --- 2. Kinetic Typewriter ---
const TypewriterText = ({ text, delay = 0, style, ...props }: any) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let index = 0;
    setDisplayedText("");

    const startTyping = () => {
      timeout = setInterval(() => {
        setDisplayedText(text.substring(0, index + 1));
        index++;
        if (index % 4 === 0) Haptics.selectionAsync();
        if (index >= text.length) clearInterval(timeout);
      }, 30);
    };

    const initialDelay = setTimeout(startTyping, delay);
    return () => {
      clearInterval(timeout);
      clearTimeout(initialDelay);
    };
  }, [text, delay]);

  return (
    <Text style={style} {...props}>
      {displayedText}
      <Text style={{ color: COLORS.primary }}>_</Text>
    </Text>
  );
};

// --- 3. Kinetic Telemetry Bar ---
const TelemetryBar = ({ label, percentage, color, delay }: any) => {
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withDelay(
      delay,
      withSpring(percentage, { damping: 15, stiffness: 100 }),
    );
  }, [percentage]); // Added dependency so it re-animates on refresh

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  return (
    <View style={styles.barContainer}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barPercent, { color }]}>{percentage}%</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: color }, animatedStyle]}
        />
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const {
    user,
    profile,
    githubStats,
    burnTrainingGround,
    generateAiProfile,
    signOut,
    deleteAccount,
  } = useAuthStore();

  const [collegeInput, setCollegeInput] = useState("");
  const [isBurning, setIsBurning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Used for Pull-to-Refresh

  const currentProfile = profile as ExtendedProfile | null;
  const githubMetadata = user?.user_metadata;

  const sysId = githubMetadata?.user_name || "UNKNOWN_USER";
  const avatar =
    githubMetadata?.avatar_url || "https://github.com/identicons/arena.png";
  const isVerified = !!currentProfile?.ai_assessment;

  // 🚀 The Pull-to-Refresh Handler
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSyncing(true);

    const success = await generateAiProfile();

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Uplink Failed",
        "Could not sync with GitHub. Try again later.",
      );
    }
    setIsSyncing(false);
  };

  const handleLockOrigin = async () => {
    if (!collegeInput.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsBurning(true);
    const success = await burnTrainingGround(collegeInput.trim());
    setIsBurning(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("System Failure", "Failed to write to database.");
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    Alert.alert("Disconnect", "Terminate current session?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "BURN IDENTITY",
      "This action is IRREVERSIBLE. Your vector signature, telemetry, and arena history will be permanently eradicated.",
      [
        { text: "ABORT", style: "cancel" },
        {
          text: "OBLITERATE",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const success = await deleteAccount();
            if (!success) {
              Alert.alert(
                "System Failure",
                "Could not eradicate identity. Contact command.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Deep Atmospheric Glow */}
      <LinearGradient
        colors={[`${COLORS.primary}15`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* 🚀 FIXED: Added the Kinetic Header from the Arena */}
      <Animated.View
        entering={FadeInDown.delay(100).springify().damping(15)}
        style={styles.headerContainer}
      >
        <Text style={styles.kicker}>IDENTITY // CLASSIFIED</Text>
        <Text style={styles.header}>THE DOSSIER</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // 🚀 FIXED: Added Native Pull-to-Refresh
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* --- 1. IDENTITY MATRIX --- */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <View style={styles.identityHeader}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <View style={styles.avatarOverlay} />
            </View>

            <View style={styles.identityDetails}>
              <View style={styles.rowCentered}>
                <Text style={styles.hudKicker}>SYS_ID //</Text>
                <Text
                  style={[
                    styles.clearanceTag,
                    // {
                    //   backgroundColor: isVerified
                    //     ? COLORS.primary
                    //     : COLORS.grey,
                    // },
                  ]}
                >
                  {isVerified ? (
                    <Ionicons
                      name="checkmark-circle-sharp"
                      size={24}
                      color={COLORS.primary}
                    />
                  ) : (
                    <Ionicons
                      name="close-circle-sharp"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </Text>
              </View>
              <TypewriterText
                text={`@${sysId}`}
                delay={400}
                style={styles.handleText}
                numberOfLines={1}
                adjustsFontSizeToFit
              />
              <Animated.Text
                entering={FadeIn.delay(1200)}
                style={styles.timestampText}
              >
                ENTRY_EPOCH: {Math.floor(Date.now() / 1000)}
              </Animated.Text>
            </View>
          </View>
        </Animated.View>

        {/* --- 2. AI DOSSIER (SHATTERED SHARDS) --- */}
        {isVerified && (
          <View style={styles.shardContainer}>
            {/* Shard 1: Primary Stack */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={styles.shardBox}
            >
              <CornerBrackets color={COLORS.primary} />
              <View style={styles.shardHeader}>
                <Ionicons name="layers" size={14} color={COLORS.primary} />
                <Text style={styles.shardLabel}>PRIMARY STACK</Text>
              </View>
              <Text style={styles.shardHighlight}>
                {currentProfile?.ai_primary_stack}
              </Text>
            </Animated.View>

            {/* Shard 2: 48-Hour Capability */}
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              style={[
                styles.shardBox,
                { borderColor: "rgba(249, 115, 22, 0.3)" },
              ]}
            >
              <CornerBrackets />
              <View style={styles.shardHeader}>
                <Ionicons name="hardware-chip" size={14} color="#f97316" />
                <Text style={[styles.shardLabel, { color: "#f97316" }]}>
                  48-HOUR CAPABILITY
                </Text>
              </View>
              <Text style={styles.shardHighlight}>
                {currentProfile?.ai_weekend_build}
              </Text>
            </Animated.View>

            {/* Shard 3: Brutal Assessment */}
            <Animated.View
              entering={FadeInDown.delay(500).springify()}
              style={[
                styles.shardBox,
                { borderColor: "rgba(239, 68, 68, 0.3)" },
              ]}
            >
              <CornerBrackets />
              <View style={styles.shardHeader}>
                <Ionicons name="warning" size={14} color="#ef4444" />
                <Text style={[styles.shardLabel, { color: "#ef4444" }]}>
                  BRUTAL ASSESSMENT
                </Text>
              </View>
              <Text style={styles.shardText}>
                {currentProfile?.ai_assessment}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* --- 3. RAW GITHUB TELEMETRY --- */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={14} color={COLORS.primary} />
            <Text style={styles.sectionLabel}>RAW TELEMETRY</Text>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {githubStats?.repoCount || 0}
              </Text>
              <Text style={styles.statLabel}>REPOSITORIES</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {githubStats?.totalStars || 0}
              </Text>
              <Text style={styles.statLabel}>TOTAL STARS</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.hudKicker}>LANGUAGE_DISTRIBUTION //</Text>

          {githubStats?.topLanguages && githubStats.topLanguages.length > 0 ? (
            githubStats.topLanguages.map((lang, index) => {
              const colors = [COLORS.primary, "#f97316", "#3b82f6"];
              return (
                <TelemetryBar
                  key={`${lang.lang}-${isSyncing}`} // Forces re-render/re-animation on sync
                  label={lang.lang}
                  percentage={lang.percentage}
                  color={colors[index % colors.length]}
                  delay={100 + index * 150}
                />
              );
            })
          ) : (
            <Text style={styles.subText}>{">"} NO DATA FOUND</Text>
          )}
        </Animated.View>

        {/* --- 4. OPERATING PARAMETERS (Origin Lock) --- */}
        <Animated.View
          entering={FadeInDown.delay(700).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={14} color={COLORS.primary} />
            <Text style={styles.sectionLabel}>OPERATING PARAMETERS</Text>
          </View>

          <Text style={styles.inputLabel}>TRAINING GROUND / ORIGIN</Text>
          {currentProfile?.training_ground ? (
            <View style={styles.lockedBox}>
              <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
              <Text style={styles.lockedText}>
                {currentProfile.training_ground}
              </Text>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.warningKicker}>[ REQUIRED ACTION ]</Text>
              <Text style={styles.warningText}>
                Input origin. Warning: This action is immutable.
              </Text>

              <View style={styles.burnRow}>
                <TextInput
                  style={styles.burnInput}
                  placeholder="e.g. NSUT, MIT, Self-Taught"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={collegeInput}
                  onChangeText={setCollegeInput}
                />
                <TouchableOpacity
                  style={[styles.burnButton, isBurning && { opacity: 0.7 }]}
                  onPress={handleLockOrigin}
                  disabled={isBurning}
                >
                  {isBurning ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <Ionicons
                      name="flame"
                      size={20}
                      color={COLORS.background}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>
            SYSTEM CAPACITY
          </Text>
          <View
            style={[
              styles.lockedBox,
              {
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(0,0,0,0.6)",
              },
            ]}
          >
            <Ionicons name="time" size={16} color={COLORS.grey} />
            <Text style={[styles.lockedText, { color: COLORS.grey }]}>
              {currentProfile?.available_hours_per_day || "0"} HOURS / DAY
            </Text>
          </View>
        </Animated.View>

        {/* --- 5. EXIT PROTOCOLS --- */}
        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.exitContainer}
        >
          <Text style={styles.kicker}>EXIT_PROTOCOLS //</Text>

          <View style={styles.exitButtonsRow}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="power" size={16} color={COLORS.grey} />
              <Text style={styles.logoutText}>TERMINATE SESSION</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <Ionicons name="skull" size={16} color={COLORS.background} />
              <Text style={styles.deleteText}>BURN IDENTITY</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // 🚀 FIXED: Reduced paddingHorizontal from 24 to 16 to stretch content wider
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 },

  // Header Component
  headerContainer: {
    paddingTop: 60,
    // 🚀 FIXED: Matched the new wider layout
    paddingHorizontal: 16,
    marginBottom: 10,
    zIndex: 10,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 4,
  },
  header: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
    textTransform: "uppercase",
  },

  // HUD Elements
  hudBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    // 🚀 FIXED: Reduced internal padding from 20 to 16 to give inner content more room to breathe
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 2,
  },
  rowCentered: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Identity
  identityHeader: { flexDirection: "row", alignItems: "center", gap: 15 },
  avatarWrapper: {
    width: 75,
    height: 75,
    borderWidth: 1,
    borderColor: COLORS.primary,
    position: "relative",
  },
  avatar: { width: "100%", height: "100%" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${COLORS.primary}22`,
  },
  identityDetails: { flex: 1 },
  hudKicker: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  clearanceTag: {
    color: COLORS.background,
    fontSize: 8,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    letterSpacing: 1,
  },
  handleText: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
  },
  timestampText: {
    color: COLORS.grey,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 4,
    letterSpacing: 1,
  },

  // Shattered AI Dossier Shards
  shardContainer: { gap: 12, marginBottom: 20 },
  shardBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
    padding: 16,
    position: "relative",
  },
  shardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  shardLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  shardHighlight: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 20,
  },
  shardText: {
    color: COLORS.grey,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
  },

  // Telemetry Grid
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 15,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.grey,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 20,
  },

  // Kinetic Bars
  barContainer: { marginBottom: 15 },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  barLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  barPercent: { fontSize: 10, fontWeight: "900" },
  barTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: { height: "100%" },
  subText: {
    color: COLORS.grey,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // Training Ground / Operating Parameters
  inputLabel: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1,
  },
  lockedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderWidth: 1,
    borderColor: `${COLORS.primary}55`,
    padding: 15,
  },
  lockedText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  warningBox: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 15,
  },
  warningKicker: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },
  warningText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
    fontWeight: "500",
  },
  burnRow: { flexDirection: "row", gap: 10 },
  burnInput: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    color: COLORS.white,
    paddingHorizontal: 15,
    fontSize: 13,
    fontWeight: "700",
  },
  burnButton: {
    backgroundColor: "#ef4444",
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  // Exit Protocols
  exitContainer: { marginTop: 10, marginBottom: 20 },
  exitButtonsRow: { flexDirection: "row", gap: 10, marginTop: 10 },

  logoutButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
  },
  logoutText: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    padding: 16,
  },
  deleteText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
