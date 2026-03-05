import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// Constants
const MAX_TECH_TAGS = 5;
const TECH_SEARCH_DEBOUNCE = 400;
const MIN_SEARCH_LENGTH = 2;

// Validation helpers
const validateForm = (
  title: string,
  description: string,
  hackathonLink: string,
  commsLink: string,
  selectedTags: string[],
) => {
  if (!title.trim())
    return { isValid: false, message: "Project title is required" };
  if (title.trim().length < 3)
    return { isValid: false, message: "Title must be at least 3 characters" };
  if (!description.trim())
    return { isValid: false, message: "Description is required" };
  if (description.trim().length < 20)
    return {
      isValid: false,
      message: "Description must be at least 20 characters",
    };
  if (!hackathonLink.trim())
    return { isValid: false, message: "Hackathon link is required" };
  if (!hackathonLink.startsWith("http"))
    return { isValid: false, message: "Hackathon link must be a valid URL" };
  if (!commsLink.trim())
    return { isValid: false, message: "Communication link is required" };
  if (!commsLink.startsWith("http"))
    return {
      isValid: false,
      message: "Communication link must be a valid URL",
    };
  if (selectedTags.length === 0)
    return { isValid: false, message: "Select at least one technology" };

  return { isValid: true };
};

export default function CreateNodeScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const { user } = useUser();

  const currentUser = useQuery(api.users.getCurrentUser, {
    clerkId: clerkId ?? undefined,
  });
  const createRequirement = useMutation(api.requirements.create);
  const syncUserFallback = useMutation(api.users.syncUser);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hackathonLink, setHackathonLink] = useState("");
  const [commsLink, setCommsLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tech Stack State
  const [techQuery, setTechQuery] = useState("");
  const [techResults, setTechResults] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced tech search
  useEffect(() => {
    if (techQuery.trim().length < MIN_SEARCH_LENGTH) {
      setTechResults([]);
      setSearchError(null);
      return;
    }

    const fetchTags = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(
          `https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&inname=${encodeURIComponent(techQuery.toLowerCase())}&site=stackoverflow`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch technologies");
        }

        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setTechResults(data.items.map((item: any) => item.name).slice(0, 5));
        } else {
          setTechResults([]);
          setSearchError("No technologies found");
        }
      } catch (err) {
        console.error("API Error", err);
        setSearchError("Failed to search technologies");
        setTechResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchTags();
    }, TECH_SEARCH_DEBOUNCE);

    return () => clearTimeout(delayDebounceFn);
  }, [techQuery]);

  const toggleTag = useCallback(
    (tag: string) => {
      if (selectedTags.includes(tag)) {
        setSelectedTags((prev) => prev.filter((t) => t !== tag));
      } else {
        if (selectedTags.length >= MAX_TECH_TAGS) {
          Alert.alert(
            "Limit Reached",
            `You can only select up to ${MAX_TECH_TAGS} core technologies.`,
          );
          return;
        }
        setSelectedTags((prev) => [...prev, tag]);
      }
      setTechQuery("");
      setTechResults([]);
      setSearchError(null);
    },
    [selectedTags],
  );

  const handlePublish = useCallback(async () => {
    // Validation
    const validation = validateForm(
      title,
      description,
      hackathonLink,
      commsLink,
      selectedTags,
    );
    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    // Ensure user is synced
    let activeUserId = currentUser?._id;

    if (!activeUserId) {
      if (!user || !clerkId) {
        Alert.alert(
          "Auth Error",
          "Could not verify your session. Please try logging in again.",
        );
        return;
      }

      setIsSubmitting(true);
      try {
        activeUserId = await syncUserFallback({
          clerkId: clerkId,
          githubUsername:
            user.externalAccounts[0]?.username || user.firstName || "Unknown",
          avatarUrl: user.imageUrl,
        });
      } catch (err) {
        setIsSubmitting(false);
        Alert.alert(
          "Sync Error",
          "Failed to sync your profile. Please try again.",
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await createRequirement({
        creatorId: activeUserId,
        title: title.trim(),
        description: description.trim(),
        hackathonLink: hackathonLink.trim(),
        techStack: selectedTags,
        commsLink: commsLink.trim(),
      });

      // Success - clear form
      setTitle("");
      setDescription("");
      setHackathonLink("");
      setSelectedTags([]);
      setCommsLink("");

      Alert.alert(
        "✓ Success",
        "Node deployed successfully! Your requirement is now live.",
        [{ text: "View Nodes", onPress: () => router.push("/(tabs)") }],
      );
    } catch (error: any) {
      Alert.alert(
        "Deployment Failed",
        error.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    description,
    hackathonLink,
    commsLink,
    selectedTags,
    currentUser,
    user,
    clerkId,
    syncUserFallback,
    createRequirement,
    router,
  ]);

  // Character counts for validation feedback
  const titleCharCount = title.length;
  const descCharCount = description.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Modern header */}
          <LinearGradient
            colors={["rgba(234, 179, 8, 0.1)", "transparent"]}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Initialize Node</Text>
              <Text style={styles.headerSubtitle}>
                Create your project requirement
              </Text>
            </View>
          </LinearGradient>

          {/* Project Title */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="document-text" size={18} color={COLORS.primary} />
              <Text style={styles.label}>Project Title</Text>
              <Text style={styles.charCount}>{titleCharCount}/100</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                titleCharCount > 0 && titleCharCount < 3 && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="e.g., HFT Trading Bot MVP"
                placeholderTextColor={COLORS.surfaceLight}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
            {titleCharCount > 0 && titleCharCount < 3 && (
              <Text style={styles.errorText}>
                Minimum 3 characters required
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="list" size={18} color={COLORS.primary} />
              <Text style={styles.label}>Requirement Description</Text>
              <Text style={styles.charCount}>{descCharCount}/500</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                styles.textAreaContainer,
                descCharCount > 0 && descCharCount < 20 && styles.inputError,
              ]}
            >
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="State your exact constraints (e.g., Need 1 frontend dev, NSUT students only, Hackathon requires 1 female teammate)..."
                placeholderTextColor={COLORS.surfaceLight}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
            {descCharCount > 0 && descCharCount < 20 && (
              <Text style={styles.errorText}>
                Minimum 20 characters required
              </Text>
            )}
          </View>

          {/* Hackathon Link */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="link" size={18} color={COLORS.primary} />
              <Text style={styles.label}>Hackathon Link</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>REQUIRED</Text>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="https://devpost.com/..."
                placeholderTextColor={COLORS.surfaceLight}
                value={hackathonLink}
                onChangeText={setHackathonLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.helperRow}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={COLORS.grey}
              />
              <Text style={styles.helperText}>Proof of project legitimacy</Text>
            </View>
          </View>

          {/* Tech Stack */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="code-slash" size={18} color={COLORS.primary} />
              <Text style={styles.label}>Tech Stack</Text>
              <Text style={styles.labelHint}>
                ({selectedTags.length}/{MAX_TECH_TAGS})
              </Text>
            </View>

            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                {selectedTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.selectedTag}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tagDot} />
                    <Text style={styles.selectedTagText}>{tag}</Text>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={COLORS.background}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.searchContainer}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={COLORS.surfaceLight}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.input, styles.searchInput]}
                  placeholder="Search technologies..."
                  placeholderTextColor={COLORS.surfaceLight}
                  value={techQuery}
                  onChangeText={setTechQuery}
                  autoCapitalize="none"
                />
                {isSearching && (
                  <ActivityIndicator
                    style={styles.searchLoader}
                    color={COLORS.primary}
                  />
                )}
              </View>
            </View>

            {searchError && (
              <View style={styles.searchErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.searchErrorText}>{searchError}</Text>
              </View>
            )}

            {techResults.length > 0 && (
              <View style={styles.dropdown}>
                {techResults.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.dropdownItem}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View style={styles.tagDot} />
                      <Text style={styles.dropdownItemText}>{tag}</Text>
                    </View>
                    <Ionicons
                      name={
                        selectedTags.includes(tag)
                          ? "checkmark-circle"
                          : "add-circle"
                      }
                      size={24}
                      color={
                        selectedTags.includes(tag)
                          ? COLORS.primary
                          : COLORS.grey
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Comms Link */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
              <Text style={[styles.label, styles.warningLabel]}>
                Encrypted Comms Link
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Discord/WhatsApp Group URL"
                placeholderTextColor={COLORS.surfaceLight}
                value={commsLink}
                onChangeText={setCommsLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.securityCard}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={COLORS.secondary}
              />
              <Text style={styles.securityText}>
                Only revealed to accepted candidates
              </Text>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handlePublish}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                isSubmitting
                  ? [COLORS.surfaceLight, COLORS.surfaceLight]
                  : [COLORS.primary, COLORS.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color={COLORS.background} />
                  <Text style={styles.submitButtonText}>Deploying...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color={COLORS.background} />
                  <Text style={styles.submitButtonText}>Deploy Node</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {paddingHorizontal: 20, paddingBottom: 120 },
  headerGradient: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginBottom: 24,
    paddingTop: 60
  },
  header: {},
  headerTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
  },
  formGroup: { marginBottom: 24 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.grey,
    fontWeight: "600",
  },
  labelHint: {
    fontSize: 12,
    color: COLORS.grey,
    fontWeight: "600",
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  warningLabel: { color: COLORS.primary },
  inputContainer: {
    position: "relative",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    overflow: "hidden",
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  input: {
    padding: 16,
    color: COLORS.white,
    fontSize: 15,
  },
  textAreaContainer: {
    minHeight: 140,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    marginLeft: 4,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.grey,
  },
  searchContainer: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 44,
  },
  searchLoader: {
    position: "absolute",
    right: 16,
    top: 18,
  },
  searchErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  searchErrorText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropdownItemText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },
  selectedTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  selectedTag: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.background,
  },
  selectedTagText: {
    color: COLORS.background,
    fontWeight: "700",
    fontSize: 14,
  },
  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(202, 138, 4, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(202, 138, 4, 0.2)",
  },
  securityText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  submitButtonText: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
