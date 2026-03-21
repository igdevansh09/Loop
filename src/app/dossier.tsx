import React, { useState, useEffect } from "react";
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
import { supabase } from "../lib/supabase";

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
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [isExpunged, setIsExpunged] = useState(false);

  // 🚀 NEW SECURITY STATES
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);
  const [isFounder, setIsFounder] = useState(false);

  const [dossier, setDossier] = useState<any>(null);

  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    match?: string;
    description?: string;
    skills?: string;
    founder?: string;
    college?: string;
    founder_college?: string;
    hackathon_url?: string;
    capacity?: string;
    gender?: string;
  }>();

  useEffect(() => {
    if (!params.id) return;

    const fetchIntel = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 🚀 BOUNCER CHECK 1: Ghost User (Unauthenticated)
        if (!user) {
          setIsUnauthenticated(true);
          setIsDecrypting(false);
          return;
        }

        const { data, error } = await supabase.rpc("get_dossier_with_match", {
          p_team_id: params.id,
          p_user_id: user.id,
        });

        if (!error && data && data.length > 0) {
          const team = data[0];

          // 🚀 BOUNCER CHECK 2: Is this the Founder opening their own link?
          if (team.founder_id === user.id) {
            setIsFounder(true);
          }

          setDossier({
            name: team.project_name,
            description: team.project_description,
            skills: team.required_skills,
            college: team.required_college,
            founder: team.founder_github,
            hackathon_url: team.hackathon_url,
            capacity: team.max_capacity?.toString() || "ANY",
            gender: team.required_gender || "ANY",
            founder_college: params.founder_college || "UNKNOWN",
            match: Math.round(team.match_score * 100).toString(),
          });
          setIsDecrypting(false);
          return;
        } else {
          throw new Error("Data missing");
        }
      } catch (err) {
        setIsExpunged(true);
        setIsDecrypting(false);
      }
    };

    if (params.name && params.description) {
      setDossier({
        name: params.name,
        description: params.description,
        skills: params.skills,
        college: params.college,
        founder: params.founder,
        founder_college: params.founder_college,
        match: params.match,
        hackathon_url: params.hackathon_url,
        capacity: params.capacity || "ANY",
        gender: params.gender || "ANY",
      });
      setIsDecrypting(false);

      // Still run background check to verify founder status if navigating from feed
      fetchIntel();
    } else {
      fetchIntel();
    }
  }, [params.id]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleApply = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsTransmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsTransmitting(false);
    }
  };

  // --------------------------------------------------------
  // 🛡️ SECURITY STATE RENDERERS
  // --------------------------------------------------------
  if (isUnauthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="lock-closed-outline" size={64} color={COLORS.primary} />
        <Text style={styles.errorTitle}>ACCESS DENIED</Text>
        <Text style={styles.errorSub}>
          UNAUTHORIZED ENTITY DETECTED. LOGIN REQUIRED TO DECRYPT INTEL.
        </Text>
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.replace("/login")} // 🚀 Adjust this to your actual login route
        >
          <Text style={styles.returnText}>AUTHENTICATE NOW</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isExpunged) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="warning-outline" size={64} color="red" />
        <Text style={styles.errorTitle}>DATA CORRUPTED</Text>
        <Text style={styles.errorSub}>
          INTEL EXPUNGED OR DELETED BY FOUNDER
        </Text>
        <TouchableOpacity style={styles.returnButton} onPress={handleClose}>
          <Text style={styles.returnText}>RETURN TO ARENA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDecrypting || !dossier) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>DECRYPTING INTEL...</Text>
      </View>
    );
  }

  const skillArray = dossier.skills
    ? dossier.skills.split(",").map((s: string) => s.trim())
    : [];
  const safeMatch =
    isNaN(Number(dossier.match)) && dossier.match !== "?" ? "0" : dossier.match;

  // --------------------------------------------------------
  // 🟢 MAIN RENDERER
  // --------------------------------------------------------
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${COLORS.primary}10`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

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
          {dossier.name}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <Text style={styles.kicker}>FOUNDER_INTEL //</Text>

          <TouchableOpacity
            style={styles.githubButton}
            onPress={() => {
              if (dossier?.founder)
                Linking.openURL(`https://github.com/${dossier.founder}`);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.githubRow}>
              <Ionicons name="logo-github" size={20} color={COLORS.primary} />
              <Text style={styles.handleText}>
                @{dossier.founder || "UNKNOWN"}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>VIEW SOURCE</Text>
            </View>
          </TouchableOpacity>

          {dossier.founder_college && (
            <>
              <View style={styles.dividerSmall} />
              <Text style={styles.kicker}>FOUNDER_COLLEGE //</Text>
              <View style={styles.originBox}>
                <Ionicons name="school-outline" size={16} color={COLORS.grey} />
                <Text style={styles.originText} numberOfLines={1}>
                  {dossier.founder_college.toUpperCase()}
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(350).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <Text style={styles.kicker}>TEAM_CONSTRAINTS //</Text>

          <View style={styles.originBox}>
            <Ionicons name="school-outline" size={16} color={COLORS.primary} />
            <Text
              style={[styles.originText, { color: COLORS.white }]}
              numberOfLines={1}
            >
              {dossier.college?.toUpperCase() === "ANY"
                ? "ANY_COLLEGE"
                : dossier.college?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.dividerSmall} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[styles.originBox, { flex: 1 }]}>
              <Ionicons
                name="people-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={[styles.originText, { color: COLORS.white }]}>
                MAX: {dossier.capacity}
              </Text>
            </View>
            <View style={[styles.originBox, { flex: 1 }]}>
              <Ionicons
                name="male-female-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={[styles.originText, { color: COLORS.white }]}>
                {dossier.gender?.toUpperCase()}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <Text style={styles.kicker}>REQUIRED_STACK //</Text>
          <View style={styles.skillsContainer}>
            {skillArray.map((skill: string, index: number) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={styles.hudBox}
        >
          <CornerBrackets />
          <Text style={styles.kicker}>MISSION_BRIEFING //</Text>
          <Text style={styles.description}>{dossier.description}</Text>
          <TouchableOpacity
            style={styles.hackathonButton}
            onPress={() => {
              Linking.openURL(dossier?.hackathon_url || "https://devpost.com");
            }}
          >
            <Ionicons name="globe-outline" size={14} color={COLORS.primary} />
            <Text style={styles.hackathonText}>VIEW HACKATHON DIRECTIVE</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 🚀 SMART RENDERER: Disables application if you are the Founder */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          {isFounder ? (
            <View style={styles.founderBadge}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.founderBadgeText}>
                COMMANDER // THIS IS YOUR PROTOCOL
              </Text>
            </View>
          ) : (
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
                  <Text style={styles.applyText}>
                    REQUEST CLEARANCE // APPLY
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>

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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
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

  hackathonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 4,
    gap: 8,
  },
  hackathonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },

  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 4,
    marginTop: 10,
    gap: 12,
  },
  applyButtonActive: { backgroundColor: COLORS.grey },
  applyText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  // 🚀 FOUNDER STATE STYLE
  founderBadge: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 4,
    marginTop: 10,
    gap: 12,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  founderBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  loadingText: {
    color: COLORS.primary,
    marginTop: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 2,
  },
  errorTitle: {
    color: "red",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 20,
    letterSpacing: 2,
  },
  errorSub: {
    color: COLORS.grey,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  returnButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  returnText: { color: COLORS.primary, fontWeight: "900", letterSpacing: 1 },

  eofContainer: { marginTop: 40, alignItems: "center" },
  eofText: {
    color: "rgba(255, 255, 255, 0.2)",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    letterSpacing: 3,
  },
});
