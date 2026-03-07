import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// 1. 🛡️ The Strict Payload Contract
export interface TeamPayload {
  founder_id: string;
  founder_github: string;
  project_name: string;
  project_description: string;
  required_skills: string;
  requirement_embedding: number[];
  hackathon_url: string;
  private_community_url: string;
  max_capacity: number;
  required_college: string;
  gender_requirement: string;
}

interface LaunchState {
  isAnalyzing: boolean;
  isSubmitting: boolean;
  signalScore: number | null;
  aiFeedback: string;
  vectorData: number[] | null;

  analyzeSignal: (description: string) => Promise<boolean>;
  launchTeam: (payload: TeamPayload) => Promise<boolean>; // No more 'any'
  resetState: () => void;
}

export const useLaunchStore = create<LaunchState>((set, get) => ({
  isAnalyzing: false,
  isSubmitting: false,
  signalScore: null,
  aiFeedback: "",
  vectorData: null,

  analyzeSignal: async (description: string) => {
    set({ isAnalyzing: true, aiFeedback: "", signalScore: null });
    try {
      const { data, error } = await supabase.functions.invoke("analyze-signal", {
        body: { text: description },
      });

      if (error) throw error;

      set({
        signalScore: data.score,
        aiFeedback: data.feedback,
        vectorData: data.vector,
      });
      
      return data.score > 85;
    } catch (err: unknown) {
      const error = err as Error;
      set({ aiFeedback: error.message || "NETWORK ERROR: Signal lost to Calibrator." });
      return false;
    } finally {
      set({ isAnalyzing: false });
    }
  },

  launchTeam: async (payload: TeamPayload) => {
    set({ isSubmitting: true });
    try {
      const { error } = await supabase.from("teams").insert(payload);
      if (error) throw error;
      
      get().resetState(); 
      return true;
    } catch (err: unknown) {
      throw err; 
    } finally {
      set({ isSubmitting: false });
    }
  },

  resetState: () => {
    set({
      isAnalyzing: false,
      isSubmitting: false,
      signalScore: null,
      aiFeedback: "",
      vectorData: null,
    });
  }
}));