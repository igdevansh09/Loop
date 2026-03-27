import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface LaunchState {
  projectName: string;
  hackathonUrl: string;
  requiredSkills: string[];
  capacity: string;
  college: string;
  gender: string;
  communityUrl: string;
  description: string;

  skillSuggestions: string[];
  isFetchingSkills: boolean;
  isSubmitting: boolean;

  setField: (field: string, value: any) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  fetchSkillSuggestions: (query: string) => Promise<void>;
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
  isSubmitting: false,
};

export const useLaunchStore = create<LaunchState>((set, get) => ({
  ...initialState,

  setField: (field, value) => set({ [field]: value }),

  addSkill: (skill) =>
    set((state) => ({
      requiredSkills: [...state.requiredSkills, skill],
      skillSuggestions: [],
    })),

  removeSkill: (skill) =>
    set((state) => ({
      requiredSkills: state.requiredSkills.filter((s) => s !== skill),
    })),

  fetchSkillSuggestions: async (query: string) => {
    if (query.length < 2) {
      set({ skillSuggestions: [] });
      return;
    }
    set({ isFetchingSkills: true });
    try {
      const res = await fetch(
        `https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&inname=${encodeURIComponent(query)}&site=stackoverflow&pagesize=5`,
      );
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

  launchTeam: async (founderId: string, founderGithub: string) => {
    const state = get();
    set({ isSubmitting: true });
    try {
      const { error } = await supabase.from("teams").insert({
        founder_id: founderId,
        founder_github: founderGithub,
        project_name: state.projectName,
        project_description: state.description,
        required_skills: state.requiredSkills.join(", "),
        hackathon_url: state.hackathonUrl,
        private_community_url: state.communityUrl,
        max_capacity: parseInt(state.capacity) || 4,
        required_college: state.college,
        gender_requirement: state.gender,
      });

      if (error) throw error;
      get().resetState();
    } catch (err: any) {
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  resetState: () => set({ ...initialState }),
}));
