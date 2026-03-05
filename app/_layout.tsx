import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

// 1. Freeze the UI at the OS level immediately upon launch
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

if (!publishableKey) throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
if (!convexUrl) throw new Error("Missing EXPO_PUBLIC_CONVEX_URL");

const convex = new ConvexReactClient(convexUrl);

function AuthObserver() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 1. New State to track first launch
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  // 2. Read the device storage on boot
  useEffect(() => {
    AsyncStorage.getItem("hasSeenDevSyncOnboarding").then((value) => {
      setIsFirstLaunch(value !== "true");
    });
  }, []);

  useEffect(() => {
    // Wait until BOTH Clerk and AsyncStorage have finished loading
    if (!isLoaded || isFirstLaunch === null) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inOnboarding = segments[0] === "onboarding";

    if (isFirstLaunch && !inOnboarding) {
      // Intercept: They have never seen the manifesto.
      router.replace("/onboarding");
    } else if (!isFirstLaunch) {
      // Normal Flow: The manifesto is acknowledged. Evaluate Auth.
      if (isSignedIn && !inTabsGroup) {
        router.replace("/(tabs)");
      } else if (!isSignedIn && inTabsGroup) {
        router.replace("/(auth)/login");
      }
    }

    // Drop the OS splash screen curtain
    SplashScreen.hideAsync();
  }, [isSignedIn, isLoaded, segments, isFirstLaunch]);

  // Freeze the UI until memory states are verified
  if (!isLoaded || isFirstLaunch === null) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthObserver />
        <StatusBar style="light" />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}