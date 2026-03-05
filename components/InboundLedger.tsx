import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return COLORS.primary;
    case "rejected":
      return "#EF4444";
    default:
      return COLORS.secondary;
  }
};

function ApplicantsList({
  requirementId,
  nodeStatus,
}: {
  requirementId: any;
  nodeStatus: string;
}) {
  const applicants = useQuery(api.applications.getApplicationsForRequirement, {
    requirementId,
  });
  const updateStatus = useMutation(api.applications.updateStatus);

  if (applicants === undefined)
    return (
      <ActivityIndicator
        size="small"
        color={COLORS.surfaceLight}
        style={{ marginTop: 10 }}
      />
    );
  if (applicants.length === 0)
    return (
      <Text style={styles.noApplicants}>Awaiting inbound connections...</Text>
    );

  const handleAction = async (
    applicationId: any,
    action: "accepted" | "rejected",
  ) => {
    try {
      await updateStatus({ applicationId, status: action });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const openGitHub = (username?: string) => {
    if (username && username !== "Unknown") {
      Linking.openURL(`https://github.com/${username}`);
    }
  };

  return (
    <View style={styles.applicantsContainer}>
      {applicants.map((app) => (
        <View key={app._id} style={styles.applicantRow}>
          <View style={styles.applicantHeader}>
            <View style={styles.applicantIdentityWrapper}>
              {/* Clickable GitHub Username */}
              <TouchableOpacity
                style={styles.applicantInfo}
                onPress={() => openGitHub(app.applicant?.githubUsername)}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-github" size={16} color={COLORS.white} />
                <Text style={styles.applicantName}>
                  {app.applicant?.githubUsername || "Unknown"}
                </Text>
                <Ionicons name="open-outline" size={12} color={COLORS.grey} />
              </TouchableOpacity>

              {/* College Tag */}
              {app.applicant?.collegeName && (
                <View style={styles.collegeBadge}>
                  <Ionicons name="school" size={10} color={COLORS.background} />
                  <Text style={styles.badgeText}>
                    {app.applicant.collegeName}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionContainer}>
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
                    { color: getStatusColor(app.status) },
                  ]}
                >
                  {app.status.toUpperCase()}
                </Text>
              )}
            </View>
          </View>

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

function AnimatedInboundCard({ item, index, onDelete, userId }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor:
            item.status === "filled" ? COLORS.surfaceLight : COLORS.primary,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.inboundHeader}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.nodeTitle}>{item.title}</Text>
          <Text
            style={[
              styles.nodeStatus,
              {
                color: item.status === "filled" ? COLORS.grey : COLORS.primary,
              },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(item._id)}
          style={styles.deleteNodeBtn}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <ApplicantsList requirementId={item._id} nodeStatus={item.status} />
    </Animated.View>
  );
}

export default function InboundLedger({ userId }: { userId: any }) {
  const requirements = useQuery(api.requirements.getRequirementsByUser, {
    userId,
  });
  const deleteRequirement = useMutation(api.requirements.deleteRequirement);

  const handleDelete = (requirementId: any) => {
    Alert.alert(
      "Terminate Node?",
      "This permanently wipes the node and its applications.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Terminate",
          style: "destructive",
          onPress: () => deleteRequirement({ requirementId, userId }),
        },
      ],
    );
  };

  if (requirements === undefined)
    return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;
  if (requirements.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="server-outline" size={48} color={COLORS.surfaceLight} />
        <Text style={styles.emptyText}>No inbound nodes deployed.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requirements}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item, index }) => (
        <AnimatedInboundCard
          item={item}
          index={index}
          onDelete={handleDelete}
          userId={userId}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: COLORS.grey, marginTop: 16, fontWeight: "600" },
  listContainer: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inboundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    paddingBottom: 12,
    marginBottom: 12,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  nodeStatus: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  deleteNodeBtn: {
    padding: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },

  noApplicants: {
    color: COLORS.grey,
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
  },
  applicantsContainer: { marginTop: 4 },
  applicantRow: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  applicantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  applicantIdentityWrapper: {
    flex: 1,
    gap: 6,
    alignItems: "flex-start",
  },
  applicantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  applicantName: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  collegeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.background,
    textTransform: "uppercase",
  },

  actionContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingTop: 2,
  },
  actionButtons: { flexDirection: "row", gap: 8 },
  rejectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  rejectBtnText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  acceptBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  acceptBtnText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusValue: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },

  aiContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 6,
    gap: 8,
    marginTop: 8,
    alignItems: "flex-start",
  },
  aiText: {
    color: COLORS.grey,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },
});
