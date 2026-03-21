import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";

interface LedgerState {
  inbound: any[];
  outbound: any[];
  isLoading: boolean;
  
  // Actions
  fetchLedger: (userId: string) => Promise<void>;
  updateRequest: (requestId: string, status: 'accepted' | 'rejected' | 'withdrawn') => Promise<void>;
  triggerKillswitch: (teamId: string) => Promise<void>;
  updateCapacity: (teamId: string, newCapacity: number) => Promise<void>;
  myTeams: any[];
  fetchMyTeams: (userId: string) => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  inbound: [],
  outbound: [],
  isLoading: false,
  myTeams: [],

  fetchLedger: async (userId: string) => {
    set({ isLoading: true });
    try {
      // 1. Fetch Inbound (People wanting to join your teams)
      const { data: inboundData, error: inboundError } = await supabase
        .from('swipes')
        .select(`
          id, status, created_at,
          profiles:swiper_id (github_handle, training_ground, ai_primary_stack, ai_assessment, ai_weekend_build),
          teams!inner (project_name, founder_id) 
        `)
        .eq('teams.founder_id', userId)
        .eq('status', 'pending');

      if (inboundError) console.error("Inbound Error:", inboundError);

      // 2. Fetch Outbound (Teams you swiped right on)
      const { data: outboundData, error: outboundError } = await supabase
        .from('swipes')
        .select(`
          id, status, created_at,
          teams:team_id (project_name, founder_github, required_skills, private_community_url)
        `)
        .eq('swiper_id', userId);
        
      if (outboundError) console.error("Outbound Error:", outboundError);

      set({ 
        inbound: inboundData || [], 
        outbound: outboundData || [] 
      });
    } catch (err) {
      console.error("Ledger Fetch Error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateRequest: async (requestId, status) => {
    try {
      if (status === 'withdrawn') {
        await supabase.from('swipes').delete().eq('id', requestId);
      } else {
        await supabase.from('swipes').update({ status }).eq('id', requestId);
      }
      // Refresh local state
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) get().fetchLedger(userId);
    } catch (err) {
      console.error("Update Action Failed:", err);
    }
  },

  // 🚀 Action 1: Terminate the Project
  triggerKillswitch: async (teamId: string) => {
  // 🚀 OPTIMISTIC UPDATE: Change state instantly in the UI
  const previousTeams = get().myTeams;
  const optimisticTeams = previousTeams.map(t => 
    t.id === teamId ? { ...t, is_active: false } : t
  );
  set({ myTeams: optimisticTeams });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { error } = await supabase.rpc("manual_killswitch", {
      p_team_id: teamId,
      p_founder_id: user.id,
    });

    if (error) throw error;
    
    // Final sync to ensure headcount and status are perfect
    get().fetchMyTeams(user.id);
  } catch (err) {
    console.error("Killswitch Failed:", err);
    // Rollback on failure
    set({ myTeams: previousTeams });
    Alert.alert("SYSTEM_ERROR", "Failed to terminate link. Connection unstable.");
  }
},

updateCapacity: async (teamId: string, newCapacity: number) => {
  // 🚀 OPTIMISTIC UPDATE: Adjust capacity instantly
  const previousTeams = get().myTeams;
  const optimisticTeams = previousTeams.map(t => 
    t.id === teamId ? { ...t, max_capacity: newCapacity } : t
  );
  set({ myTeams: optimisticTeams });

  try {
    const { data: { user } } = await supabase.auth.getUser();
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
    .from('teams')
    .select(`
      *,
      accepted_count:swipes(count)
    `)
    .eq('founder_id', userId)
    .eq('swipes.status', 'accepted'); // This gets the count of accepted members

  if (!error) set({ myTeams: data || [] });
},
}));