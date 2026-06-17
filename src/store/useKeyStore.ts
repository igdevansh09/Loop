import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface KeyState {
  userApiKey: string | null;
  saveKey: (key: string) => Promise<void>;
  loadKey: () => Promise<void>;
  removeKey: () => Promise<void>;
}

export const useKeyStore = create<KeyState>((set) => ({
  userApiKey: null,

  saveKey: async (key: string) => {
    await SecureStore.setItemAsync("user_gemini_key", key);
    set({ userApiKey: key });
  },

  loadKey: async () => {
    const key = await SecureStore.getItemAsync("user_gemini_key");
    set({ userApiKey: key });
  },

  removeKey: async () => {
    await SecureStore.deleteItemAsync("user_gemini_key");
    set({ userApiKey: null });
  },
}));
