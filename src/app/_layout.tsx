import { useEffect } from "react";
import { Stack, useRouter, useSegments, Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as Notifications from "expo-notifications";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";

// 🚀 FIXED: Modern Notification Handler configuration
Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  // 🚀 Pulling session and initialization state alongside the token register
  const { registerDeviceToken, session, isInitialized } = useAuthStore();

  useEffect(() => {
    // 1. Establish System Background Identity
    SystemUI.setBackgroundColorAsync(COLORS.background);

    // 2. Sync Push Token on Auth State Change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      // If a session exists, sync the token to the database
      if (currentSession) {
        registerDeviceToken();
      }
    });

    // 3. Listen for Physical Notification Taps
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          const data = response.notification.request.content.data;

          // ROUTING PROTOCOL: If the payload contains a route, jump to it
          if (data && typeof data.route === "string") {
            console.log(`ROUTING PROTOCOL: Executing jump to /${data.route}`);
            router.push(`/${data.route}` as Href);
          }
        },
      );

    // Cleanup listeners when layout unmounts
    return () => {
      subscription.unsubscribe();
      responseListener.remove();
    };
  }, [registerDeviceToken, router]);

  // 🚀 THE FIX: The Global Traffic Cop (Auth Guard)
  useEffect(() => {
    if (!isInitialized) return;

    // 🚀 Downcast the segments array to standard strings to satisfy strict TypeScript
    const routeSegments = segments as string[];
    const rootSegment = routeSegments[0];

    // Safely evaluate the strings
    const inAuthGroup = rootSegment === "(auth)";
    const isIndexScreen = routeSegments.length === 0 || rootSegment === "index";

    // If the user IS logged in, but they are stuck on the login screen or the root index
    if (session && (inAuthGroup || isIndexScreen)) {
      console.log("SESSION DETECTED: Rerouting to Arena //");
      router.replace("/(tabs)" as Href);
    }
  }, [session, isInitialized, segments, router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          // Smooth crossfade transitions between major app sections
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="dossier"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="command-center" />
      </Stack>
    </>
  );
}
