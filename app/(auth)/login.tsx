import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSSO, useAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const { isSignedIn, isLoaded } = useAuth();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // YOUR FIX: Lock the UI if actively authenticating OR already signed in
  const isRouting = isAuthenticating || isSignedIn;

  useEffect(() => {
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
      setIsAuthenticating(true);
      const redirectUri = Linking.createURL("/", { scheme: "loop" });
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_github",
        redirectUrl: redirectUri,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Do NOT set isAuthenticating to false. Let the redirect handle it.
      } else {
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.error("OAuth flow failed", err);
      setIsAuthenticating(false);
    }
  }, [startSSOFlow]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
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
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow}>
            <Ionicons name="terminal" size={64} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Loop</Text>
          <View style={styles.titleUnderline} />
        </View>

        <Text style={styles.subtitle}>Skill-Gated Matchmaking Engine</Text>

        <View style={styles.warningCard}>
          <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
          <Text style={styles.warningText}>
            Authentication strictly requires GitHub OAuth
          </Text>
        </View>

        <Animated.View
          style={{ transform: [{ scale: isRouting ? 1 : pulseAnim }] }}
        >
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleGitHubLogin}
            activeOpacity={0.9}
            disabled={isRouting || !isLoaded}
          >
            <LinearGradient
              colors={
                isRouting || !isLoaded
                  ? [COLORS.surfaceLight, COLORS.surfaceLight]
                  : [COLORS.primary, COLORS.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isRouting || !isLoaded ? (
                <>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                  <Text
                    style={[styles.authButtonText, { color: COLORS.primary }]}
                  >
                    {isSignedIn
                      ? "Routing to terminal node..."
                      : "Establishing Link..."}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="logo-github"
                    size={24}
                    color={COLORS.background}
                  />
                  <Text style={styles.authButtonText}>
                    Continue with GitHub
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={COLORS.background}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
  content: { alignItems: "center" },
  iconContainer: { marginBottom: 32 },
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
  titleContainer: { alignItems: "center", marginBottom: 12 },
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
  featureContainer: { flexDirection: "row", gap: 12, marginBottom: 32 },
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
  featureText: { color: COLORS.white, fontSize: 12, fontWeight: "600" },
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
  decorationLine: { flex: 1, height: 1, backgroundColor: COLORS.surfaceLight },
  decorationText: {
    color: COLORS.surfaceLight,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
