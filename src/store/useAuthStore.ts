import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert, AppState, AppStateStatus, NativeEventSubscription } from 'react-native';

// Required to make sure the web browser closes automatically when auth finishes
WebBrowser.maybeCompleteAuthSession();

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

  initializeAuth: async () => {
    try {
      // Prevent duplicate event listeners
      if (!appStateListener) {
        appStateListener = AppState.addEventListener('change', (state: AppStateStatus) => {
          if (state === 'active') {
            supabase.auth.startAutoRefresh();
          } else {
            supabase.auth.stopAutoRefresh();
          }
        });
      }

      const onboarded = await AsyncStorage.getItem('hasSeenOnboarding');
      const hasSeenOnboarding = onboarded === 'true';

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Zustand Auth Error:", error.message);
      
      set({ 
        session, 
        user: session?.user || null, 
        isInitialized: true, 
        hasSeenOnboarding 
      });

      // Fetch profile on initial load if user exists
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      }

      // Prevent duplicate auth listeners
      if (!authListener) {
        authListener = supabase.auth.onAuthStateChange((event, newSession) => {
          if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !newSession)) {
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
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    set({ hasSeenOnboarding: true });
  },

  loginWithGithub: async () => {
    set({ isAuthenticating: true });
    try {
      const redirectUrl = Linking.createURL('/');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Supabase failed to generate an OAuth URL.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const urlParts = result.url.split('#');
        const queryParts = result.url.split('?');
        
        const paramsString = (urlParts.length > 1 ? urlParts[1] : null) 
                          || (queryParts.length > 1 ? queryParts[1] : '') 
                          || '';
                          
        const urlParams = new URLSearchParams(paramsString);

        const authError = urlParams.get('error_description') || urlParams.get('error');
        if (authError) throw new Error(authError);

        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error("No authorization tokens found in the return URL.");
        }
      }
    } catch (err) {
      const error = err as Error;
      Alert.alert('Authentication Failed', error.message);
    } finally {
      set({ isAuthenticating: false });
    }
  },

  signOut: async () => {
    set({ isAuthenticating: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({ session: null, user: null, profile: null });
    } catch (err) {
      const error = err as Error;
      Alert.alert('Sign Out Error', error.message);
    } finally {
      set({ isAuthenticating: false });
    }
  },
  
  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Profile fetch error:", error.message);
      return;
    }
    
    if (data) {
      set({ profile: data as UserProfile });
    }
  },

  burnTrainingGround: async (collegeName: string) => {
    const { user } = get();
    
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('users')
        .update({ training_ground: collegeName })
        .eq('id', user.id);

      if (error) throw error;

      set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          training_ground: collegeName,
        } : null
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to burn training ground:", err);
      return false;
    }
  },
}));