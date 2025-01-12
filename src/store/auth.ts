import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

interface AuthState {
  user: User | null;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Set up auth state change listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      set({ user: null, profile: null, loading: false });
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.user) {
        set({ user: session.user });
        get().loadProfile();
      }
    }
  });

  return {
    user: null,
    profile: null,
    loading: true,
    error: null,
    initialized: false,

    signIn: async (email, password) => {
      try {
        set({ loading: true, error: null });
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        set({ user });
        await get().loadProfile();
      } catch (error) {
        set({ error: error as Error });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    signUp: async (email, password, fullName) => {
      try {
        set({ loading: true, error: null });
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        if (!user) throw new Error('User not created');

        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email,
              full_name: fullName,
              role: 'client',
            });
          if (profileError) throw profileError;
        } catch (error) {
          await supabase.auth.signOut();
          throw error;
        }
      } catch (error) {
        set({ error: error as Error });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    signOut: async () => {
      try {
        set({ loading: true, error: null });
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ user: null, profile: null });
      } catch (error) {
        set({ error: error as Error });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    loadProfile: async () => {
      try {
        set({ loading: true, error: null });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          set({ user: null, profile: null, loading: false });
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        set({ user, profile, loading: false, initialized: true });
      } catch (error) {
        console.error('Error loading profile:', error);
        set({ user: null, profile: null, error: error as Error, loading: false });
      }
    },

    clearError: () => set({ error: null }),
  };
});