import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface LedgerState {
  inbound: any[];
  outbound: any[];
  isLoading: boolean;
  
  // Actions
  fetchLedger: (userId: string) => Promise<void>;
  updateRequest: (requestId: string, status: 'accepted' | 'rejected' | 'withdrawn') => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  inbound: [],
  outbound: [],
  isLoading: false,

  fetchLedger: async (userId: string) => {
    set({ isLoading: true });
    try {
      // 1. Fetch Inbound (People wanting to join your teams)
      const { data: inboundData } = await supabase
        .from('swipes')
        .select(`
          id, status, created_at,
          profiles:swiper_id (github_handle, training_ground, ai_primary_stack),
          teams:team_id (project_name)
        `)
        .eq('teams.founder_id', userId)
        .eq('status', 'pending');

      // 2. Fetch Outbound (Teams you swiped right on)
      const { data: outboundData } = await supabase
        .from('swipes')
        .select(`
          id, status, created_at,
          teams:team_id (project_name, founder_github, required_skills)
        `)
        .eq('swiper_id', userId);

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
  }
}));