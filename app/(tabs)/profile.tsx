import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Linking,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function DashboardScreen() {
  const { signOut, userId: clerkId } = useAuth();

  const currentUser = useQuery(api.users.getCurrentUser, {
    clerkId: clerkId ?? undefined,
  });
  const updateProfile = useMutation(api.users.updateProfile);
  const deleteAccount = useMutation(api.users.deleteAccount); // The Kill Switch

  const myRequirements = useQuery(api.requirements.getRequirementsByUser, {
    userId: currentUser?._id ?? ("" as any),
  });
  const myApplications = useQuery(api.applications.getMyApplications, {
    applicantId: currentUser?._id ?? ("" as any),
  });

  const [collegeName, setCollegeName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncingStack, setIsSyncingStack] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sophisticated Staggered Animations
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the Sync button to draw the eye subtly
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (currentUser && !currentUser.collegeName) setCollegeName("");
  }, [currentUser]);

  const handleCommitIdentity = useCallback(async () => {
    if (!currentUser) return;
    if (collegeName.trim().length < 2)
      return Alert.alert("Validation Error", "Institution name invalid.");

    setIsUpdating(true);
    try {
      await updateProfile({
        userId: currentUser._id,
        collegeName: collegeName.trim().toUpperCase(),
      });
      Alert.alert("✓ Verified", "Identity permanently locked.");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setIsUpdating(false);
    }
  }, [currentUser, collegeName, updateProfile]);

  const handleSyncStack = useCallback(async () => {
    if (!currentUser || !currentUser.githubUsername) return;
    setIsSyncingStack(true);
    try {
      const res = await fetch(
        `https://api.github.com/users/${currentUser.githubUsername}/repos?sort=updated&per_page=30`,
      );
      if (!res.ok) throw new Error("GitHub API limit reached.");
      const repos = await res.json();

      // Extract languages
      const langs = Array.from(
        new Set(repos.map((r: any) => r.language).filter(Boolean)),
      ).slice(0, 5) as string[];

      // NEW: Extract top 3 repos by stars
      const sortedRepos = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 3);
      const topReposPayload = sortedRepos.map((r: any) => ({
        name: r.name,
        description: r.description || "No description provided.",
        url: r.html_url,
        stars: r.stargazers_count,
      }));

      await updateProfile({
        userId: currentUser._id,
        topLanguages: langs.length > 0 ? langs : ["No public stack detected"],
        topRepos: topReposPayload, // Save to DB
      });
    } catch (err: any) {
      Alert.alert("Sync Failed", err.message);
    } finally {
      setIsSyncingStack(false);
    }
  }, [currentUser, updateProfile]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Eradicate Identity?",
      "This action is permanent. All your nodes, applications, and historical data will be wiped from the network.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe Data",
          style: "destructive",
          onPress: async () => {
            if (!currentUser) return;
            setIsDeleting(true);
            try {
              await deleteAccount({ userId: currentUser._id });
              await signOut(); // Kick them out of Clerk after the DB wipe
            } catch (error: any) {
              setIsDeleting(false);
              Alert.alert("Error", "Could not execute deletion protocol.");
            }
          },
        },
      ],
    );
  }, [currentUser, deleteAccount, signOut]);

  if (
    currentUser === undefined ||
    myRequirements === undefined ||
    myApplications === undefined
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (currentUser === null) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={[styles.loadingText, { color: "#EF4444", marginTop: 12 }]}>
          Identity not found in Ledger.
        </Text>
        <TouchableOpacity style={{ marginTop: 24 }} onPress={() => signOut()}>
          <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>
            Terminate Session
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header & Badge: Animates First */}
        <Animated.View
          style={{ opacity: fadeAnim1, transform: [{ scale: scaleAnim }] }}
        >
          <LinearGradient
            colors={["rgba(234, 179, 8, 0.15)", "transparent"]}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Terminal State</Text>
              <Text style={styles.headerSubtitle}>
                System ID: {currentUser._id.slice(-6)}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.badgeContainer}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: currentUser.avatarUrl || "https://github.com/ghost.png",
                }}
                style={styles.avatar}
              />
              <View style={styles.avatarBorder} />
            </View>
            <View style={styles.badgeInfo}>
              <Text style={styles.username}>{currentUser.githubUsername}</Text>
              <View style={styles.verifiedRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.verifiedText}>GitHub Authenticated</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Telemetry & Tech Stack: Animates Second */}
        <Animated.View style={{ opacity: fadeAnim2 }}>
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{myRequirements.length}</Text>
                <Text style={styles.statLabel}>Nodes Initialized</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{myApplications.length}</Text>
                <Text style={styles.statLabel}>Outbound Syncs</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>GitHub Signature</Text>
              <TouchableOpacity
                onPress={handleSyncStack}
                disabled={isSyncingStack}
                activeOpacity={0.6}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: isSyncingStack ? 1 : pulseAnim }],
                  }}
                >
                  <Ionicons
                    name="sync-circle"
                    size={28}
                    color={
                      isSyncingStack ? COLORS.surfaceLight : COLORS.primary
                    }
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {currentUser.topLanguages && currentUser.topLanguages.length > 0 ? (
              <View style={styles.stackContainer}>
                {currentUser.topLanguages.map((lang: string, idx: number) => (
                  <View key={idx} style={styles.langPill}>
                    <View style={styles.langDot} />
                    <Text style={styles.langText}>{lang}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStack}>
                <Ionicons name="warning" size={20} color={COLORS.secondary} />
                <Text style={styles.emptyStackText}>
                  Stack missing. Tap the sync icon.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Top Repositories Footprint */}
        {currentUser.topRepos && currentUser.topRepos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Footprints</Text>
            <View style={{ gap: 12 }}>
              {currentUser.topRepos.map((repo: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.repoCard}
                  onPress={() => Linking.openURL(repo.url)}
                  activeOpacity={0.7}
                >
                  <View style={styles.repoHeader}>
                    <Ionicons
                      name="git-branch-outline"
                      size={18}
                      color={COLORS.primary}
                    />
                    <Text style={styles.repoName} numberOfLines={1}>
                      {repo.name}
                    </Text>
                    <View style={styles.starBadge}>
                      <Ionicons
                        name="star"
                        size={12}
                        color={COLORS.background}
                      />
                      <Text style={styles.starText}>{repo.stars}</Text>
                    </View>
                  </View>
                  <Text style={styles.repoDesc} numberOfLines={2}>
                    {repo.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Trust Network & Danger Zone: Animates Third */}
        <Animated.View style={{ opacity: fadeAnim3 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trust Network</Text>
            {currentUser.collegeName ? (
              <View style={styles.lockedCard}>
                <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
                <View style={styles.lockedInfo}>
                  <Text style={styles.lockedLabel}>Institution Locked</Text>
                  <Text style={styles.lockedValue}>
                    {currentUser.collegeName}
                  </Text>
                </View>
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={COLORS.surfaceLight}
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Bind Institution (Permanent)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., NSUT"
                    placeholderTextColor={COLORS.surfaceLight}
                    value={collegeName}
                    onChangeText={setCollegeName}
                    maxLength={50}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    isUpdating && styles.disabledButton,
                  ]}
                  onPress={handleCommitIdentity}
                  disabled={isUpdating}
                >
                  <Text style={styles.updateButtonText}>Commit to Ledger</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.dangerZone}>
            {isDeleting ? (
              <ActivityIndicator
                color="#EF4444"
                style={{ marginVertical: 16 }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={() => signOut()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out" size={18} color={COLORS.white} />
                  <Text style={[styles.logoutText, { color: COLORS.white }]}>
                    Terminate Session
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                >
                  <Ionicons name="skull" size={18} color="#EF4444" />
                  <Text style={styles.deleteText}>Eradicate Data</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.grey,
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: { paddingBottom: 100 },

  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginBottom: 24,
    paddingTop: 60,
  },
  header: {},
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.grey,
    fontFamily: "JetBrainsMono-Medium",
  },

  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    marginBottom: 32,
  },
  avatarContainer: { position: "relative", marginRight: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarBorder: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primary,
    top: 0,
    left: 0,
  },
  badgeInfo: { flex: 1 },
  username: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },

  section: { marginBottom: 32, paddingHorizontal: 24 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 16,
  },

  statsGrid: { flexDirection: "row", gap: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.grey,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  stackContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langPill: {
    backgroundColor: COLORS.surfaceLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.2)",
  },
  langDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  langText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  emptyStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    backgroundColor: "rgba(202, 138, 4, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(202, 138, 4, 0.3)",
  },
  emptyStackText: { color: COLORS.secondary, fontSize: 13, fontWeight: "600" },

  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(234, 179, 8, 0.05)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.2)",
    gap: 16,
  },
  lockedInfo: { flex: 1 },
  lockedLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  lockedValue: { fontSize: 16, color: COLORS.white, fontWeight: "800" },

  formGroup: {},
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.grey,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: { padding: 16, color: COLORS.white, fontSize: 15, fontWeight: "600" },
  updateButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.5 },
  updateButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  dangerZone: {
    marginHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(239, 68, 68, 0.2)",
    paddingTop: 32,
    gap: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  logoutText: { fontSize: 14, fontWeight: "800", textTransform: "uppercase" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    gap: 10,
  },
  deleteText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  repoCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  repoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  repoName: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: "800" },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  starText: { color: COLORS.background, fontSize: 11, fontWeight: "900" },
  repoDesc: { color: COLORS.grey, fontSize: 13, lineHeight: 18 },
});
