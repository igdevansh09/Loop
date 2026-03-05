import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

// Required for Expo WebBrowser to handle the OAuth redirect
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_github" });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Continuous rotation for the icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const handleGitHubLogin = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(tabs)", { scheme: "myapp" }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("OAuth flow failed", err);
    }
  }, [startOAuthFlow]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Animated background circles */}
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle1,
          {
            transform: [{ rotate: spin }],
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle2,
          {
            transform: [{ rotate: spin }],
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.08],
            }),
          },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo/Icon with glow effect */}
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow}>
            <Ionicons name="terminal" size={64} color={COLORS.primary} />
          </View>
        </View>

        {/* Title with gradient text effect */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Loop</Text>
          <View style={styles.titleUnderline} />
        </View>

        <Text style={styles.subtitle}>Skill-Gated Matchmaking Engine</Text>

        {/* Feature pills */}
        <View style={styles.featureContainer}>
          <View style={styles.featurePill}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.featureText}>GitHub Verified</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="flash" size={16} color={COLORS.primary} />
            <Text style={styles.featureText}>AI-Powered</Text>
          </View>
        </View>

        {/* Warning with animated border */}
        <View style={styles.warningCard}>
          <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
          <Text style={styles.warningText}>
            Authentication strictly requires GitHub OAuth
          </Text>
        </View>

        {/* Animated login button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleGitHubLogin}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons
                name="logo-github"
                size={24}
                color={COLORS.background}
              />
              <Text style={styles.authButtonText}>Continue with GitHub</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={COLORS.background}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecoration}>
          <View style={styles.decorationLine} />
          <Text style={styles.decorationText}>Secure • Private • Fast</Text>
          <View style={styles.decorationLine} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: 24,
  },
  bgCircle: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  bgCircle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    left: -width * 0.25,
  },
  bgCircle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.4,
    right: -width * 0.3,
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGlow: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 56,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -2,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.grey,
    marginBottom: 32,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  featureContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  featureText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
    marginBottom: 40,
    maxWidth: "100%",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    lineHeight: 20,
  },
  authButton: {
    width: width - 48,
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
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  authButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bottomDecoration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 48,
  },
  decorationLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  decorationText: {
    color: COLORS.surfaceLight,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
