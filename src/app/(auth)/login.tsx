import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  withRepeat,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "../../store/useAuthStore";
import { COLORS } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import RulesModal from "../../components/RulesModal";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGithub, isAuthenticating, session } = useAuthStore();
  const isProcessing = isAuthenticating || !!session;
  const [isRulesModalVisible, setRulesModalVisible] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/(drawer)/(tabs)");
    }
  }, [session, router]);

  const flashOpacity = useSharedValue(1);
  const iconScale = useSharedValue(4);
  const iconY = useSharedValue(-height / 2);
  const scanlineTranslate = useSharedValue(-height);

  useEffect(() => {
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 150);

    flashOpacity.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.exp),
    });

    iconY.value = withSpring(0, { damping: 12, stiffness: 150, mass: 1 });
    iconScale.value = withSpring(1, { damping: 14, stiffness: 200, mass: 1.5 });

    scanlineTranslate.value = withRepeat(
      withTiming(height, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const flashbangStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    zIndex: flashOpacity.value > 0 ? 999 : -1,
  }));

  const iconSlamStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconY.value }, { scale: iconScale.value }],
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanlineTranslate.value }],
  }));

  const brutalSpring = { damping: 14, stiffness: 120, mass: 0.8 };

  return (
    <View style={styles.container}>
      {!session && (
        <>
          <LinearGradient
            colors={[`${COLORS.primary}15`, "transparent"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />

          <Animated.View
            style={[styles.flashbang, flashbangStyle]}
            pointerEvents="none"
          />

          <Animated.View
            style={[styles.scanlineSweep, scanlineStyle]}
            pointerEvents="none"
          />

          <View style={styles.headerContainer}>
            <Animated.View style={[styles.iconBox, iconSlamStyle]}>
              <Ionicons name="terminal" size={48} color={COLORS.background} />
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(300)
                .springify()
                .damping(brutalSpring.damping)}
              style={styles.title}
            >
              LOOP.
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(450)
                .springify()
                .damping(brutalSpring.damping)}
              style={styles.subtitle}
            >
              {`The Arena requires biometric truth.\nLink your GitHub to generate your profile.`}
            </Animated.Text>
          </View>

          <Animated.View
            entering={FadeInDown.delay(600)
              .springify()
              .damping(brutalSpring.damping)}
            style={styles.actionContainer}
          >
            <TouchableOpacity
              style={styles.rulesTrigger}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRulesModalVisible(true);
              }}
            >
              <Text style={styles.rulesTriggerText}>
                [ VIEW EVALUATION PROTOCOLS ]
              </Text>
            </TouchableOpacity>

            <RulesModal
              visible={isRulesModalVisible}
              onClose={() => setRulesModalVisible(false)}
            />

            <TouchableOpacity
              style={[styles.button, isProcessing && styles.buttonDisabled]}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await loginWithGithub();
              }}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color={COLORS.background} size="small" />
                  <Text style={styles.buttonText}>INITIATING HANDSHAKE...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="logo-github"
                    size={24}
                    color={COLORS.background}
                  />
                  <Text style={styles.buttonText}>LOGIN VIA GITHUB</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(800)}
            style={styles.systemFooter}
            pointerEvents="auto"
          >
            <Pressable
              onPress={() =>
                Linking.openURL(`https://loop-5d7e2.web.app/privacy/`)
              }
            >
              <Text style={styles.systemText}>PRIVACY POLICY</Text>
              <Text style={styles.systemText}>CONNECTION // SECURE</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: 30,
    overflow: "hidden",
  },
  flashbang: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
  },
  scanlineSweep: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 100,
    backgroundColor: `rgba(234, 179, 8, 0.03)`,
    borderBottomWidth: 1,
    borderBottomColor: `rgba(234, 179, 8, 0.2)`,
  },
  headerContainer: {
    marginBottom: 50,
    alignItems: "center",
  },
  iconBox: {
    width: 90,
    height: 90,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 52,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -2,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: "center",
    marginTop: 15,
    lineHeight: 26,
    fontWeight: "500",
  },
  actionContainer: {
    width: "100%",
  },
  rulesTrigger: {
    alignSelf: "center",
    marginBottom: 20,
    padding: 10,
  },
  rulesTriggerText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    borderRadius: 4,
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.8,
    backgroundColor: COLORS.grey,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  systemFooter: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
    gap: 5,
  },
  systemText: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 10,
    fontFamily: "Courier",
    fontWeight: "700",
    letterSpacing: 2,
  },
});
