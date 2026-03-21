import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface ArenaState {
  teams: any[];
  isLoading: boolean;
  isForging: boolean;
  
  // Actions
  setForging: (status: boolean) => void;
  fetchMatches: (userId: string) => Promise<void>;
  processSwipe: (userId: string, teamId: string, direction: "left" | "right") => Promise<void>;
}

export const useArenaStore = create<ArenaState>((set) => ({
  teams: [],
  isLoading: true,
  isForging: false,

  setForging: (status) => set({ isForging: status }),

  fetchMatches: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc("match_teams_for_user", {
        current_user_id: userId,
        match_count: 10,
      });

      if (error) throw error;
      set({ teams: data || [] });
    } catch (err: any) {
      console.error("Match Fetch Error:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  processSwipe: async (userId: string, teamId: string, direction: "left" | "right") => {
    // The Swiper UI physically removes the card instantly (Optimistic UI), 
    // so we just handle the database transaction quietly in the background.
    try {
      const { error } = await supabase.from("swipes").insert({
        swiper_id: userId,
        team_id: teamId,
        direction: direction,
        status: direction === "right" ? "pending" : "rejected",
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Swipe logging failed:", err.message);
    }
  },
}));