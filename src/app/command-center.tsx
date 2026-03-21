import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { useLedgerStore } from "../store/useLedgerStore";

// --- 1. TYPES & INTERFACES ---
interface MissionTeam {
  id: string;
  project_name: string;
  max_capacity: number;
  is_active: boolean;
  accepted_count: { count: number }[];
}

interface LocalCapacities {
  [key: string]: string;
}

// --- 2. HUD COMPONENTS ---
const CornerBrackets = ({ color = COLORS.primary }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
  </View>
);

export default function CommandCenterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    myTeams,
    fetchMyTeams,
    triggerKillswitch,
    updateCapacity,
    isLoading,
  } = useLedgerStore();

  const [localCapacities, setLocalCapacities] = useState<LocalCapacities>({});

  // Sync with Satellite on Mount
  useEffect(() => {
    if (user?.id) {
      fetchMyTeams(user.id);
    }
  }, [user?.id]);

  // --- 3. ACTION HANDLERS ---

  const handleUpdateCap = (teamId: string, currentName: string) => {
    const rawVal = localCapacities[teamId];
    const newCap = parseInt(rawVal);

    if (isNaN(newCap) || newCap < 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("DATA_ERROR", "Target capacity must be a positive integer.");
      return;
    }

    Alert.alert(
      "CONFIRM_CAPACITY_SHIFT",
      `Adjust ${currentName.toUpperCase()} capacity to ${newCap} units?`,
      [
        { text: "ABORT", style: "cancel" },
        {
          text: "EXECUTE",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await updateCapacity(teamId, newCap);
            setLocalCapacities({ ...localCapacities, [teamId]: "" }); // Clear input
          },
        },
      ],
    );
  };

  const handleKill = (teamId: string, name: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "TERMINATE MISSION",
      `CRITICAL: Terminating ${name.toUpperCase()} will reject all pending applicants and remove the signal from the Arena permanently.`,
      [
        { text: "ABORT", style: "cancel" },
        {
          text: "CONFIRM_KILL",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            triggerKillswitch(teamId);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${COLORS.primary}15`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>BACK_TO_DOSSIER</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>COMMAND_CENTER // STATUS_ACTIVE</Text>
        <Text style={styles.header}>MISSIONS</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && myTeams.length === 0 ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loaderText}>SCANNING_FREQUENCIES...</Text>
          </View>
        ) : myTeams.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="radio-outline"
              size={48}
              color="rgba(255,255,255,0.1)"
            />
            <Text style={styles.emptyText}>NO_ACTIVE_MISSIONS_FOUND</Text>
          </View>
        ) : (
          myTeams.map((team: MissionTeam, index: number) => {
            const acceptedCount = team.accepted_count?.[0]?.count || 0;
            const isActive = team.is_active;

            // 🚀 Logic: Highlight red if capacity is dangerously low
            const isOverCapacity = acceptedCount > team.max_capacity;
            const statusColor = isActive ? COLORS.primary : "#ef4444";

            return (
              <Animated.View
                key={team.id}
                entering={FadeInDown.delay(index * 100).springify()}
                style={[styles.teamCard, !isActive && styles.deenergizedCard]}
              >
                <CornerBrackets />

                {/* CARD HEADER */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teamKicker, { color: statusColor }]}>
                      {isActive ? "MISSION_TARGET //" : "MISSION_VOID //"}
                    </Text>
                    <Text
                      style={[
                        styles.teamName,
                        !isActive && { color: COLORS.grey },
                      ]}
                    >
                      {team.project_name.toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isActive
                          ? `${COLORS.primary}15`
                          : "rgba(239,68,68,0.1)",
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {isActive ? "LIVE_UPLINK" : "TERMINATED"}
                    </Text>
                  </View>
                </View>

                {/* TELEMETRY ROW */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>HEADCOUNT_SYNC</Text>
                    <Text
                      style={[
                        styles.statValue,
                        isOverCapacity && { color: "#ef4444" },
                      ]}
                    >
                      {acceptedCount} / {team.max_capacity}
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>CAPACITY_OVERRIDE</Text>
                    <View style={styles.capInputRow}>
                      <TextInput
                        style={styles.capInput}
                        keyboardType="numeric"
                        placeholder={team.max_capacity.toString()}
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={localCapacities[team.id] || ""}
                        onChangeText={(val) =>
                          setLocalCapacities({
                            ...localCapacities,
                            [team.id]: val,
                          })
                        }
                      />
                      <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={() =>
                          handleUpdateCap(team.id, team.project_name)
                        }
                      >
                        <Ionicons
                          name="cloud-upload-outline"
                          size={16}
                          color={COLORS.background}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* KILLSWITCH ACTION */}
                <TouchableOpacity
                  style={[
                    styles.killButton,
                    !isActive && styles.killButtonDisabled,
                  ]}
                  onPress={() => handleKill(team.id, team.project_name)}
                  disabled={!isActive}
                >
                  <Ionicons
                    name={isActive ? "skull-outline" : "lock-closed-outline"}
                    size={16}
                    color={isActive ? "#ef4444" : COLORS.grey}
                  />
                  <Text
                    style={[
                      styles.killText,
                      !isActive && { color: COLORS.grey },
                    ]}
                  >
                    {isActive ? "TERMINATE MISSION" : "SIGNAL_VOID"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { paddingTop: 60, paddingHorizontal: 16, marginBottom: 20 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
  },
  header: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Card Styles
  teamCard: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 20,
    marginBottom: 16,
    position: "relative",
  },
  deenergizedCard: {
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.02)",
  },
  corner: { position: "absolute", width: 10, height: 10 },
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

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  teamKicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  teamName: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    gap: 4,
  },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },

  // Telemetry Section
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statItem: { flex: 1 },
  statLabel: {
    color: COLORS.grey,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  verticalDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 15,
  },

  capInputRow: { flexDirection: "row", gap: 8 },
  capInput: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: COLORS.white,
    paddingHorizontal: 8,
    height: 40,
    width: 60,
    fontSize: 14,
    fontWeight: "900",
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  // Action Buttons
  killButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  killButtonDisabled: {
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "transparent",
  },
  killText: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // States
  loaderBox: { padding: 40, alignItems: "center" },
  loaderText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 15,
    letterSpacing: 2,
  },
  emptyBox: { padding: 60, alignItems: "center", opacity: 0.5 },
  emptyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 20,
    letterSpacing: 1,
  },
});
