import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/theme";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenDevSyncOnboarding").then((value) => {
      setIsFirstLaunch(value !== "true");
    });
  }, []);

  // Show your terminal loader while calculating the route
  if (!isLoaded || isFirstLaunch === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          Initializing secure connection...
        </Text>
      </View>
    );
  }

  // The Switchboard
  if (isFirstLaunch) return <Redirect href="/onboarding" />;
  if (isSignedIn) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.grey,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
