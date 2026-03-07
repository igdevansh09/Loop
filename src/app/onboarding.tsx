import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useAnimatedReaction,
  cancelAnimation,
  interpolate,
  Extrapolation,
  Easing,
  withRepeat,
  withSequence,
  interpolateColor,
  SharedValue, // 🔧 FIXED: Imported SharedValue directly here
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";

const { height, width } = Dimensions.get("window");
const SWIPE_WIDTH = width * 0.85;
const PADDING = 30;

// 🔧 FIXED: Using the direct SharedValue type
const DataStreamBackground = ({
  progress,
}: {
  progress: SharedValue<number>;
}) => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const wireframeStyle = useAnimatedStyle(() => {
    const holdAcceleration = interpolate(
      progress.value,
      [0, 1],
      [1, 20],
      Extrapolation.CLAMP,
    );

    return {
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        ["rgba(255, 255, 255, 0.1)", `${COLORS.primary}aa`],
      ),
      transform: [
        { perspective: 400 },
        { rotateX: "60deg" },
        { rotateZ: `${rotate.value * holdAcceleration}deg` },
        { scale: interpolate(progress.value, [0, 1], [1, 1.4]) },
      ],
    };
  });

  const scanlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.85, 1], [0, 0.1, 0.3]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-50, 0]) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.gridContainer}>
        <Animated.View style={[styles.wireframe, wireframeStyle]}>
          <View style={styles.wireframeInner} />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, scanlineStyle]}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View key={i} style={styles.scanline} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const [statusText, setStatusText] = useState(
    "SYSTEM READY // [WAITING_FOR_INPUT]",
  );

  const progress = useSharedValue(0);
  const shake = useSharedValue(0);
  const hapticTracker = useSharedValue(0);

  const handleSuccess = async () => {
    setStatusText("ARENA UNLOCKED // INITIATING LOGIN");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
    router.push("/(auth)/login");
  };

  const updateStatus = (text: string) => setStatusText(text);
  const triggerTick = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  const triggerAbort = () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

  useAnimatedReaction(
    () => progress.value,
    (val) => {
      if (val > hapticTracker.value + 0.1 && val < 1) {
        hapticTracker.value = val;
        scheduleOnRN(triggerTick);
      }

      if (val >= 1 && hapticTracker.value !== 1) {
        hapticTracker.value = 1;
        cancelAnimation(shake);
        scheduleOnRN(handleSuccess);
      }
    },
  );

  const holdGesture = Gesture.LongPress()
    .minDuration(0)
    .onBegin(() => {
      scheduleOnRN(updateStatus, "COMPILING CODES // SYSTEM OVERLOAD IMMINENT");
      hapticTracker.value = 0;

      progress.value = withTiming(1, {
        duration: 2500,
        easing: Easing.in(Easing.exp),
      });

      shake.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 30 }),
          withTiming(5, { duration: 30 }),
        ),
        -1,
        true,
      );
    })
    .onFinalize(() => {
      if (progress.value < 1) {
        cancelAnimation(progress);
        cancelAnimation(shake);

        progress.value = withSpring(0, { damping: 15, stiffness: 200 });
        shake.value = withSpring(0);
        hapticTracker.value = 0;

        scheduleOnRN(updateStatus, "SYSTEM ABORTED // TRUTH_HASH INVALID");
        scheduleOnRN(triggerAbort);

        setTimeout(
          () =>
            scheduleOnRN(updateStatus, "SYSTEM READY // [WAITING_FOR_INPUT]"),
          1500,
        );
      }
    });

  const containerStyle = useAnimatedStyle(() => {
    const shakeMultiplier = interpolate(
      progress.value,
      [0, 1],
      [0, 1.8],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: shake.value * shakeMultiplier },
        { translateY: (shake.value * shakeMultiplier) / 2 },
      ],
    };
  });

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.8, 1],
      [COLORS.grey, "#ea580c", COLORS.primary],
    ),
  }));

  const dynamicInstructionStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 0.98],
          [1, 1.15],
          Extrapolation.CLAMP,
        ),
      },
    ],
    color: interpolateColor(
      progress.value,
      [0, 0.9],
      [COLORS.grey, COLORS.white],
    ),
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <DataStreamBackground progress={progress} />

      {/* 🔧 FIXED: Gradient explicitly cuts off at the exact middle (y: 0.5) */}
      <LinearGradient
        colors={[`${COLORS.primary}15`, "transparent"]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <Animated.View style={[styles.content, containerStyle]}>
        <View style={{ flex: 1, justifyContent: "center", paddingTop: 80 }}>
          <Animated.Text
            entering={FadeInDown.delay(200).springify()}
            style={styles.kicker}
          >
            Loop // ROOT_ACCESS_TERMINAL // v1.0
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(400).springify()}
            style={styles.title}
          >
            No Resumes.
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(500).springify()}
            style={styles.title}
          >
            No Fluff.
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(600).springify()}
            style={[styles.title, styles.highlight]}
          >
            Only Code.
          </Animated.Text>
        </View>

        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.footer}
        >
          <GestureDetector gesture={holdGesture}>
            <View style={styles.switchTrack}>
              <Animated.View style={[styles.switchFill, progressBarStyle]} />

              <View style={styles.instructionContainer}>
                <Animated.Text
                  style={[styles.switchInstruction, dynamicInstructionStyle]}
                >
                  HOLD THE LINE
                </Animated.Text>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>
          </GestureDetector>
        </Animated.View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: height,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING,
  },
  kicker: {
    color: COLORS.grey,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 20,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 56,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -2.5,
    lineHeight: 60,
  },
  highlight: {
    color: COLORS.primary,
  },
  footer: {
    paddingBottom: 60,
    alignItems: "center",
  },
  switchTrack: {
    width: SWIPE_WIDTH,
    height: 110,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    position: "relative",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  switchFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  instructionContainer: {
    zIndex: 10,
    paddingHorizontal: 20,
    gap: 5,
    alignItems: "center",
  },
  switchInstruction: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusText: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "center",
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: height * 0.15,
  },
  wireframe: {
    width: width * 1.5,
    height: width * 1.5,
    borderWidth: 1,
    borderRadius: width * 0.75,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.4,
  },
  wireframeInner: {
    width: "60%",
    height: "60%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    transform: [{ rotate: "45deg" }],
  },
  scanline: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    marginBottom: 6,
  },
});
