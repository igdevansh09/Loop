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

    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn("EAS Project ID is missing from app.json!");
      return undefined;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.error("Native Token Fetch Failed:", e);
      throw e; 
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}



WebBrowser.maybeCompleteAuthSession();

export interface GithubStats {
  repoCount: number;
  totalStars: number;
  topLanguages: { lang: string; percentage: number }[];
}


export interface UserProfile {
  id: string;
  training_ground: string | null;
  available_hours_per_day: number | null;
  raw_github_data: any | null; 
  ai_assessment: string | null;     
  ai_primary_stack: string | null;  
  ai_weekend_build: string | null;  
  [key: string]: any; 
}


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
  fetchProfile: (userId: string, retryCount?: number) => Promise<void>;
  burnTrainingGround: (collegeName: string) => Promise<boolean>;
  generateAiProfile: () => Promise<boolean>;
  githubStats: GithubStats | null;
  deleteAccount: () => Promise<boolean>;
  registerDeviceToken: () => Promise<void>;
  isGeneratingProfile: boolean; 
}


let appStateListener: NativeEventSubscription | null = null;
let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;


export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,
  hasSeenOnboarding: false,
  isAuthenticating: false,
  isGeneratingProfile: false, 
  githubStats: null,

  initializeAuth: async () => {
    try {
      
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

      
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      }

      
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
    let isSuccess = false; 

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

          isSuccess = true; 
        } else {
          throw new Error("Tokens missing from URL payload.");
        }
      }
    } catch (err) {
      const error = err as Error;
      Alert.alert("Authentication Failed", error.message);
    } finally {
      
      if (!isSuccess) {
        set({ isAuthenticating: false });
      }
    }
  },

  signOut: async () => {
    try {
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          
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
          
          console.warn(
            "UPLINK BYPASSED ON LOGOUT: Could not remove token. Native Firebase may not be initialized.",
            pushError,
          );
        }
      }

      
      await supabase.auth.signOut();
      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticating: false,
      });
      console.log("SESSION TERMINATED.");
    } catch (error) {
      console.error("Logout Fatal Error:", error);
    }
  },

  
  registerDeviceToken: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Attempting to secure Push Token...");

      let token;
      try {
        
        token = await registerForPushNotificationsAsync();
      } catch (firebaseError) {
        
        console.warn(
          "UPLINK BYPASSED: Native Firebase is not initialized. Notifications are disabled for this session.",
          firebaseError,
        );
        return; 
      }

      if (token) {
        
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

  fetchProfile: async (userId: string, retryCount = 0) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error.message);
      return;
    }

    if (!data) {
      
      if (retryCount >= 3) {
        console.error(
          "CRITICAL: Database row not found after 3 retries. Trigger failure or RLS block.",
        );
        return;
      }

      console.log(`Profile not found yet. Retrying... (${retryCount + 1}/3)`);
      setTimeout(() => {
        get().fetchProfile(userId, retryCount + 1);
      }, 2000);
      return;
    }

    
    const currentState = get().profile;
    if (currentState?.ai_assessment && !data.ai_assessment) {
      console.log("Stale DB read detected. Preserving local AI state...");
      data.ai_assessment = currentState.ai_assessment;
      data.ai_primary_stack = currentState.ai_primary_stack;
      data.ai_weekend_build = currentState.ai_weekend_build;

      if (currentState.raw_github_data && !data.raw_github_data) {
        data.raw_github_data = currentState.raw_github_data;
      }
    }

    if (data) {
      let repos: any[] = [];
      const rawData = data.raw_github_data;

      if (typeof rawData === "string") {
        try {
          repos = JSON.parse(rawData);
        } catch (e) {
          console.error("Parse error", e);
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

      
      if (!data.ai_assessment && !get().isGeneratingProfile) {
        console.log("No AI Assessment found. Igniting Forge...");
        get().generateAiProfile();
      }
    }
  },

  generateAiProfile: async () => {
    const { user, profile, isGeneratingProfile } = get();

    if (isGeneratingProfile) return false;

    const githubHandle =
      profile?.github_handle || user?.user_metadata?.user_name;
    if (!user || !githubHandle) return false;

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

      
      
      
      setTimeout(() => {
        get().fetchProfile(user.id);
      }, 3000);

      return true;
    } catch (err: any) {
      console.error("Forge Ignition Failed:", err.message);
      return false;
    } finally {
      set({ isGeneratingProfile: false });
    }
  },

  deleteAccount: async () => {
    set({ isAuthenticating: true });
    try {
      
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;

      
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