import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/theme";
import SwiperCard from "../../components/SwiperCard";
import { useAuthStore } from "../../store/useAuthStore";
import { useArenaStore } from "../../store/useArenaStore";

const { height } = Dimensions.get("window");

export default function ArenaScreen() {
  const { user, profile, generateAiProfile } = useAuthStore();
  const {
    teams,
    isLoading,
    isForging,
    setForging,
    fetchMatches,
    processSwipe,
  } = useArenaStore();

  useEffect(() => {
    if (!user || !profile) return;

    const bootArena = async () => {
      if (!profile.profile_embedding) {
        setForging(true);
        await generateAiProfile();
        setForging(false);
      } else {
        await fetchMatches(user.id);
      }
    };

    bootArena();
  }, [user, profile?.profile_embedding]);

  const handlePhysicalSwipe = (
    cardIndex: number,
    direction: "right" | "left",
  ) => {
    const team = teams[cardIndex];
    if (!team) return;

    if (direction === "right") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }

    processSwipe(user!.id, team.id, direction);
  };

  // --- 1. THE FORGE STATE (Smooth Fade) ---
  if (isForging) {
    return (
      <Animated.View
        entering={FadeIn.duration(600)}
        exiting={FadeOut}
        style={styles.center}
      >
        <LinearGradient
          colors={[`${COLORS.primary}20`, "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginBottom: 25 }}
        />
        <Text style={styles.loadingText}>EXTRACTING TELEMETRY...</Text>
        <Text style={styles.subText}>CALIBRATING VECTOR SIGNATURE</Text>
      </Animated.View>
    );
  }

  // --- 2. THE RADAR SCAN STATE (Smooth Fade) ---
  if (isLoading) {
    return (
      <Animated.View
        entering={FadeIn.duration(600)}
        exiting={FadeOut}
        style={styles.center}
      >
        <LinearGradient
          colors={[`${COLORS.primary}10`, "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons
          name="scan-outline"
          size={55}
          color={COLORS.primary}
          style={{ marginBottom: 20, opacity: 0.8 }}
        />
        <Text style={styles.loadingText}>SCANNING ARENA...</Text>
      </Animated.View>
    );
  }

  // --- 3. THE ARENA MAIN UI ---
  return (
    <View style={styles.container}>
      {/* Deep Atmospheric Glow */}
      <LinearGradient
        colors={[`${COLORS.primary}15`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* Kinetic Header */}
      <Animated.View
        entering={FadeInDown.delay(100).springify().damping(15)}
        style={styles.headerContainer}
      >
        <Text style={styles.kicker}>PROTOCOL // ACTIVE</Text>
        <Text style={styles.header}>THE ARENA</Text>
      </Animated.View>

      <View style={styles.swiperContainer}>
        {teams.length > 0 ? (
          <Animated.View
            entering={FadeIn.delay(300).duration(800)}
            style={{ flex: 1 }}
          >
            <Swiper
              cards={teams}
              renderCard={(card) => <SwiperCard card={card} />}
              onSwipedLeft={(index) => handlePhysicalSwipe(index, "left")}
              onSwipedRight={(index) => handlePhysicalSwipe(index, "right")}
              cardIndex={0}
              containerStyle={{ backgroundColor: "transparent", flex: 1 }}
              cardVerticalMargin={0}
              marginTop={10}
              stackSize={3}
              infinite={false}
              animateCardOpacity
              disableTopSwipe
              disableBottomSwipe
              overlayLabels={{
                left: {
                  title: "DISCARD",
                  style: {
                    label: {
                      backgroundColor: "rgba(239, 68, 68, 0.95)",
                      borderColor: "transparent",
                      color: COLORS.white,
                      borderWidth: 0,
                      fontSize: 28,
                      fontWeight: "900",
                      letterSpacing: 2,
                      transform: [{ rotate: "10deg" }], // Makes it look like a physical stamp
                    },
                    wrapper: {
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "flex-start",
                      marginTop: 40,
                      marginLeft: -30,
                    },
                  },
                },
                right: {
                  title: "APPLY",
                  style: {
                    label: {
                      backgroundColor: COLORS.primary,
                      borderColor: "transparent",
                      color: COLORS.background,
                      borderWidth: 0,
                      fontSize: 28,
                      fontWeight: "900",
                      letterSpacing: 2,
                      transform: [{ rotate: "-10deg" }], // Makes it look like a physical stamp
                    },
                    wrapper: {
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      marginTop: 40,
                      marginLeft: 30,
                    },
                  },
                },
              }}
            />
          </Animated.View>
        ) : (
          /* Smooth Layout Animation when cards run out */
          <Animated.View
            layout={Layout.springify()}
            entering={FadeInDown.delay(200).springify()}
            style={styles.emptyContainer}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={70}
              color={COLORS.primary}
              style={{ marginBottom: 20, opacity: 0.5 }}
            />
            <Text style={styles.noMore}>SECTOR CLEAR</Text>
            <Text style={styles.subText}>
              No more truth vectors detected. Check back later.
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // 🚀 ALIGNMENT LOCK: Changed paddingHorizontal from 24 to 16
  headerContainer: {
    paddingTop: 60,
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

  swiperContainer: {
    flex: 1,
    zIndex: 1,
    // Note: We leave paddingHorizontal off here so cards can
    // utilize the full width of the screen if needed
  },

  // 🚀 ALIGNMENT LOCK: Matched the 16px padding for loading/empty states
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -height * 0.15,
    paddingHorizontal: 16,
  },

  loadingText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  noMore: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subText: {
    color: COLORS.grey,
    marginTop: 12,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
    textAlign: "center",
    maxWidth: "85%", // Increased slightly for the wider 16px layout
    lineHeight: 20,
  },
});
