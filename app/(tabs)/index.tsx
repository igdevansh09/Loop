import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import NodeCard from "@/components/NodeCard";

export default function FeedScreen() {
  const { userId: clerkId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = useQuery(api.users.getCurrentUser, {
    clerkId: clerkId ?? undefined,
  });

  const requirements = useQuery(api.requirements.getOpenRequirements);
  const applyMutation = useMutation(api.applications.apply);

  const handleApply = async (requirementId: any) => {
    if (!currentUser) {
      Alert.alert(
        "Hold on",
        "Your profile is still syncing with the database.",
      );
      return;
    }

    try {
      await applyMutation({
        requirementId: requirementId,
        applicantId: currentUser._id,
      });
      Alert.alert(
        "✓ Success",
        "Application submitted securely to the node ledger.",
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not apply.");
    }
  };

  // 1. Loading State
  if (requirements === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Synchronizing nodes...</Text>
      </View>
    );
  }

  // 2. Absolute Empty State (Database has 0 nodes)
  if (requirements.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="terminal-outline"
            size={64}
            color={COLORS.surfaceLight}
          />
        </View>
        <Text style={styles.emptyText}>Network Empty</Text>
        <Text style={styles.emptySubText}>
          Be the first to initialize a requirement.
        </Text>
      </View>
    );
  }

  // 3. Client-Side Filtering Engine
  const filteredRequirements = requirements.filter((req) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    // Check if query matches title, tech stack, or college name
    return (
      req.title.toLowerCase().includes(query) ||
      req.techStack.some((tech) => tech.toLowerCase().includes(query)) ||
      (req.creator.collegeName &&
        req.creator.collegeName.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(234, 179, 8, 0.1)", "transparent"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Active Nodes</Text>
            <Text style={styles.headerSubtitle}>
              {requirements.length} open opportunities
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Search Terminal */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.grey}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, tech stack, or college..."
            placeholderTextColor={COLORS.surfaceLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearIcon}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* 4. Filtered Empty State (Nodes exist, but search yields nothing) */}
      {filteredRequirements.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="search-outline"
            size={48}
            color={COLORS.surfaceLight}
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.emptyText}>No matches found</Text>
          <Text style={styles.emptySubText}>
            Try adjusting your search parameters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequirements}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <NodeCard
              item={item}
              index={index}
              onApply={() => handleApply(item._id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: COLORS.grey,
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  headerGradient: { paddingTop: 60, paddingBottom: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
    fontWeight: "600",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  searchContainer: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  searchIcon: {
    paddingLeft: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    color: COLORS.white,
    fontSize: 15,
  },
  clearIcon: {
    padding: 14,
  },
  listContainer: { padding: 20, paddingBottom: 100 },
  emptyIcon: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptySubText: { color: COLORS.grey, fontSize: 14, textAlign: "center" },
});
