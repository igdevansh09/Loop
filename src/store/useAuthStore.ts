import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  Alert,
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  Platform,
} from "react-native";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';


export async function registerForPushNotificationsAsync() {
  let token;

  // 🚀 1. MUST BE DONE FIRST FOR ANDROID: Set up the OS-level channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "Failed to get push token for push notification! User denied.",
      );
      return undefined;
    }

    // 🚀 2. Grab the token using your EAS Project ID
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn("EAS Project ID is missing from app.json!");
      return undefined;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.error("Native Token Fetch Failed:", e);
      throw e; // Let the blast shield in useAuthStore catch this
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}


// Required to make sure the web browser closes automatically when auth finishes
WebBrowser.maybeCompleteAuthSession();

export interface GithubStats {
  repoCount: number;
  totalStars: number;
  topLanguages: { lang: string; percentage: number }[];
}

// 1. 🛡️ Strict Database Schema Contract (This fixes your error)
export interface UserProfile {
  id: string;
  training_ground: string | null;
  available_hours_per_day: number | null;
  raw_github_data: any | null; 
  ai_assessment: string | null;     // Moved here
  ai_primary_stack: string | null;  // Moved here
  ai_weekend_build: string | null;  // Moved here
  [key: string]: any; // Catch-all for other Supabase columns
}

// 2. 🛡️ Enforce the full shape of the store
interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  hasSeenOnboarding: boolean;
  isAuthenticating: boolean;
  initializeAuth: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  burnTrainingGround: (collegeName: string) => Promise<boolean>;
  generateAiProfile: () => Promise<boolean>;
  githubStats: GithubStats | null;
  deleteAccount: () => Promise<boolean>;
  registerDeviceToken: () => Promise<void>;
  isGeneratingProfile: boolean; // 🚀 ADD THIS
}

// Global trackers to prevent listener memory leaks during re-renders
let appStateListener: NativeEventSubscription | null = null;
let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

// 3. 🛡️ Inject 'get' alongside 'set' to access sibling actions safely
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,
  hasSeenOnboarding: false,
  isAuthenticating: false,
  isGeneratingProfile: false, // 🚀 ADD THIS
  githubStats: null,

  initializeAuth: async () => {
    try {
      // Prevent duplicate event listeners
      if (!appStateListener) {
        appStateListener = AppState.addEventListener(
          "change",
          (state: AppStateStatus) => {
            if (state === "active") {
              supabase.auth.startAutoRefresh();
            } else {
              supabase.auth.stopAutoRefresh();
            }
          },
        );
      }

      const onboarded = await AsyncStorage.getItem("hasSeenOnboarding");
      const hasSeenOnboarding = onboarded === "true";

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) console.error("Zustand Auth Error:", error.message);

      set({
        session,
        user: session?.user || null,
        isInitialized: true,
        hasSeenOnboarding,
      });

      // Fetch profile on initial load if user exists
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      }

      // Prevent duplicate auth listeners
      if (!authListener) {
        authListener = supabase.auth.onAuthStateChange((event, newSession) => {
          if (
            event === "SIGNED_OUT" ||
            (event === "USER_UPDATED" && !newSession)
          ) {
            set({ session: null, user: null, profile: null });
          } else {
            set({ session: newSession, user: newSession?.user || null });
            if (newSession?.user) {
              get().fetchProfile(newSession.user.id);
            }
          }
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error(error.message);
      set({ isInitialized: true });
    }
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    set({ hasSeenOnboarding: true });
  },

  loginWithGithub: async () => {
    set({ isAuthenticating: true });
    let isSuccess = false; // 🚀 1. Track success to prevent UI glitch

    try {
      const redirectUrl = Linking.createURL("");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url)
        throw new Error("Supabase failed to generate an OAuth URL.");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
      );

      if (result.type === "success" && result.url) {
        // ... (Your existing URL parsing logic) ...
        const hashIndex = result.url.indexOf("#");
        const queryIndex = result.url.indexOf("?");

        let paramsString = "";
        if (hashIndex !== -1)
          paramsString = result.url.substring(hashIndex + 1);
        else if (queryIndex !== -1)
          paramsString = result.url.substring(queryIndex + 1);

        if (!paramsString) throw new Error("No authorization payload found.");

        const params = paramsString.split("&").reduce(
          (acc, current) => {
            const [key, value] = current.split("=");
            if (key && value) acc[key] = decodeURIComponent(value);
            return acc;
          },
          {} as Record<string, string>,
        );

        const authError = params["error_description"] || params["error"];
        if (authError) throw new Error(authError.replace(/\+/g, " "));

        const access_token = params["access_token"];
        const refresh_token = params["refresh_token"];

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;

          isSuccess = true; // 🚀 2. Mark as true so we don't kill the loading spinner early
        } else {
          throw new Error("Tokens missing from URL payload.");
        }
      }
    } catch (err) {
      const error = err as Error;
      Alert.alert("Authentication Failed", error.message);
    } finally {
      // 🚀 3. Only turn off the spinner if it FAILED. If successful, keep it spinning while the router jumps screens!
      if (!isSuccess) {
        set({ isAuthenticating: false });
      }
    }
  },

  signOut: async () => {
    try {
      // 1. Get the current user before we destroy the session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          // 🚀 ISOLATED BLOCK: Attempt to grab the device token and remove it from Supabase
          const token = await registerForPushNotificationsAsync();

          if (token) {
            const { error: rpcError } = await supabase.rpc(
              "remove_push_token",
              {
                p_user_id: user.id,
                p_token: token,
              },
            );

            if (rpcError) throw rpcError;
            console.log("UPLINK SEVERED: Push Token Removed from array.");
          }
        } catch (pushError) {
          // 🚀 BLAST SHIELD: If Firebase crashes here, swallow the error so logout continues
          console.warn(
            "UPLINK BYPASSED ON LOGOUT: Could not remove token. Native Firebase may not be initialized.",
            pushError,
          );
        }
      }

      // 2. Terminate the session (Executes even if the token removal fails)
      await supabase.auth.signOut();
      set({ user: null, profile: null, session: null });
      console.log("SESSION TERMINATED.");
    } catch (error) {
      console.error("Logout Fatal Error:", error);
    }
  },

  // 🚀 Call this function right after a successful login or app boot
  registerDeviceToken: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Attempting to secure Push Token...");

      let token;
      try {
        // 🚀 We isolate the exact point of failure in its own try/catch block
        token = await registerForPushNotificationsAsync();
      } catch (firebaseError) {
        // 🚀 We silently trap the Firebase crash here so it doesn't break the app
        console.warn(
          "UPLINK BYPASSED: Native Firebase is not initialized. Notifications are disabled for this session.",
          firebaseError,
        );
        return; // Abort the token registration, but keep the app running perfectly
      }

      if (token) {
        // Send to database
        const { error: rpcError } = await supabase.rpc("add_push_token", {
          p_user_id: user.id,
          p_token: token,
        });

        if (rpcError) throw rpcError;
        console.log("UPLINK SECURED: Push Token Registered.");
      }
    } catch (error) {
      console.error("Database Token Sync Failed:", error);
    }
  },

  burnTrainingGround: async (collegeName: string) => {
    const { user } = get();

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("users")
        .update({ training_ground: collegeName })
        .eq("id", user.id);

      if (error) throw error;

      set((state) => ({
        profile: state.profile
          ? {
              ...state.profile,
              training_ground: collegeName,
            }
          : null,
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to burn training ground:", err);
      return false;
    }
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error.message);
      return;
    }

    if (data) {
      let repos: any[] = [];
      const rawData = data.raw_github_data;

      if (typeof rawData === "string") {
        try {
          repos = JSON.parse(rawData);
        } catch (e) {
          console.error("Parse error");
        }
      } else if (Array.isArray(rawData)) {
        repos = rawData;
      }

      const repoCount = repos.length;
      let totalStars = 0;
      const langCounts: Record<string, number> = {};

      repos.forEach((repo) => {
        totalStars += repo.stars || 0;
        if (repo.language) {
          langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        }
      });

      const topLanguages = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lang, count]) => ({
          lang: lang.toUpperCase(),
          percentage: Math.round((count / repoCount) * 100),
        }));

      set({
        profile: data as UserProfile,
        githubStats: { repoCount, totalStars, topLanguages },
      });

      // 🚀 THE FIX: Only trigger the AI if it's not already running!
      if (!data.ai_assessment && !get().isGeneratingProfile) {
        console.log("No AI Assessment found. Igniting Forge...");
        get().generateAiProfile();
      }
    }
  },

  generateAiProfile: async () => {
    const { user, profile, isGeneratingProfile } = get();

    // Prevent duplicate AI calls
    if (isGeneratingProfile) return false;

    const githubHandle =
      profile?.github_handle || user?.user_metadata?.user_name;
    if (!user || !githubHandle) return false;

    // 🚀 Lock the Forge so it doesn't fire twice
    set({ isGeneratingProfile: true });

    try {
      console.log("IGNITING FORGE FOR:", githubHandle);

      const { data, error } = await supabase.functions.invoke(
        "generate-profile",
        {
          body: {
            user_id: user.id,
            github_handle: githubHandle,
          },
        },
      );

      if (error) throw error;

      // 🚀 THE FIX: Instant UI Injection!
      // We don't wait for the database to settle. We take the response straight from
      // the Edge Function and manually stitch it into the UI so the user sees it instantly.
      if (data?.profile) {
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                ai_assessment: data.profile.ai_assessment,
                ai_primary_stack: data.profile.ai_primary_stack,
                ai_weekend_build: data.profile.ai_weekend_build,
              }
            : null,
        }));
      }

      // We still run fetchProfile in the background to grab the updated GitHub Stats
      await get().fetchProfile(user.id);

      return true;
    } catch (err: any) {
      console.error("Forge Ignition Failed:", err.message);
      return false;
    } finally {
      // 🚀 Unlock the Forge when finished
      set({ isGeneratingProfile: false });
    }
  },

  deleteAccount: async () => {
    set({ isAuthenticating: true });
    try {
      // 1. Trigger the database self-destruct
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;

      // 2. Clear the local cache and sign out
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null, githubStats: null });

      return true;
    } catch (err: any) {
      console.error("Failed to burn identity:", err.message);
      return false;
    } finally {
      set({ isAuthenticating: false });
    }
  },
}));