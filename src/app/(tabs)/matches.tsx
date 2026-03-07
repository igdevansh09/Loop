import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function MatchesScreen() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.rpc("get_my_team_requests", {
      founder_uuid: user.id,
    });

    if (error) console.error(error);
    else setRequests(data || []);
  };

  const handleDecision = async (
    swipeId: string,
    status: "accepted" | "rejected",
  ) => {
    const { error } = await supabase
      .from("swipes")
      .update({ status })
      .eq("id", swipeId);

    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Success", `Request ${status}!`);
      fetchRequests();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inbound Talent</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.swipe_id}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <Text style={styles.teamName}>Project: {item.team_name}</Text>
            <Text style={styles.devHandle}>@{item.developer_handle}</Text>
            <Text style={styles.devProfile}>{item.developer_profile}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#00ff00" }]}
                onPress={() => handleDecision(item.swipe_id, "accepted")}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#ff4444" }]}
                onPress={() => handleDecision(item.swipe_id, "rejected")}
              >
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: { fontSize: 32, fontWeight: "900", color: "#fff", marginBottom: 20 },
  requestCard: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#00ff00",
  },
  teamName: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  devHandle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 5,
  },
  devProfile: { color: "#bbb", fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: "row", marginTop: 15, gap: 10 },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "bold" },
});
