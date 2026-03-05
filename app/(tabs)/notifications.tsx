import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function LedgerScreen() {
  const { userId: clerkId } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, { clerkId: clerkId ?? undefined });
  
  const [activeTab, setActiveTab] = useState<"outbound" | "inbound">("outbound");

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction Ledger</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "outbound" && styles.activeTab]} 
          onPress={() => setActiveTab("outbound")}
        >
          <Text style={[styles.tabText, activeTab === "outbound" && styles.activeTabText]}>Outbound (Applied)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "inbound" && styles.activeTab]} 
          onPress={() => setActiveTab("inbound")}
        >
          <Text style={[styles.tabText, activeTab === "inbound" && styles.activeTabText]}>Inbound (Created)</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "outbound" ? (
        <OutboundLedger userId={currentUser._id} />
      ) : (
        <InboundLedger userId={currentUser._id} />
      )}
    </View>
  );
}

// ------------------------------------------------------------------
// OUTBOUND: Applications the user has submitted
// ------------------------------------------------------------------
function OutboundLedger({ userId }: { userId: any }) {
  const applications = useQuery(api.applications.getMyApplications, { applicantId: userId });

  if (applications === undefined) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  // TS Safety: Filter out any null entries caused by deleted nodes
  const validApplications = applications.filter((app) => app !== null);

  if (validApplications.length === 0) return <EmptyState message="You haven't applied to any nodes yet." />;

  return (
    <FlatList
      data={validApplications}
      // Use optional chaining fallback for the key extractor just in case
      keyExtractor={(item) => item?._id ?? Math.random().toString()}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => {
        // Strict Null Check for TypeScript
        if (!item) return null;

        return (
          <View style={styles.card}>
            <Text style={styles.nodeTitle}>{item.requirement?.title || "Unknown Node"}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(item.status) }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            
            {item.status === "accepted" && item.requirement?.commsLink && (
              <TouchableOpacity 
                style={styles.commsButton}
                onPress={() => Linking.openURL(item.requirement!.commsLink!)}
              >
                <Ionicons name="link" size={16} color={COLORS.background} />
                <Text style={styles.commsButtonText}>Join Team Comms</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

// ------------------------------------------------------------------
// INBOUND: Nodes the user created and the pending applicants
// ------------------------------------------------------------------
function InboundLedger({ userId }: { userId: any }) {
  const requirements = useQuery(api.requirements.getRequirementsByUser, { userId });

  if (requirements === undefined) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;
  if (requirements.length === 0) return <EmptyState message="You haven't initialized any nodes." />;

  return (
    <FlatList
      data={requirements}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <View style={[styles.card, { borderColor: item.status === "filled" ? COLORS.surfaceLight : COLORS.primary }]}>
          <View style={styles.inboundHeader}>
            <Text style={styles.nodeTitle}>{item.title}</Text>
            <Text style={[styles.nodeStatus, { color: item.status === "filled" ? COLORS.grey : COLORS.primary }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          {/* Sub-component to fetch and render applicants for this specific node */}
          <ApplicantsList requirementId={item._id} nodeStatus={item.status} />
        </View>
      )}
    />
  );
}

// ------------------------------------------------------------------
// APPLICANTS LIST: Fetches applicants for a specific node
// ------------------------------------------------------------------
function ApplicantsList({ requirementId, nodeStatus }: { requirementId: any, nodeStatus: string }) {
  const applicants = useQuery(api.applications.getApplicationsForRequirement, { requirementId });
  const updateStatus = useMutation(api.applications.updateStatus);

  if (applicants === undefined) return <ActivityIndicator size="small" color={COLORS.grey} style={{ marginTop: 10 }} />;
  if (applicants.length === 0) return <Text style={styles.noApplicants}>No pending applications.</Text>;

  const handleAction = async (applicationId: any, action: "accepted" | "rejected") => {
    try {
      await updateStatus({ applicationId, status: action });
      Alert.alert("Resolved", `Candidate ${action}.`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.applicantsContainer}>
      {applicants.map((app) => (
        <View key={app._id} style={styles.applicantRow}>
          <View style={styles.applicantHeader}>
            <View style={styles.applicantInfo}>
              <Ionicons name="logo-github" size={16} color={COLORS.white} />
              <Text style={styles.applicantName}>
                {app.applicant?.githubUsername || "Unknown"}
              </Text>
            </View>

            {app.status === "pending" && nodeStatus === "open" ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleAction(app._id, "rejected")}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAction(app._id, "accepted")}
                >
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={[
                  styles.statusValue,
                  { color: getStatusColor(app.status), fontSize: 12 },
                ]}
              >
                {app.status.toUpperCase()}
              </Text>
            )}
          </View>

          {/* THE AI SUMMARY INJECTION */}
          <View style={styles.aiContainer}>
            <Ionicons name="hardware-chip" size={14} color={COLORS.secondary} />
            <Text style={styles.aiText}>
              {app.aiSummary || "Auditing GitHub footprint..."}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------
// UTILS & STYLES
// ------------------------------------------------------------------
const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted": return COLORS.primary;
    case "rejected": return "#EF4444"; // Terminal Red
    default: return COLORS.secondary; // Pending
  }
};

const EmptyState = ({ message }: { message: string }) => (
  <View style={styles.center}>
    <Ionicons name="folder-open-outline" size={48} color={COLORS.surfaceLight} />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.white,
    fontFamily: "JetBrainsMono-Medium",
  },
  loader: { marginTop: 40 },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.surfaceLight,
  },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: {
    color: COLORS.grey,
    fontWeight: "bold",
    fontFamily: "JetBrainsMono-Medium",
  },
  activeTabText: { color: COLORS.primary },

  listContainer: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    fontFamily: "JetBrainsMono-Medium",
    marginBottom: 8,
  },

  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  statusLabel: { color: COLORS.grey, fontSize: 14, marginRight: 8 },
  statusValue: {
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "JetBrainsMono-Medium",
  },

  commsButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
    gap: 8,
  },
  commsButtonText: {
    color: COLORS.background,
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "JetBrainsMono-Medium",
  },

  inboundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    paddingBottom: 12,
    marginBottom: 12,
  },
  nodeStatus: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "JetBrainsMono-Medium",
  },

  noApplicants: {
    color: COLORS.grey,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
  },
  applicantsContainer: { marginTop: 8 },
  applicantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  applicantInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  applicantName: { color: COLORS.white, fontSize: 14, fontWeight: "bold" },

  actionButtons: { flexDirection: "row", gap: 8 },
  rejectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  rejectBtnText: { color: "#EF4444", fontSize: 12, fontWeight: "bold" },
  acceptBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  acceptBtnText: { color: COLORS.background, fontSize: 12, fontWeight: "bold" },

  emptyText: {
    color: COLORS.surfaceLight,
    fontSize: 16,
    marginTop: 12,
    fontStyle: "italic",
  },
  applicantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  aiContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 6,
    gap: 8,
    marginTop: 4,
  },
  aiText: {
    color: COLORS.grey,
    fontSize: 12,
    flex: 1,
    fontFamily: "JetBrainsMono-Medium",
    lineHeight: 18,
  },
});