import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";

export default function FeedScreen() {
  const { userId: clerkId } = useAuth(); // Get the string ID from Clerk
  
  // Bridge the gap: Ask Convex for the internal User ID
  const currentUser = useQuery(api.users.getCurrentUser, { 
    clerkId: clerkId ?? undefined 
  });
  
  const requirements = useQuery(api.requirements.getOpenRequirements);
  const applyMutation = useMutation(api.applications.apply);

  const handleApply = async (requirementId: any) => {
    if (!currentUser) {
      Alert.alert("Hold on", "Your profile is still syncing with the database.");
      return;
    }

    try {
      // Now you satisfy the exact TypeScript definition
      await applyMutation({ 
        requirementId: requirementId,
        applicantId: currentUser._id, 
      });
      Alert.alert("Success", "Application submitted securely.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not apply.");
    }
  };

  if (requirements === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (requirements.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="terminal-outline" size={48} color={COLORS.surfaceLight} />
        <Text style={styles.emptyText}>No open nodes found.</Text>
        <Text style={styles.emptySubText}>Be the first to create a requirement.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        {item.creator.collegeName && (
          <View style={styles.collegeBadge}>
            <Ionicons name="school" size={12} color={COLORS.background} />
            <Text style={styles.collegeText}>{item.creator.collegeName}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.techStackContainer}>
        {item.techStack.map((tech: string, index: number) => (
          <View key={index} style={styles.techBadge}>
            <Text style={styles.techText}>{tech}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.applyButton} 
        onPress={() => handleApply(item._id)}
        activeOpacity={0.8}
      >
        <Text style={styles.applyButtonText}>Apply with GitHub Profile</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Nodes</Text>
      </View>
      <FlatList
        data={requirements}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.white,
    fontFamily: "JetBrainsMono-Medium",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Space for native tabs
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
    marginRight: 12,
  },
  collegeBadge: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  collegeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.background,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 16,
    lineHeight: 20,
  },
  techStackContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 8,
  },
  techBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  techText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "JetBrainsMono-Medium",
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  applyButtonText: {
    color: COLORS.background,
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubText: {
    color: COLORS.grey,
    marginTop: 8,
  },
});