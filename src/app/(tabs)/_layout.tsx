import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useAuthStore } from "../../store/useAuthStore";
import { COLORS } from "../../constants/theme";
import { useLedgerStore } from "../../store/useLedgerStore";
import { useEffect } from "react";

export default function TabLayout() {
  const { session, isInitialized, user } = useAuthStore();

  // 🚀 Pull the arrays and the fetch function
  const { inbound, outbound, fetchLedger } = useLedgerStore();

  // Fetch the latest ledger data when the layout mounts so badges are accurate
  useEffect(() => {
    if (user) {
      fetchLedger(user.id);
    }
  }, [user]);

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

      {/* 🚀 THE SPLIT: INBOUND (Recruiting) */}
      <NativeTabs.Trigger name="inbound">
        <NativeTabs.Trigger.Icon
          sf="tray.and.arrow.down.fill"
          md="move_to_inbox"
        />
        <NativeTabs.Trigger.Label>Inbound</NativeTabs.Trigger.Label>

        {inbound?.length > 0 && (
          <NativeTabs.Trigger.Badge>
            {String(inbound.length)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      {/* 🚀 THE SPLIT: OUTBOUND (Applying) */}
      <NativeTabs.Trigger name="outbound">
        <NativeTabs.Trigger.Icon sf="location.north.fill" md="near_me" />
        <NativeTabs.Trigger.Label>Outbound</NativeTabs.Trigger.Label>

        {outbound?.length > 0 && (
          <NativeTabs.Trigger.Badge >
            {String(outbound.length)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.fill" md="fingerprint" />
        <NativeTabs.Trigger.Label>Truth</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
