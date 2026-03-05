import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

// Required for Expo WebBrowser to handle the OAuth redirect
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_github" });

  const handleGitHubLogin = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(tabs)", { scheme: "myapp" }), // Ensure this matches your app.json scheme
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("OAuth flow failed", err);
    }
  }, [startOAuthFlow]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="terminal" size={48} color={COLORS.primary} style={styles.icon} />
        <Text style={styles.title}>DevSync</Text>
        <Text style={styles.subtitle}>Skill-Gated Matchmaking Engine.</Text>
        <Text style={styles.warning}>Authentication strictly requires GitHub.</Text>
      </View>

      <TouchableOpacity 
        style={styles.authButton} 
        onPress={handleGitHubLogin}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-github" size={24} color={COLORS.background} style={styles.buttonIcon} />
        <Text style={styles.authButtonText}>Continue with GitHub</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Pure black
    justifyContent: "center",
    padding: 24,
  },
  header: {
    marginBottom: 48,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.grey,
    marginTop: 8,
  },
  warning: {
    fontSize: 14,
    color: COLORS.primary, // Using your electric yellow for high-contrast alerts
    marginTop: 16,
    fontWeight: "bold",
  },
  authButton: {
    backgroundColor: COLORS.primary, // Electric yellow button
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 12,
  },
  authButtonText: {
    color: COLORS.background, // Black text on yellow background for maximum readability
    fontSize: 18,
    fontWeight: "700",
  },
});