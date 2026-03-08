import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface LaunchState {
  // Form State
  projectName: string;
  hackathonUrl: string;
  requiredSkills: string[];
  capacity: string;
  college: string;
  gender: string;
  communityUrl: string;
  description: string;
  
  // API & Calibrator State
  skillSuggestions: string[];
  isFetchingSkills: boolean;
  isAnalyzing: boolean;
  isSubmitting: boolean;
  signalScore: number | null;
  aiFeedback: string | null;
  vectorData: any | null;

  // Actions
  setField: (field: string, value: any) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  fetchSkillSuggestions: (query: string) => Promise<void>;
  analyzeSignal: (description: string) => Promise<boolean>;
  launchTeam: (founderId: string, founderGithub: string) => Promise<void>;
  resetState: () => void;
}

const initialState = {
  projectName: "",
  hackathonUrl: "",
  requiredSkills: [],
  capacity: "4",
  college: "Any",
  gender: "Any",
  communityUrl: "",
  description: "",
  skillSuggestions: [],
  isFetchingSkills: false,
  isAnalyzing: false,
  isSubmitting: false,
  signalScore: null,
  aiFeedback: null,
  vectorData: null,
};

export const useLaunchStore = create<LaunchState>((set, get) => ({
  ...initialState,
  isAnalyzing: false,
  isSubmitting: false,
  signalScore: null,
  aiFeedback: "",
  vectorData: null,

  setField: (field, value) => set({ [field]: value }),

  addSkill: (skill) => set((state) => ({ 
    requiredSkills: [...state.requiredSkills, skill],
    skillSuggestions: [] // Clear suggestions on add
  })),

  removeSkill: (skill) => set((state) => ({
    requiredSkills: state.requiredSkills.filter((s) => s !== skill)
  })),

  fetchSkillSuggestions: async (query: string) => {
    if (query.length < 2) {
      set({ skillSuggestions: [] });
      return;
    }
    set({ isFetchingSkills: true });
    try {
      const res = await fetch(`https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&inname=${encodeURIComponent(query)}&site=stackoverflow&pagesize=5`);
      const data = await res.json();
      if (data.items) {
        set({ skillSuggestions: data.items.map((item: any) => item.name) });
      }
    } catch (err) {
      console.error("StackOverflow Fetch Error:", err);
    } finally {
      set({ isFetchingSkills: false });
    }
  },

  analyzeSignal: async (description: string) => {
    set({ isAnalyzing: true, aiFeedback: "", signalScore: null });
    try {
      // 1. FORCE EXTRACT THE FRESHEST TOKEN
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication missing. The Gateway rejected you.");
      }

      // 2. INJECT IT DIRECTLY INTO THE HEADERS
      const { data, error } = await supabase.functions.invoke("analyze-signal", {
        body: { text: description },
        headers: {
          Authorization: `Bearer ${session.access_token}`, // Force the JWT
        }
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

  launchTeam: async (founderId: string, founderGithub: string) => {
    const state = get();
    set({ isSubmitting: true });
    try {
      // 🚀 FIXED: Store handles pulling its own data for the insert
      const { error } = await supabase.from("teams").insert({
        founder_id: founderId,
        founder_github: founderGithub,
        project_name: state.projectName,
        project_description: state.description,
        required_skills: state.requiredSkills.join(", "),
        requirement_embedding: state.vectorData,
        hackathon_url: state.hackathonUrl,
        private_community_url: state.communityUrl,
        max_capacity: parseInt(state.capacity) || 4,
        required_college: state.college,
        gender_requirement: state.gender,
      });

      if (error) throw error;
      get().resetState(); // Clear form on success
    } catch (err: any) {
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },
  resetState: () => set({ ...initialState }),
}));