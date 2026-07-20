import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useLaunchStore } from "../../store/useLaunchStore";
import { useAlertStore } from "../../store/useAlertStore";

const springConfig = { damping: 15, stiffness: 100 };

const CornerBrackets = ({ color = COLORS.primary }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
    <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
  </View>
);

const TerminalInput = ({
  label,
  multiline = false,
  autoExpand = false,
  ...props
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          isFocused && styles.inputFocused,
        ]}
        onFocus={() => {
          Haptics.selectionAsync();
          setIsFocused(true);
        }}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="rgba(255, 255, 255, 0.2)"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        scrollEnabled={!autoExpand}
        {...props}
      />
    </View>
  );
};

const TerminalSelect = ({ label, value, options, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={[styles.inputWrapper, { zIndex: isOpen ? 50 : 1 }]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.input,
          isOpen && styles.inputFocused,
          styles.rowCentered,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setIsOpen(!isOpen);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.inputText}>{value}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color={COLORS.grey}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={styles.dropdownItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt);
                setIsOpen(false);
              }}
            >
              <Text
                style={{
                  color: opt === value ? COLORS.primary : COLORS.white,
                  fontWeight: "700",
                }}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const TerminalSkillInput = () => {
  const {
    requiredSkills,
    addSkill,
    removeSkill,
    fetchSkillSuggestions,
    skillSuggestions,
    isFetchingSkills,
  } = useLaunchStore();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchSkillSuggestions(query), 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleManualAdd = () => {
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery && !requiredSkills.includes(cleanQuery)) {
      addSkill(cleanQuery);
      setQuery("");
    }
  };

  return (
    <View style={[styles.inputWrapper, { zIndex: isFocused ? 100 : 1 }]}>
      <Text style={styles.inputLabel}>REQUIRED STACK (LIVE DB)</Text>

      {requiredSkills.length > 0 && (
        <View style={styles.chipContainer}>
          {requiredSkills.map((skill: string) => (
            <TouchableOpacity
              key={skill}
              style={styles.chip}
              onPress={() => {
                Haptics.selectionAsync();
                removeSkill(skill);
              }}
            >
              <Text style={styles.chipText}>{skill}</Text>
              <Ionicons name="close" size={14} color={COLORS.background} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ position: "relative" }}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            { paddingRight: 40 },
          ]}
          placeholder="Search tags (e.g. react, rust)..."
          placeholderTextColor="rgba(255, 255, 255, 0.2)"
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            Haptics.selectionAsync();
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleManualAdd}
          autoCapitalize="none"
          returnKeyType="done"
        />
        {isFetchingSkills && (
          <ActivityIndicator
            style={styles.inputLoader}
            size="small"
            color={COLORS.primary}
          />
        )}
      </View>

      {isFocused && skillSuggestions.length > 0 && query.length >= 2 && (
        <View style={styles.dropdownMenu}>
          {skillSuggestions.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.dropdownItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (!requiredSkills.includes(item)) addSkill(item);
                setQuery("");
              }}
            >
              <Text style={{ color: COLORS.white, fontWeight: "700" }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function CreateTeamScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const showAlert = useAlertStore((state) => state.showAlert);

  const {
    projectName,
    hackathonUrl,
    requiredSkills,
    capacity,
    college,
    gender,
    communityUrl,
    description,
    setField,
    launchTeam,
    isSubmitting,
  } = useLaunchStore();

  const handleLaunch = async () => {
    if (
      !projectName ||
      !hackathonUrl ||
      !communityUrl ||
      !description ||
      requiredSkills.length === 0
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("MISSING DATA", "Fill out all required fields.", "error");
      return;
    }

    if (description.length < 50) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        "SIGNAL REJECTED",
        "Description too short. Minimum 50 characters are required",
        "error",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await launchTeam(user!.id, user?.user_metadata?.user_name || "unknown");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/(drawer)/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("DATABASE ERROR", err.message, "error");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${COLORS.primary}15`, "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.25 }}
      />

      <Animated.View
        entering={FadeInDown.delay(100).springify().damping(15)}
        style={styles.headerContainer}
      >
        <Text style={styles.kicker}>PROTOCOL // INIT</Text>
        <Text style={styles.headerTitle}>LAUNCH BAY</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.delay(200)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.hudBox, { zIndex: 10 }]}
        >
          <CornerBrackets />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIndex}>01</Text>
            <Text style={styles.sectionLabel}>THE CORE</Text>
          </View>

          <TerminalInput
            placeholder="Project Name"
            value={projectName}
            onChangeText={(val: string) => setField("projectName", val)}
          />
          <TerminalInput
            placeholder="Hackathon URL (e.g., Devfolio link)"
            value={hackathonUrl}
            onChangeText={(val: string) => setField("hackathonUrl", val)}
            autoCapitalize="none"
          />
          <TerminalSkillInput />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.hudBox, { zIndex: 5 }]}
        >
          <CornerBrackets />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIndex}>02</Text>
            <Text style={styles.sectionLabel}>CONSTRAINTS</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <TerminalInput
                label="Capacity"
                value={capacity}
                onChangeText={(val: string) => setField("capacity", val)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, zIndex: 10 }}>
              <TerminalSelect
                label="Gender"
                value={gender}
                options={["Any", "Male", "Female"]}
                onSelect={(val: string) => setField("gender", val)}
              />
            </View>
          </View>
          <View style={{ zIndex: -1 }}>
            <TerminalInput
              label="Required College"
              value={college}
              onChangeText={(val: string) => setField("college", val)}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.hudBox, { zIndex: 1 }]}
        >
          <CornerBrackets />
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionIndex, { backgroundColor: "#f97316" }]}>
              03
            </Text>
            <Text style={[styles.sectionLabel, { color: "#f97316" }]}>
              LOCKED REWARD
            </Text>
          </View>
          <Text style={styles.helperText}>
            This comms link is strictly classified. Revealed only upon
            deployment.
          </Text>
          <TerminalInput
            placeholder="Private Discord / WhatsApp URL"
            value={communityUrl}
            onChangeText={(val: string) => setField("communityUrl", val)}
            autoCapitalize="none"
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.hudBox, { zIndex: 0 }]}
        >
          <CornerBrackets />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIndex}>04</Text>
            <Text style={styles.sectionLabel}>ARCHITECTURE</Text>
          </View>
          <Text style={styles.helperText}>
            No marketing fluff. Define the tech stack, DB schema, and the exact
            engineering problem.
          </Text>
          <TerminalInput
            multiline
            autoExpand
            placeholder="(min. 50 chars) e.g.React Native frontend, Go microservices..."
            value={description}
            onChangeText={(val: string) => setField("description", val)}
          />
        </Animated.View>

        <Animated.View
          layout={Layout.springify()}
          entering={FadeInDown.delay(600)
            .springify()
            .damping(springConfig.damping)}
          style={[
            styles.hudBox,
            { padding: 0, overflow: "hidden", marginTop: 10 },
          ]}
        >
          <CornerBrackets />
          <LinearGradient
            colors={[`${COLORS.primary}08`, "rgba(0,0,0,0.8)"]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={{ padding: 25 }}>
            <TouchableOpacity
              style={styles.launchButton}
              onPress={handleLaunch}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <View style={styles.loadingRow}>
                  <Ionicons name="rocket" size={20} color={COLORS.background} />
                  <Text style={styles.launchButtonText}>DEPLOY TO ARENA</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 16,
    marginBottom: 10,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
    textTransform: "uppercase",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  hudBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 16,
    marginBottom: 20,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 10,
    height: 10,
    borderColor: COLORS.primary,
  },
  topLeft: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionIndex: {
    color: COLORS.background,
    backgroundColor: COLORS.primary,
    fontWeight: "900",
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 15,
    lineHeight: 18,
    fontWeight: "500",
  },
  inputWrapper: { marginBottom: 15 },
  inputLabel: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
  inputText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(234, 179, 8, 0.05)",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowCentered: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textArea: { minHeight: 120 },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.95)",
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  inputLoader: { position: "absolute", right: 16, top: 16 },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  chipText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  launchButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    alignItems: "center",
    width: "100%",
  },
  launchButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
