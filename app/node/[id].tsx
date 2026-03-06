import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NodeCard from "@/components/NodeCard";

export default function SharedNodeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { userId: clerkId } = useAuth();

  const currentUser = useQuery(api.users.getCurrentUser, {
    clerkId: clerkId ?? undefined,
  });
  const requirement = useQuery(api.requirements.getRequirementById, {
    requirementId: id as any,
  });
  const applyMutation = useMutation(api.applications.apply);

  // Cinematic screen entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Radar pulse for the loading state
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Fade the entire screen in smoothly over 500ms
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Infinite pulse for the loading text
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleApply = async () => {
    if (!currentUser) {
      Alert.alert(
        "Authentication Required",
        "Your profile is still syncing or you need to initialize a session.",
      );
      return;
    }

    try {
      await applyMutation({
        requirementId: id as any,
        applicantId: currentUser._id,
      });
      Alert.alert("✓ Sync Executed", "Application securely transmitted.", [
        { text: "Enter Network", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Execution Failed", error.message || "Could not apply.");
    }
  };

  if (requirement === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Animated.Text style={[styles.loadingText, { opacity: pulseAnim }]}>
          Decrypting node coordinates...
        </Animated.Text>
      </View>
    );
  }

  if (requirement === null) {
    return (
      <Animated.View style={[styles.center, { opacity: fadeAnim }]}>
        <Ionicons name="warning" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Node Terminated</Text>
        <Text style={styles.errorSubtext}>
          This requirement has been scrubbed from the ledger or capacity was
          reached.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Return to Network</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={["rgba(234, 179, 8, 0.1)", "transparent"]}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Isolated Node</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* The NodeCard handles its own internal entrance animations */}
        <NodeCard item={requirement} index={0} onApply={handleApply} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: COLORS.primary,
    marginTop: 24,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerBackBtn: {
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },

  content: { padding: 20 },

  errorText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    color: COLORS.grey,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 14,
    textTransform: "uppercase",
  },
});
