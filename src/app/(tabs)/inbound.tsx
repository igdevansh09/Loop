import React, { useEffect, useState } from "react";
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
import { InboundCard } from "../../components/InboundCard";
import { ApplicantModal } from "../../components/ApplicantModal";

interface IntelPayload {
  id: string;
  profiles: {
    github_handle: string;
    training_ground: string;
    ai_assessment: string;
  };
  teams: {
    project_name: string;
  };
}

export default function InboundScreen() {
  const { user } = useAuthStore();
  const [selectedIntel, setSelectedIntel] = useState<IntelPayload | null>(null);
  const { inbound, isLoading, fetchLedger, updateRequest } = useLedgerStore();

  useEffect(() => {
    if (user) fetchLedger(user.id);
  }, [user]);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) fetchLedger(user.id);
  };

  // 🚀 THE BLAST SHIELD: Pre-filter the array to purge any malformed or ghost data
  // This guarantees the app will NEVER crash trying to read missing properties.
  const validInbound = inbound.filter(
    (item) => item && item.profiles && item.teams,
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${COLORS.primary}10`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <View style={styles.headerContainer}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.kicker}>PROTOCOL // IN</Text>
          <Text style={styles.headerTitle}>INBOUND</Text>
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
        {validInbound.length > 0 ? (
          validInbound.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 100)}
            >
              <InboundCard
                item={item}
                onAction={updateRequest}
                onOpenModal={() => setSelectedIntel(item)}
              />
            </Animated.View>
          ))
        ) : (
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.emptyState}
          >
            <Text style={styles.emptyText}>NO INCOMING SIGNALS DETECTED</Text>
          </Animated.View>
        )}
      </ScrollView>

      <ApplicantModal
        visible={!!selectedIntel}
        applicant={selectedIntel}
        onClose={() => setSelectedIntel(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  emptyState: { marginTop: 60, alignItems: "center", justifyContent: "center" },
  emptyText: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
