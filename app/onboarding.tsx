import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleAcknowledge = async () => {
    // Flag the device so this screen never appears again
    await AsyncStorage.setItem("hasSeenDevSyncOnboarding", "true");
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name="warning"
          size={48}
          color={COLORS.primary}
          style={styles.icon}
        />

        <Text style={styles.title}>System Rules</Text>

        <View style={styles.ruleBlock}>
          <Text style={styles.ruleNumber}>01</Text>
          <View>
            <Text style={styles.ruleTitle}>No Resumes.</Text>
            <Text style={styles.ruleText}>
              Your code is your only leverage. We do not care about your PDF.
            </Text>
          </View>
        </View>

        <View style={styles.ruleBlock}>
          <Text style={styles.ruleNumber}>02</Text>
          <View>
            <Text style={styles.ruleTitle}>Ruthless Auditing.</Text>
            <Text style={styles.ruleText}>
              Every application triggers an AI scan of your public GitHub
              repositories. If you lack the required stack, you will be exposed.
            </Text>
          </View>
        </View>

        <View style={styles.ruleBlock}>
          <Text style={styles.ruleNumber}>03</Text>
          <View>
            <Text style={styles.ruleTitle}>Secure Handoffs.</Text>
            <Text style={styles.ruleText}>
              Communication channels are strictly encrypted and only revealed
              upon application acceptance.
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleAcknowledge}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>I Understand</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between",
  },
  content: {
    padding: 32,
    paddingTop: 80,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.white,
    fontFamily: "JetBrainsMono-Medium",
    letterSpacing: -1,
    marginBottom: 48,
  },
  ruleBlock: {
    flexDirection: "row",
    marginBottom: 32,
    paddingRight: 20,
  },
  ruleNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    fontFamily: "JetBrainsMono-Medium",
    marginRight: 16,
    lineHeight: 28,
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    fontFamily: "JetBrainsMono-Medium",
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginHorizontal: 32,
    marginBottom: 40,
    borderRadius: 8,
    gap: 12,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "JetBrainsMono-Medium",
  },
});
