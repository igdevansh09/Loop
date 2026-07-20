import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { useNetworkStore } from "./useNetworkStore";
import { useAlertStore } from "./useAlertStore";

interface ArenaState {
  teams: any[];
  isLoading: boolean;
  isForging: boolean;

  setForging: (status: boolean) => void;
  fetchMatches: (userId: string) => Promise<void>;
  processSwipe: (
    userId: string,
    teamId: string,
    direction: "left" | "right",
  ) => Promise<void>;

  removeTeamFromDeck: (teamId: string) => void;
}

export const useArenaStore = create<ArenaState>()(
  persist(
    (set) => ({
      teams: [],
      isLoading: true,
      isForging: false,

      setForging: (status) => set({ isForging: status }),

      removeTeamFromDeck: (teamId) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== teamId),
        })),

      fetchMatches: async (userId: string) => {
        if (useNetworkStore.getState().isOffline) {
          console.log(
            "SYSTEM OFFLINE: Bypassing fetchMatches, utilizing local cache.",
          );
          set({ isLoading: false });
          return;
        }

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

      processSwipe: async (
        userId: string,
        teamId: string,
        direction: "left" | "right",
      ) => {
        if (useNetworkStore.getState().isOffline) {
          useAlertStore
            .getState()
            .showAlert(
              "NETWORK FAILURE",
              "Cannot transmit swipe signal. Connect to the grid to continue.",
              "error",
            );
          return;
        }

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
    }),
    {
      name: "arena-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        teams: state.teams,
      }),
    },
  ),
);
