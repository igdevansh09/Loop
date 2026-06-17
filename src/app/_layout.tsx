import { useEffect } from "react";
import { Stack, useRouter, useSegments, Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as Notifications from "expo-notifications";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";
import { CustomAlert } from "../components/CustomAlert";
import { useNetworkStore } from "../store/useNetworkStore";
import { NetworkBanner } from "../components/NetworkBanner";

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

  const { registerDeviceToken, session, isInitialized } = useAuthStore();
  const initNetworkListener = useNetworkStore(
    (state) => state.initNetworkListener,
  );

  useEffect(() => {
    const unsubscribeNetwork = initNetworkListener();
    return () => {
      if (unsubscribeNetwork) unsubscribeNetwork();
    };
  }, [initNetworkListener]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(COLORS.background);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        registerDeviceToken();
      }
    });

    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          const data = response.notification.request.content.data;

          if (data && typeof data.route === "string") {
            router.push(`/${data.route}` as Href);
          }
        },
      );

    return () => {
      subscription.unsubscribe();
      responseListener.remove();
    };
  }, [registerDeviceToken, router]);

  useEffect(() => {
    if (!isInitialized) return;

    const routeSegments = segments as string[];
    const rootSegment = routeSegments[0];
    const inAuthGroup = rootSegment === "(auth)";
    const isIndexScreen = routeSegments.length === 0 || rootSegment === "index";

    if (session && (inAuthGroup || isIndexScreen)) {
      router.replace("/(drawer)/(tabs)" as Href);
    }
  }, [session, isInitialized, segments, router]);

  return (
    <>
      <StatusBar style="light" />
      <CustomAlert />
      <NetworkBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(drawer)" />
        <Stack.Screen
          name="dossier"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </>
  );
}
