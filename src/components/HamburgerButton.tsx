import React from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../constants/theme";

export default function HamburgerButton() {
  const navigation = useNavigation();

  const openMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={openMenu}
      activeOpacity={0.8}
    >
      <Ionicons name="menu" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40, 
    left: 20,
    zIndex: 999, 
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
    padding: 10,
    borderRadius: 8,
    marginTop: 30,
  },
});
