import { Redirect } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../constants/theme";

export default function InitialRouting() {
  const { session, isInitialized, initializeAuth, hasSeenOnboarding } =
    useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // The 3-Way Routing Decision
  if (session) {
    return <Redirect href="/(tabs)" />; // Logged in? Go to Arena.
  } else if (hasSeenOnboarding) {
    return <Redirect href="/(auth)/login" />; // Been here before? Skip to Login.
  } else {
    return <Redirect href="/onboarding" />; // First time ever? Show the Pitch.
  }
}
