import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";

// Required for Clerk Expo OAuth to return correctly to the app
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_github" });
  const [isLoading, setIsLoading] = useState(false);

  const handleGithubLogin = async () => {
    try {
      setIsLoading(true);
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // ClerkProvider in your _layout.tsx will detect the session and automatically route to (tabs)
      }
    } catch (err) {
      console.error("OAuth error:", err);
      // In production, show a Toast/Alert here. For now, check the console.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DevSync.</Text>
      <Text style={styles.subtitle}>Skill-gated matchmaking.</Text>

      <TouchableOpacity
        style={styles.githubButton}
        onPress={handleGithubLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.githubButtonText}>Continue with GitHub</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000", // Pitch black. No gradients. No background images.
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "JetBrainsMono-Medium", // Using the font already in your assets
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 64,
  },
  githubButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 4, // Sharp corners. Developers like terminals, not bubbles.
    width: "100%",
    alignItems: "center",
  },
  githubButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "JetBrainsMono-Medium",
  },
});
