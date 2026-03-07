import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useAuthStore } from "../../store/useAuthStore";
import { COLORS } from "../../constants/theme";

export default function TabLayout() {
  const { session, isInitialized } = useAuthStore();

  if (!isInitialized) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <NativeTabs
      backgroundColor={COLORS.background}
      iconColor={COLORS.grey}
      tintColor={COLORS.primary}
      indicatorColor="transparent"
      labelStyle={{ fontSize: 12, fontWeight: "bold" }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="square.stack.3d.up.fill" md="swipe" />
        <NativeTabs.Trigger.Label>Arena</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
        <NativeTabs.Trigger.Label>Launch</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="matches">
        <NativeTabs.Trigger.Icon sf="bolt.fill" md="flash_on" />
        <NativeTabs.Trigger.Label>Ledger</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.fill" md="fingerprint" />
        <NativeTabs.Trigger.Label>Truth</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
