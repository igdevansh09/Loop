import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../constants/theme";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(COLORS.background); // or COLORS.background
  }, []);
  
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
      </Stack>
    </>
  );
}
