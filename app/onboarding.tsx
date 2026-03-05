import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = [
    useRef(new Animated.Value(50)).current,
    useRef(new Animated.Value(50)).current,
    useRef(new Animated.Value(50)).current,
  ];
  const iconPulse = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.stagger(
        150,
        slideAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();

    // Icon pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Button breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleAcknowledge = async () => {
    await AsyncStorage.setItem("hasSeenDevSyncOnboarding", "true");
    // Small delay to ensure AsyncStorage write completes
    setTimeout(() => {
      router.replace("/(auth)/login");
    }, 100);
  };

  const rules = [
    {
      number: "01",
      title: "No Resumes.",
      text: "Your code is your only leverage. We do not care about your PDF.",
      icon: "document-text-outline" as const,
    },
    {
      number: "02",
      title: "Ruthless Auditing.",
      text: "Every application triggers an AI scan of your public GitHub repositories. If you lack the required stack, you will be exposed.",
      icon: "scan-outline" as const,
    },
    {
      number: "03",
      title: "Secure Handoffs.",
      text: "Communication channels are strictly encrypted and only revealed upon application acceptance.",
      icon: "shield-checkmark-outline" as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[styles.gradientCircle, styles.gradientCircle1]} />
        <View style={[styles.gradientCircle, styles.gradientCircle2]} />
      </View>

      <View style={styles.content}>
        {/* Animated warning icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: iconPulse }],
            },
          ]}
        >
          <View style={styles.iconGlow}>
            <Ionicons name="warning" size={56} color={COLORS.primary} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>System Rules</Text>
          <Text style={styles.subtitle}>Read carefully before proceeding</Text>
        </Animated.View>

        {/* Animated rule cards */}
        <View style={styles.rulesContainer}>
          {rules.map((rule, index) => (
            <Animated.View
              key={rule.number}
              style={[
                styles.ruleCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnims[index] }],
                },
              ]}
            >
              <View style={styles.ruleHeader}>
                <View style={styles.ruleNumberContainer}>
                  <Text style={styles.ruleNumber}>{rule.number}</Text>
                </View>
                <View style={styles.ruleIconContainer}>
                  <Ionicons name={rule.icon} size={24} color={COLORS.primary} />
                </View>
              </View>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleText}>{rule.text}</Text>
              <View style={styles.ruleAccent} />
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Animated CTA button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handleAcknowledge}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>I Understand</Text>
            <Ionicons
              name="arrow-forward"
              size={22}
              color={COLORS.background}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gradientCircle: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.05,
  },
  gradientCircle1: {
    width: width * 2,
    height: width * 2,
    backgroundColor: COLORS.primary,
    top: -width,
    left: -width * 0.5,
  },
  gradientCircle2: {
    width: width * 1.5,
    height: width * 1.5,
    backgroundColor: COLORS.secondary,
    bottom: -width * 0.5,
    right: -width * 0.5,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconGlow: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(234, 179, 8, 0.2)",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: "center",
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  rulesContainer: {
    gap: 20,
  },
  ruleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    position: "relative",
    overflow: "hidden",
  },
  ruleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ruleNumberContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ruleNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
  },
  ruleIconContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(234, 179, 8, 0.05)",
  },
  ruleTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  ruleText: {
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 22,
  },
  ruleAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40, // Increased to ensure button is visible
  },
  button: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
