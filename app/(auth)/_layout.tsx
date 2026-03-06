import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/theme";
import { View } from "react-native";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Prevent rendering until Clerk is ready
  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  // The Bouncer: If signed in, physically prevent access to auth screens
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
