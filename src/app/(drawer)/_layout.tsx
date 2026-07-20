import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useAlertStore } from "../../store/useAlertStore";
import * as Haptics from "expo-haptics";

function CustomDrawerContent(props: any) {
  const { signOut } = useAuthStore();
  const { showConfirm } = useAlertStore();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    showConfirm(
      "DISCONNECT",
      "Terminate current session?",
      "LOGOUT",
      () => signOut(),
      "warning",
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 40, paddingHorizontal: 10 }}
      >
        <View style={styles.drawerHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="terminal" size={20} color={COLORS.background} />
          </View>
          <View>
            <Text style={styles.kicker}>SYSTEM // OVERRIDE</Text>
            <Text style={styles.headerText}>COMMAND</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <DrawerItemList {...props} />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="power" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false, 
        drawerStyle: {
          backgroundColor: COLORS.background,
          borderRightWidth: 1,
          borderRightColor: "rgba(234, 179, 8, 0.2)",
          width: 280,
        },
        drawerActiveBackgroundColor: "rgba(234, 179, 8, 0.1)",
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.grey,
        drawerItemStyle: {
          borderRadius: 8,
          marginVertical: 4,
        },
        drawerLabelStyle: {
          fontSize: 12,
          fontWeight: "900",
          letterSpacing: 2,
          marginLeft: -10, 
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: " ARENA",
          drawerIcon: ({ color }) => (
            <Ionicons name="flash" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="command-center"
        options={{
          drawerLabel: " COMMAND CENTER",
          drawerIcon: ({ color }) => (
            <Ionicons name="people" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="outbound"
        options={{
          drawerLabel: " OUTBOUND LOGS",
          drawerIcon: ({ color }) => (
            <Ionicons name="paper-plane" size={18} color={color} />
          ),
        }}
          />
      <Drawer.Screen
        name="create"
        options={{
          drawerLabel: " CREATE POST",
          drawerIcon: ({ color }) => (
            <Ionicons name="create" size={18} color={color} />
          ),
        }}
          />
          
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 10,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    marginBottom: 15,
    marginTop: 20
  },
  iconBox: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 8,
  },
  kicker: {
    color: "#ef4444",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  menuContainer: {
    marginBottom: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
