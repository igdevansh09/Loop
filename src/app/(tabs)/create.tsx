import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeIn,
  Layout,
  SlideInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useLaunchStore } from "../../store/useLaunchStore";

// 🚀 FIXED: Moved animation config outside so it never forces a remount on state change
const springConfig = { damping: 15, stiffness: 100 };

// --- 1. Custom Brutalist Input ---
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

// --- 2. Terminal Dropdown ---
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

// --- 3. StackOverflow Live Tag Fetcher (ROCK SOLID FIX) ---
const TerminalSkillInput = ({
  selectedSkills,
  onAddSkill,
  onRemoveSkill,
}: any) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&inname=${encodeURIComponent(query)}&site=stackoverflow&pagesize=5`,
        );
        const data = await res.json();
        if (data.items)
          setSuggestions(data.items.map((item: any) => item.name));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleManualAdd = () => {
    if (query.trim() && !selectedSkills.includes(query.trim().toLowerCase())) {
      onAddSkill(query.trim().toLowerCase());
      setQuery("");
      setSuggestions([]);
    }
  };

  return (
    <View style={[styles.inputWrapper, { zIndex: isFocused ? 100 : 1 }]}>
      <Text style={styles.inputLabel}>REQUIRED STACK (LIVE DB)</Text>

      {selectedSkills.length > 0 && (
        <View style={styles.chipContainer}>
          {selectedSkills.map((skill: string) => (
            <TouchableOpacity
              key={skill}
              style={styles.chip}
              onPress={() => {
                Haptics.selectionAsync();
                onRemoveSkill(skill);
              }}
            >
              <Text style={styles.chipText}>{skill}</Text>
              <Ionicons name="close" size={14} color={COLORS.background} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 🚀 FIXED: No more nested View wrappers. The TextInput IS the box now. */}
      <View style={{ position: "relative" }}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            { paddingRight: 40 }, // Leaves room for the loading spinner
          ]}
          placeholder="Search tags (e.g. react, python)..."
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
        {isLoading && (
          <ActivityIndicator
            style={styles.inputLoader}
            size="small"
            color={COLORS.primary}
          />
        )}
      </View>

      {isFocused && suggestions.length > 0 && query.length >= 2 && (
        <View style={styles.dropdownMenu}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.dropdownItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (!selectedSkills.includes(item)) onAddSkill(item);
                setQuery("");
                setSuggestions([]);
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

  const {
    analyzeSignal,
    launchTeam,
    isAnalyzing,
    isSubmitting,
    signalScore,
    aiFeedback,
    vectorData,
  } = useLaunchStore();

  const [projectName, setProjectName] = useState("");
  const [hackathonUrl, setHackathonUrl] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [capacity, setCapacity] = useState("4");
  const [college, setCollege] = useState("Any");
  const [gender, setGender] = useState("Any");
  const [communityUrl, setCommunityUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleAnalyze = async () => {
    if (description.length < 50) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "SIGNAL REJECTED",
        "Description too short. Explain the architecture.",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const passed = await analyzeSignal(description);
    Haptics.notificationAsync(
      passed
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
  };

  const handleLaunch = async () => {
    if (
      !projectName ||
      !hackathonUrl ||
      !communityUrl ||
      requiredSkills.length === 0 ||
      !vectorData
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("MISSING DATA", "Fill out all fields and pass Calibrator.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await launchTeam({
        founder_id: user!.id,
        founder_github: user?.user_metadata?.user_name || "unknown",
        project_name: projectName,
        project_description: description,
        required_skills: requiredSkills.join(", "),
        requirement_embedding: vectorData,
        hackathon_url: hackathonUrl,
        private_community_url: communityUrl,
        max_capacity: parseInt(capacity) || 4,
        required_college: college,
        gender_requirement: gender,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setProjectName("");
      setDescription("");
      setRequiredSkills([]);
      setHackathonUrl("");
      setCommunityUrl("");

      router.push("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("DATABASE ERROR", err.message);
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.kicker}>PROTOCOL // INIT</Text>
          <Text style={styles.headerTitle}>LAUNCH BAY</Text>
        </Animated.View>

        {/* 1. THE CORE */}
        <Animated.View
          entering={FadeInDown.delay(200)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.section, { zIndex: 10 }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIndex}>01</Text>
            <Text style={styles.sectionLabel}>THE CORE</Text>
          </View>
          <TerminalInput
            placeholder="Project Name"
            value={projectName}
            onChangeText={setProjectName}
          />

          <TerminalSkillInput
            selectedSkills={requiredSkills}
            onAddSkill={(skill: string) =>
              setRequiredSkills([...requiredSkills, skill])
            }
            onRemoveSkill={(skill: string) =>
              setRequiredSkills(requiredSkills.filter((s) => s !== skill))
            }
          />

          <TerminalInput
            placeholder="Hackathon URL (e.g., Devfolio link)"
            value={hackathonUrl}
            onChangeText={setHackathonUrl}
            autoCapitalize="none"
          />
        </Animated.View>

        {/* 2. THE RULES */}
        <Animated.View
          entering={FadeInDown.delay(300)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.section, { zIndex: 5 }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIndex}>02</Text>
            <Text style={styles.sectionLabel}>CONSTRAINTS</Text>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <TerminalInput
                label="Capacity"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, zIndex: 10 }}>
              <TerminalSelect
                label="Gender"
                value={gender}
                options={["Any", "Male", "Female"]}
                onSelect={setGender}
              />
            </View>
          </View>
          <View style={{ zIndex: -1 }}>
            <TerminalInput
              label="Required College"
              value={college}
              onChangeText={setCollege}
            />
          </View>
        </Animated.View>

        {/* 3. THE REWARD */}
        <Animated.View
          entering={FadeInDown.delay(400)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.section, { zIndex: 1 }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIndex}>03</Text>
            <Text style={styles.sectionLabel}>LOCKED REWARD</Text>
          </View>
          <Text style={styles.helperText}>
            This comms link is strictly classified. Revealed only upon
            deployment.
          </Text>
          <TerminalInput
            placeholder="Private Discord / WhatsApp URL"
            value={communityUrl}
            onChangeText={setCommunityUrl}
            autoCapitalize="none"
          />
        </Animated.View>

        {/* 4. THE TRUTH */}
        <Animated.View
          entering={FadeInDown.delay(500)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.section, { zIndex: 0 }]}
        >
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
            placeholder="React Native frontend, Go microservices..."
            value={description}
            onChangeText={setDescription}
          />
        </Animated.View>

        {/* 5. THE CALIBRATOR */}
        <Animated.View
          layout={Layout.springify()}
          entering={FadeInDown.delay(600)
            .springify()
            .damping(springConfig.damping)}
          style={[styles.calibratorSection, { zIndex: 0 }]}
        >
          <LinearGradient
            colors={[`${COLORS.primary}08`, "rgba(0,0,0,0.6)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIndex}>05</Text>
            <Text style={styles.sectionLabel}>CALIBRATOR</Text>
          </View>

          {signalScore === null ? (
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                isAnalyzing && styles.analyzeButtonActive,
              ]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
              activeOpacity={0.8}
            >
              {isAnalyzing ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={COLORS.background} />
                  <Text style={styles.analyzeButtonText}>
                    COMPUTING TRUTH HASH...
                  </Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Ionicons
                    name="finger-print"
                    size={20}
                    color={COLORS.background}
                  />
                  <Text style={styles.analyzeButtonText}>ANALYZE SIGNAL</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.feedbackContainer}
            >
              <LinearGradient
                colors={
                  signalScore > 85
                    ? [`${COLORS.primary}33`, "rgba(0,0,0,0.8)"]
                    : ["rgba(239, 68, 68, 0.2)", "rgba(0,0,0,0.8)"]
                }
                style={[
                  styles.scoreBadge,
                  {
                    borderColor: signalScore > 85 ? COLORS.primary : "#ef4444",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.scoreText,
                    { color: signalScore > 85 ? COLORS.primary : "#ef4444" },
                  ]}
                >
                  {signalScore}%
                </Text>
                <Text style={styles.scoreLabel}>SIGNAL TRUTH</Text>
              </LinearGradient>
              <Text style={styles.feedbackText}>{aiFeedback}</Text>

              {signalScore > 85 ? (
                <Animated.View
                  entering={SlideInDown.springify()}
                  style={{ width: "100%" }}
                >
                  <TouchableOpacity
                    style={styles.launchButton}
                    onPress={handleLaunch}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={COLORS.background} />
                    ) : (
                      <View style={styles.loadingRow}>
                        <Ionicons
                          name="rocket"
                          size={20}
                          color={COLORS.background}
                        />
                        <Text style={styles.launchButtonText}>
                          DEPLOY TO ARENA
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => useLaunchStore.getState().resetState()}
                >
                  <Ionicons name="refresh" size={16} color="#ef4444" />
                  <Text style={styles.retryButtonText}>
                    REWRITE ARCHITECTURE
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  kicker: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: -1.5,
    marginBottom: 40,
  },
  section: { marginBottom: 40 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  sectionIndex: {
    color: COLORS.background,
    backgroundColor: COLORS.primary,
    fontWeight: "900",
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.grey,
    marginBottom: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  inputWrapper: { marginBottom: 15 },
  inputLabel: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
    marginLeft: 2,
  },

  // 🚀 FIXED: Pure TextInput styling
  input: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1.5,
    borderColor: COLORS.surfaceLight,
    padding: 16,
    paddingTop: 16,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
    borderRadius: 4,
  },
  inputText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: `rgba(234, 179, 8, 0.05)`,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  row: { flexDirection: "row", justifyContent: "space-between" },
  rowCentered: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textArea: { minHeight: 160 },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.95)",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 4,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
    borderRadius: 4,
    gap: 6,
  },
  chipText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  calibratorSection: {
    marginTop: 10,
    padding: 25,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 4,
  },
  analyzeButton: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 4,
    alignItems: "center",
  },
  analyzeButtonActive: { backgroundColor: COLORS.grey },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  analyzeButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  feedbackContainer: { alignItems: "center", marginTop: 10 },
  scoreBadge: {
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 4,
    marginBottom: 20,
    alignItems: "center",
  },
  scoreText: { fontSize: 48, fontWeight: "900", letterSpacing: -2 },
  scoreLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 5,
  },
  feedbackText: {
    color: COLORS.grey,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
    fontWeight: "500",
  },
  launchButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 4,
    alignItems: "center",
    width: "100%",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  launchButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  retryButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.5)",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  retryButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
