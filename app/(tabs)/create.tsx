import React, { useState, useEffect } from "react";
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
  Platform
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function CreateNodeScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const { user } = useUser(); // Get raw Clerk user data for the fallback sync
  
  const currentUser = useQuery(api.users.getCurrentUser, { clerkId: clerkId ?? undefined });
  const createRequirement = useMutation(api.requirements.create);
  const syncUserFallback = useMutation(api.users.syncUser);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hackathonLink, setHackathonLink] = useState("");
  const [commsLink, setCommsLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tech Stack Live API State
  const [techQuery, setTechQuery] = useState("");
  const [techResults, setTechResults] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced StackOverflow API Fetch
  useEffect(() => {
    if (techQuery.trim().length < 2) {
      setTechResults([]);
      return;
    }

    const fetchTags = async () => {
      setIsSearching(true);
      try {
        // Free, public StackExchange API for programming tags
        const res = await fetch(`https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&inname=${techQuery.toLowerCase()}&site=stackoverflow`);
        const data = await res.json();
        if (data.items) {
          setTechResults(data.items.map((item: any) => item.name).slice(0, 5)); // Keep top 5 matches
        }
      } catch (err) {
        console.error("API Error", err);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchTags();
    }, 400); // 400ms debounce to prevent rate-limiting

    return () => clearTimeout(delayDebounceFn);
  }, [techQuery]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
        Alert.alert("Limit Reached", "You can only select up to 5 core technologies.");
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
    setTechQuery(""); // Clear search after selection
    setTechResults([]);
  };

  const handlePublish = async () => {
    // Localhost Webhook Bypass: If user doesn't exist in Convex yet, force create them now.
    let activeUserId = currentUser?._id;

    if (!activeUserId) {
      if (!user || !clerkId) {
        Alert.alert("Auth Error", "Could not verify Clerk session.");
        return;
      }
      try {
        // Fallback sync using raw Clerk data
        activeUserId = await syncUserFallback({
          clerkId: clerkId,
          githubUsername: user.externalAccounts[0]?.username || user.firstName || "Unknown",
          avatarUrl: user.imageUrl,
        });
      } catch (err) {
        Alert.alert("Sync Error", "Failed to sync profile to database.");
        return;
      }
    }

    // Strict Validation
    if (!title.trim() || !description.trim() || !hackathonLink.trim() || !commsLink.trim()) {
      Alert.alert("Incomplete", "All fields are strictly mandatory.");
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert("Invalid Stack", "You must select at least one technology.");
      return;
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

      // Reset and Route
      setTitle("");
      setDescription("");
      setHackathonLink("");
      setSelectedTags([]);
      setCommsLink("");
      router.push("/(tabs)");
      
    } catch (error: any) {
      Alert.alert("Transaction Failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Initialize Node</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Project Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., HFT Trading Bot MVP"
            placeholderTextColor={COLORS.surfaceLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Requirement Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="State your exact constraints and requirements."
            placeholderTextColor={COLORS.surfaceLight}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mandatory Hackathon Link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://devpost.com/..."
            placeholderTextColor={COLORS.surfaceLight}
            value={hackathonLink}
            onChangeText={setHackathonLink}
            autoCapitalize="none"
          />
        </View>

        {/* Live Search Tech Stack Component */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tech Stack (StackOverflow API)</Text>
          
          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              {selectedTags.map(tag => (
                <TouchableOpacity key={tag} style={styles.selectedTag} onPress={() => toggleTag(tag)}>
                  <Text style={styles.selectedTagText}>{tag}</Text>
                  <Ionicons name="close-circle" size={16} color={COLORS.background} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Search technologies (e.g., react-native)"
              placeholderTextColor={COLORS.surfaceLight}
              value={techQuery}
              onChangeText={setTechQuery}
              autoCapitalize="none"
            />
            {isSearching && <ActivityIndicator style={styles.searchLoader} color={COLORS.primary} />}
          </View>

          {/* API Results Dropdown */}
          {techResults.length > 0 && (
            <View style={styles.dropdown}>
              {techResults.map(tag => (
                <TouchableOpacity key={tag} style={styles.dropdownItem} onPress={() => toggleTag(tag)}>
                  <Text style={styles.dropdownItemText}>{tag}</Text>
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, styles.warningLabel]}>Comms Link (Encrypted)</Text>
          <TextInput
            style={styles.input}
            placeholder="Discord Invite / WhatsApp Group URL"
            placeholderTextColor={COLORS.surfaceLight}
            value={commsLink}
            onChangeText={setCommsLink}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handlePublish}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.submitButtonText}>Deploy Node</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: COLORS.white, fontFamily: "JetBrainsMono-Medium" },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "bold", color: COLORS.white, marginBottom: 8, fontFamily: "JetBrainsMono-Medium" },
  warningLabel: { color: COLORS.primary },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceLight, borderRadius: 8, padding: 16, color: COLORS.white, fontSize: 16 },
  textArea: { minHeight: 120 }, // Auto-expands but starts large
  searchContainer: { justifyContent: "center" },
  searchLoader: { position: "absolute", right: 16 },
  dropdown: { backgroundColor: COLORS.surfaceLight, borderRadius: 8, marginTop: 4, overflow: "hidden" },
  dropdownItem: { flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  dropdownItemText: { color: COLORS.white, fontSize: 16 },
  selectedTagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  selectedTag: { backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  selectedTagText: { color: COLORS.background, fontWeight: "bold", fontSize: 14 },
  submitButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 8, alignItems: "center", marginTop: 12 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: COLORS.background, fontSize: 18, fontWeight: "bold", fontFamily: "JetBrainsMono-Medium" },
});