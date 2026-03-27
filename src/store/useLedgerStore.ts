import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";
import { useAlertStore } from "./useAlertStore";

interface LedgerState {
  inbound: any[];
  outbound: any[];
  isLoading: boolean;
  myTeams: any[];

  fetchLedger: (userId: string) => Promise<void>;
  updateRequest: (
    requestId: string,
    status: "accepted" | "rejected" | "withdrawn",
  ) => Promise<void>;
  triggerKillswitch: (teamId: string) => Promise<void>;
  updateCapacity: (teamId: string, newCapacity: number) => Promise<void>;
  fetchMyTeams: (userId: string) => Promise<void>;

  // 🚀 REAL-TIME PROTOCOLS ADDED
  subscribeToLedger: (userId: string) => void;
  unsubscribeFromLedger: () => void;
}

let realtimeChannel: any = null;

export const useLedgerStore = create<LedgerState>((set, get) => ({
  inbound: [],
  outbound: [],
  isLoading: false,
  myTeams: [],

  fetchLedger: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data: inboundData, error: inboundError } = await supabase
        .from("swipes")
        .select(
          `
          id, status, created_at,
          profiles:swiper_id (github_handle, training_ground, ai_primary_stack, ai_assessment, ai_weekend_build),
          teams!inner (project_name, founder_id) 
        `,
        )
        .eq("teams.founder_id", userId)
        .eq("status", "pending");

      if (inboundError) console.error("Inbound Error:", inboundError);

      const { data: outboundData, error: outboundError } = await supabase
        .from("swipes")
        .select(
          `
          id, status, created_at,
          teams:team_id (project_name, founder_github, required_skills, private_community_url)
        `,
        )
        .eq("swiper_id", userId);

      if (outboundError) console.error("Outbound Error:", outboundError);

      set({
        inbound: inboundData || [],
        outbound: outboundData || [],
      });
    } catch (err) {
      console.error("Ledger Fetch Error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateRequest: async (requestId, status) => {
    // 🚀 PROBLEM #3 FIX: OPTIMISTIC UI UPDATES
    // Remove the card from the screen INSTANTLY before talking to the database
    const prevOutbound = get().outbound;
    const prevInbound = get().inbound;

    if (status === "withdrawn") {
      set({ outbound: prevOutbound.filter((req) => req.id !== requestId) });
    } else {
      set({ inbound: prevInbound.filter((req) => req.id !== requestId) });
    }

    try {
      let err = null;

      // 🚀 FIXED: We now EXPLICITLY check for database errors
      if (status === "withdrawn") {
        const { error } = await supabase
          .from("swipes")
          .delete()
          .eq("id", requestId);
        err = error;
      } else {
        const { error } = await supabase
          .from("swipes")
          .update({ status })
          .eq("id", requestId);
        err = error;
      }

      if (err) throw err; // Throw it so the catch block handles it
    } catch (err: any) {
      console.error("Update Action Failed:", err.message);

      // ROLLBACK: If database failed (e.g., RLS blocked it), put the cards back on screen
      set({ outbound: prevOutbound, inbound: prevInbound });

      useAlertStore
        .getState()
        .showAlert(
          "TRANSMISSION FAILED",
          "Database rejected the request. Check your Supabase RLS policies for the 'swipes' table.",
          "error"
        );
    }
  },

  triggerKillswitch: async (teamId: string) => {
    const previousTeams = get().myTeams;
    const optimisticTeams = previousTeams.map((t) =>
      t.id === teamId ? { ...t, is_active: false } : t,
    );
    set({ myTeams: optimisticTeams });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      const { error } = await supabase.rpc("manual_killswitch", {
        p_team_id: teamId,
        p_founder_id: user.id,
      });

      if (error) throw error;
      get().fetchMyTeams(user.id);
    } catch (err) {
      console.error("Killswitch Failed:", err);
      set({ myTeams: previousTeams });
      useAlertStore
        .getState()
        .showAlert(
          "SYSTEM_ERROR",
          "Failed to terminate link. Connection unstable.",
          "error",
        );
    }
  },

  updateCapacity: async (teamId: string, newCapacity: number) => {
    const previousTeams = get().myTeams;
    const optimisticTeams = previousTeams.map((t) =>
      t.id === teamId ? { ...t, max_capacity: newCapacity } : t,
    );
    set({ myTeams: optimisticTeams });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      const { error } = await supabase.rpc("update_team_capacity", {
        p_team_id: teamId,
        p_founder_id: user.id,
        new_capacity: newCapacity,
      });

      if (error) throw error;
      get().fetchMyTeams(user.id);
    } catch (err) {
      set({ myTeams: previousTeams });
      console.error("Capacity Override Failed:", err);
    }
  },

  fetchMyTeams: async (userId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select(
        `
        *,
        accepted_count:swipes(count)
      `,
      )
      .eq("founder_id", userId)
      .eq("swipes.status", "accepted");

    if (!error) set({ myTeams: data || [] });
  },

  // =========================================================
  // 🚀 PROBLEM #5 FIX: REAL-TIME RADAR PROTOCOLS
  // =========================================================
  subscribeToLedger: (userId: string) => {
    if (realtimeChannel) return; // Ignore if already listening

    console.log("UPLINK: Establishing Real-time Ledger Connection...");

    realtimeChannel = supabase
      .channel("ledger_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "swipes" },
        (payload) => {
          console.log("REALTIME SIGNAL DETECTED:", payload.eventType);
          // Silently sync the latest data in the background
          get().fetchLedger(userId);
        },
      )
      .subscribe();
  },

  unsubscribeFromLedger: () => {
    if (realtimeChannel) {
      console.log("UPLINK: Severing Real-time Ledger Connection...");
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
}));
