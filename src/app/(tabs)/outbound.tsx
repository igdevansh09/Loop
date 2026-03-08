import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useLedgerStore } from "../../store/useLedgerStore";
import { OutboundCard } from "../../components/OutboundCard";

export default function OutboundScreen() {
  const { user } = useAuthStore();
  const { outbound, isLoading, fetchLedger, updateRequest } = useLedgerStore();

  useEffect(() => {
    if (user) fetchLedger(user.id);
  }, [user]);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) fetchLedger(user.id);
  };

  return (
    <View style={styles.container}>
      {/* Deep Atmospheric Glow */}
      <LinearGradient
        colors={[`${COLORS.primary}10`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* Static Header */}
      <View style={styles.headerContainer}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.kicker}>PROTOCOL // OUT</Text>
          <Text style={styles.headerTitle}>OUTBOUND</Text>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {outbound.length > 0 ? (
          outbound.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 100)}
            >
              <OutboundCard item={item} onAction={updateRequest} />
            </Animated.View>
          ))
        ) : (
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.emptyState}
          >
            <Text style={styles.emptyText}>NO OUTBOUND TRANSMISSIONS</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // 16px Gutter Standard
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
  headerTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
    textTransform: "uppercase",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },

  // Brutalist Empty State
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
