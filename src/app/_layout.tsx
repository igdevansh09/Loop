import { useEffect } from "react";
import { Stack, useRouter, Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as Notifications from "expo-notifications";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";

// 🚀 FIXED: Replaced legacy 'shouldShowAlert' with modern Banner and List properties
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
  const { registerDeviceToken } = useAuthStore();

  useEffect(() => {
    // 1. Establish System Background Identity
    SystemUI.setBackgroundColorAsync(COLORS.background);

    // 2. Sync Push Token on Auth State Change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // If a session exists, sync the token to the database
      if (session) {
        registerDeviceToken();
      }
    });

    // 3. Listen for Physical Notification Taps
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          const data = response.notification.request.content.data;

          // 🚀 ROUTING PROTOCOL: If the payload contains a route, jump to it
          if (data && typeof data.route === "string") {
            console.log(`ROUTING PROTOCOL: Executing jump to /${data.route}`);
            // Cast to Href to satisfy Expo Router's strict TypeScript checks
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
        {/* The Traffic Cop */}
        <Stack.Screen name="index" />

        {/* The High-End Introduction */}
        <Stack.Screen name="onboarding" />

        {/* The Authentication Flow */}
        <Stack.Screen name="(auth)" />

        {/* The Main Application (Protected) */}
        <Stack.Screen name="(tabs)" />

        {/* 👇 Tells the router to treat the dossier screen as a slide-up modal */}
        <Stack.Screen
          name="dossier"
          options={{ presentation: "modal", headerShown: false }}
        />

        {/* 👇 Added CommandCenter as a standard pushed screen */}
        <Stack.Screen name="command-center" />
      </Stack>
    </>
  );
}
