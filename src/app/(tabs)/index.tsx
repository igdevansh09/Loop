import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Swiper from "react-native-deck-swiper";
import * as Haptics from "expo-haptics";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants/theme";
import SwiperCard from "../../components/SwiperCard";
import { useAuthStore } from "../../store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";

export default function ArenaScreen() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("profile_embedding")
        .eq("id", user!.id)
        .single();

      if (userError || !userData?.profile_embedding) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("match_teams_for_user", {
        query_embedding: userData.profile_embedding,
        match_threshold: 0.3,
        match_count: 10,
        user_uuid: user!.id,
      });

      if (error) throw error;
      setTeams(data || []);
    } catch (err: any) {
      console.error("Match Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (
    cardIndex: number,
    direction: "right" | "left",
  ) => {
    const team = teams[cardIndex];

    if (direction === "right") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }

    supabase
      .from("swipes")
      .insert({
        swiper_id: user!.id,
        team_id: team.id,
        direction: direction,
      })
      .then(({ error }) => {
        if (error) console.error("Swipe logging failed:", error.message);
      });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="scan-outline"
          size={50}
          color={COLORS.primary}
          style={{ marginBottom: 20 }}
        />
        <Text style={styles.loadingText}>SCANNING VECTORS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🚀 FIXED: Added zIndex so the header always sits above the cards */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>THE ARENA</Text>
        <Text style={styles.subHeader}>LIVE FEED</Text>
      </View>

      {/* 🚀 FIXED: Wrapped Swiper in a flex container to push it below the header */}
      <View style={styles.swiperContainer}>
        {teams.length > 0 ? (
          <Swiper
            cards={teams}
            renderCard={(card) => <SwiperCard card={card} />}
            onSwipedLeft={(index) => handleSwipe(index, "left")}
            onSwipedRight={(index) => handleSwipe(index, "right")}
            cardIndex={0}
            // 🚀 FIXED: Override the library's absolute positioning
            containerStyle={{ backgroundColor: "transparent", flex: 1 }}
            cardVerticalMargin={0} // Removes the library's weird default margins
            marginTop={20} // Creates a clean gap between header and cards
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
                    backgroundColor: "rgba(239, 68, 68, 0.9)",
                    borderColor: "transparent",
                    color: COLORS.white,
                    borderWidth: 0,
                    fontSize: 32,
                    fontWeight: "900",
                  },
                  wrapper: {
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                    marginTop: 30,
                    marginLeft: -30,
                  },
                },
              },
              right: {
                title: "DEPLOY",
                style: {
                  label: {
                    backgroundColor: COLORS.primary,
                    borderColor: "transparent",
                    color: COLORS.background,
                    borderWidth: 0,
                    fontSize: 32,
                    fontWeight: "900",
                  },
                  wrapper: {
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    marginTop: 30,
                    marginLeft: 30,
                  },
                },
              },
            }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="radio-outline"
              size={60}
              color={COLORS.grey}
              style={{ marginBottom: 20 }}
            />
            <Text style={styles.noMore}>SECTOR CLEAR</Text>
            <Text style={styles.subText}>No more truth vectors detected.</Text>
          </View>
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
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 30,
    marginBottom: 10,
    zIndex: 10, // 🚀 Locks the header to the very top layer
  },
  header: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subHeader: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 4,
    marginTop: 4,
  },
  swiperContainer: {
    flex: 1, // 🚀 Forces the swiper to strictly live in the space beneath the header
    zIndex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -100, // Pulls the empty state up a bit visually
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
  },
  noMore: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
  },
  subText: {
    color: COLORS.grey,
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },
});
