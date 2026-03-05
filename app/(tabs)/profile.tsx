import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen() {
  const { signOut, userId: clerkId } = useAuth();
  
  // Database Connections
  const currentUser = useQuery(api.users.getCurrentUser, { clerkId: clerkId ?? undefined });
  const updateProfile = useMutation(api.users.updateProfile);

  // Local State for Trust Network
  const [collegeName, setCollegeName] = useState("");
  const [branch, setBranch] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local state when database profile loads
  useEffect(() => {
    if (currentUser) {
      setCollegeName(currentUser.collegeName || "");
      setBranch(currentUser.branch || "");
    }
  }, [currentUser]);

  const handleUpdate = async () => {
    if (!currentUser) return;
    setIsUpdating(true);
    try {
      await updateProfile({
        userId: currentUser._id,
        collegeName: collegeName.trim(),
        branch: branch.trim(),
      });
      Alert.alert("Verified", "Your trust network credentials have been updated.");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // AuthObserver in _layout.tsx will instantly catch this and kick the user to the login gate.
    } catch (error: any) {
      Alert.alert("Error", "Could not terminate session.");
    }
  };

  if (currentUser === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (currentUser === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Critical Error: Database identity not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Terminal State</Text>
        </View>

        {/* Identity Badge */}
        <View style={styles.badgeContainer}>
          <Image 
            source={{ uri: currentUser.avatarUrl || "https://github.com/ghost.png" }} 
            style={styles.avatar} 
          />
          <View style={styles.badgeInfo}>
            <Text style={styles.username}>{currentUser.githubUsername}</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.verifiedText}>GitHub Verified</Text>
            </View>
          </View>
        </View>

        {/* GitHub Tech Stack Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Stack</Text>
          {currentUser.topLanguages && currentUser.topLanguages.length > 0 ? (
            <View style={styles.stackContainer}>
              {currentUser.topLanguages.map((lang: string, idx: number) => (
                <View key={idx} style={styles.langPill}>
                  <Text style={styles.langText}>{lang}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyStackText}>
              Awaiting background sync with GitHub APIs...
            </Text>
          )}
        </View>

        {/* Localized Trust Network Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trust Network Initialization</Text>
          <Text style={styles.sectionSubtitle}>
            Providing your college affiliation increases application acceptance rates by 40%.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Institution (e.g., NSUT)</Text>
            <TextInput
              style={styles.input}
              placeholder="University Name"
              placeholderTextColor={COLORS.surfaceLight}
              value={collegeName}
              onChangeText={setCollegeName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Discipline (e.g., B.Tech Computer Science)</Text>
            <TextInput
              style={styles.input}
              placeholder="Degree and Branch"
              placeholderTextColor={COLORS.surfaceLight}
              value={branch}
              onChangeText={setBranch}
            />
          </View>

          <TouchableOpacity 
            style={[styles.updateButton, isUpdating && styles.disabledButton]} 
            onPress={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color={COLORS.background} size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Commit Identity</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Terminate Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: COLORS.white, fontFamily: "JetBrainsMono-Medium" },
  errorText: { color: "#EF4444", fontFamily: "JetBrainsMono-Medium" },
  
  badgeContainer: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.surfaceLight, marginBottom: 32 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surfaceLight, marginRight: 16 },
  badgeInfo: { flex: 1 },
  username: { fontSize: 20, fontWeight: "bold", color: COLORS.white, fontFamily: "JetBrainsMono-Medium", marginBottom: 4 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  verifiedText: { color: COLORS.primary, fontSize: 12, fontWeight: "bold" },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.white, fontFamily: "JetBrainsMono-Medium", marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: COLORS.grey, marginBottom: 16, lineHeight: 20 },
  
  stackContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langPill: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  langText: { color: COLORS.secondary, fontSize: 12, fontWeight: "600", fontFamily: "JetBrainsMono-Medium" },
  emptyStackText: { color: COLORS.grey, fontStyle: "italic", fontSize: 14 },

  formGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "bold", color: COLORS.grey, marginBottom: 8, textTransform: "uppercase" },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceLight, borderRadius: 8, padding: 16, color: COLORS.white, fontSize: 16 },
  
  updateButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 8, alignItems: "center", marginTop: 8 },
  disabledButton: { opacity: 0.5 },
  updateButtonText: { color: COLORS.background, fontSize: 16, fontWeight: "bold", fontFamily: "JetBrainsMono-Medium" },

  dangerZone: { marginTop: 24, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight, paddingTop: 32 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 8, borderWidth: 1, borderColor: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.1)", gap: 8 },
  logoutText: { color: "#EF4444", fontSize: 16, fontWeight: "bold", fontFamily: "JetBrainsMono-Medium" },
});