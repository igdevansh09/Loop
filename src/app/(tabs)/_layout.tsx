import { Redirect, Tabs } from "expo-router";
// 🚀 1. Switched from expo-symbols to Ionicons
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useLedgerStore } from "../../store/useLedgerStore";

// 🚀 2. Simplified the icon wrapper for Ionicons
function TabBarIcon({
  name,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return <Ionicons name={name} color={color} size={24} />;
}

export default function TabLayout() {
  const { session, isInitialized, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { inbound, fetchLedger } = useLedgerStore();

  useEffect(() => {
    if (user) {
      fetchLedger(user.id);
    }
  }, [user]);

  if (!isInitialized) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          borderTopColor: "rgba(255,255,255,0.05)", // Tactical separator line
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Arena",
          // 🚀 3. Replaced Apple specific icons with Universal Ionicons
          tabBarIcon: ({ color }) => <TabBarIcon name="layers" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Launch",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="add-circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbound"
        options={{
          title: "Inbound",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="arrow-down-circle" color={color} />
          ),
          tabBarBadge: inbound?.length > 0 ? String(inbound.length) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary,
            color: COLORS.background,
          },
        }}
      />
      <Tabs.Screen
        name="outbound"
        options={{
          title: "Outbound",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="arrow-up-circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Truth",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="finger-print" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
