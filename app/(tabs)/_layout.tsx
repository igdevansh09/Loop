import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { COLORS } from "@/constants/theme";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Query Convex for the user
  const currentUser = useQuery(api.users.getCurrentUser, {
    clerkId: user?.id,
  });

  const syncUser = useMutation(api.users.syncUser);

  // THE RESYNC ENGINE: If Clerk knows you, but Convex doesn't, rebuild the DB record.
  useEffect(() => {
    if (isLoaded && isSignedIn && user && currentUser === null) {
      syncUser({
        clerkId: user.id,
        githubUsername:
          user.externalAccounts[0]?.username || user.firstName || "Unknown",
        avatarUrl: user.imageUrl,
      }).catch(console.error);
    }
  }, [isLoaded, isSignedIn, user, currentUser, syncUser]);

  // Block rendering while Clerk loads, or while Convex is fetching/syncing
  if (
    !isLoaded ||
    currentUser === undefined ||
    (isSignedIn && currentUser === null)
  ) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // If not signed in, kick to login
  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <NativeTabs
      backgroundColor={COLORS.background}
      iconColor={COLORS.grey}
      tintColor={COLORS.primary}
      indicatorColor="transparent"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="terminal.fill" md="terminal" />
        <NativeTabs.Trigger.Label>Feed</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
        <NativeTabs.Trigger.Label>Create Node</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
        <NativeTabs.Trigger.Label>Ledger</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
