import { create } from 'zustand'
import { supabase } from './supabase'
import type { Profile } from './database.types'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user, session })
        await get().fetchProfile()
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ user: session?.user ?? null, session })
        
        if (session?.user) {
          await get().fetchProfile()
        } else {
          set({ profile: null })
        }
      })
    } finally {
      set({ initialized: true })
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    set({ loading: true })
    try {
      // Check if username is available
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single()

      if (existingUser) {
        return { error: new Error('Username is already taken') }
      }

      // Sign up the user with metadata
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            display_name: username
          },
          emailRedirectTo: `${window.location.origin}/email-confirmed`
        }
      })

      if (signUpError) {
        console.error('Signup error:', signUpError)
        return { error: signUpError }
      }

      // If user was created, manually create profile as fallback
      if (signUpData.user) {
        // Wait a moment for trigger to fire
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if profile exists
        const { data: profile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', signUpData.user.id)
          .single()

        // If no profile exists, create it manually
        if (!profile && !profileCheckError) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              username: username.toLowerCase(),
              display_name: username,
              avatar_url: null,
              bio: null
            })

          if (insertError) {
            console.error('Profile creation error:', insertError)
            return { error: new Error('Database error creating profile. Please contact support.') }
          }
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      return { error: error as Error }
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) return { error }
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get()
    if (!user) return { error: new Error('Not authenticated') }

    set({ loading: true })
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) return { error }
      
      await get().fetchProfile()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ loading: false })
    }
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      set({ profile: data })
    }
  }
}))
