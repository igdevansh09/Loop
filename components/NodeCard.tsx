import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  Share,
} from "react-native";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLinking from "expo-linking";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function NodeCard({
  item,
  index,
  onApply,
}: {
  item: any;
  index: number;
  onApply: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleShare = async () => {
    try {
      // Creates a link like: loop://node/123456789
      const url = ExpoLinking.createURL(`node/${item._id}`);

      const message = `🚀 ${item.creator.githubUsername} is recruiting for: ${item.title}\n\nCapacity: ${item.capacity} slot(s)\nTech: ${item.techStack.slice(0, 3).join(", ")}\n\nApply via Loop: ${url}`;

      await Share.share({
        message: message,
        url: url, // iOS uses this field specifically
        title: "Join my node on Loop",
      });
    } catch (error: any) {
      console.error("Share failed:", error.message);
    }
  };

  const openGitHubProfile = () => {
    const username = item.creator.githubUsername;
    if (username && username !== "Unknown") {
      Linking.openURL(`https://github.com/${username}`);
    }
  };

  const bullets = item.descriptionBullets || [];
  const MAX_VISIBLE_BULLETS = 2;
  const showToggle = bullets.length > MAX_VISIBLE_BULLETS;
  const visibleBullets = isExpanded
    ? bullets
    : bullets.slice(0, MAX_VISIBLE_BULLETS);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={["rgba(234, 179, 8, 0.08)", "transparent"]}
          style={styles.cardAccent}
        />

        {/* TOP HEADER: Only strict project data and constraints go here now */}
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={isExpanded ? undefined : 2}>
            {item.title}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.capacityBadge}>
              <Ionicons name="people" size={12} color={COLORS.primary} />
              <Text style={styles.capacityText}>
                {item.capacity} Slot{item.capacity > 1 ? "s" : ""} Open
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bulletContainer}>
          {visibleBullets.map((bullet: string, idx: number) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}

          {showToggle && (
            <TouchableOpacity onPress={toggleExpand} style={styles.toggleRow}>
              <Text style={styles.toggleText}>
                {isExpanded
                  ? "Collapse Constraints"
                  : `View ${bullets.length - MAX_VISIBLE_BULLETS} more constraints...`}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.techStackContainer}>
          {item.techStack.map((tech: string, idx: number) => (
            <View key={idx} style={styles.techBadge}>
              <Text style={styles.techText}>{tech}</Text>
            </View>
          ))}
        </View>

        {/* FOOTER: All Identity and Trust Network data lives here */}
        <View style={styles.footerRow}>
          <View style={styles.creatorBlock}>
            <TouchableOpacity
              style={styles.creatorInfo}
              onPress={openGitHubProfile}
              activeOpacity={0.6}
            >
              <Ionicons name="logo-github" size={16} color={COLORS.white} />
              <Text style={styles.creatorText}>
                {item.creator.githubUsername || "Anonymous"}
              </Text>
              <Ionicons name="open-outline" size={12} color={COLORS.grey} />
            </TouchableOpacity>

            {/* The College Affiliation is now clearly an attribute of the creator, not a node constraint */}
            {item.creator.collegeName && (
              <View style={styles.collegeContextRow}>
                <Ionicons name="school" size={12} color={COLORS.grey} />
                <Text style={styles.collegeContextText}>
                  Student at {item.creator.collegeName}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={onApply}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Execute Sync</Text>
            <Ionicons name="flash" size={14} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { marginBottom: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    overflow: "hidden",
  },
  cardAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 100 },
  cardHeader: { marginBottom: 16, zIndex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  capacityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
shareButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: "rgba(234, 179, 8, 0.1)", justifyContent: "center", alignItems: "center" },
  bulletContainer: { marginBottom: 20 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    marginTop: 6,
  },
  bulletText: { flex: 1, fontSize: 14, color: COLORS.grey, lineHeight: 20 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingVertical: 4,
  },
  toggleText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },

  techStackContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  techBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  techText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  creatorBlock: { flexDirection: "column", gap: 6, flex: 1 },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  creatorText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  collegeContextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 4,
  },
  collegeContextText: { color: COLORS.grey, fontSize: 11, fontWeight: "600" },

  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  applyButtonText: {
    color: COLORS.background,
    fontWeight: "800",
    fontSize: 13,
  },
});
