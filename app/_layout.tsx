import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

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

  // Load your custom font here
  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  useEffect(() => {
    // Wait until BOTH Clerk and Fonts are fully ready
    if (!isLoaded || !fontsLoaded) return;

    const inTabsGroup = segments[0] === "(tabs)";

    if (isSignedIn && !inTabsGroup) {
      router.replace("/(tabs)");
    } else if (!isSignedIn && inTabsGroup) {
      router.replace("/(auth)/login");
    }

    // 2. The routing decision is made and fonts are ready. Drop the curtain.
    SplashScreen.hideAsync();
  }, [isSignedIn, isLoaded, fontsLoaded, segments]);

  // 3. Mount absolutely nothing until the state is resolved.
  if (!isLoaded || !fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
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