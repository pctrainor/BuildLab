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
  signInWithGitHub: () => Promise<{ error: Error | null }>
  connectGitHub: () => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
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
      console.log('Auth: Initializing...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Auth init timeout')), 5000)
      )
      
      try {
        const sessionPromise = supabase.auth.getSession()
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        
        console.log('Auth: Got session', !!session)
        
        if (session?.user) {
          set({ user: session.user, session })
          // Don't await profile fetch - let it happen in background
          get().fetchProfile().catch(e => console.warn('Profile fetch failed:', e))
        }
      } catch (e) {
        console.warn('Auth: Session retrieval failed or timed out:', e)
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth: State changed', event, !!session)
        set({ user: session?.user ?? null, session })
        
        if (session?.user) {
          // CRITICAL: Capture GitHub provider token during SIGNED_IN event
          if (event === 'SIGNED_IN' && session.provider_token) {
            const provider = session.user.app_metadata?.provider
            const providers = session.user.app_metadata?.providers || []
            const hasGithub = providers.includes('github') || provider === 'github'
            
            console.log('🔥 SIGNED_IN Event - Provider Token Available!', {
              provider,
              providers,
              hasGithub,
              hasToken: !!session.provider_token,
              tokenLength: session.provider_token?.length,
              event
            })
            
            // If GitHub is one of the linked providers, save the token
            if (hasGithub) {
              const githubUsername = session.user.user_metadata?.user_name || 
                                    session.user.user_metadata?.preferred_username ||
                                    session.user.user_metadata?.name
              
              console.log('💾 Saving GitHub token to profile...', { githubUsername })
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  github_access_token: session.provider_token,
                  github_username: githubUsername,
                  github_connected_at: new Date().toISOString()
                })
                .eq('id', session.user.id)
              
              if (updateError) {
                console.error('❌ Failed to save GitHub token:', updateError)
              } else {
                console.log('✅ GitHub token saved successfully!')
              }
            }
          }
          
          // Don't block on profile fetch - do it in background
          get().fetchProfile().catch(e => console.warn('Auth: Background profile fetch failed:', e))
        } else {
          set({ profile: null })
        }
      })
    } finally {
      console.log('Auth: Initialized')
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
      console.log('Auth: Signing in with email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Auth: Sign in error:', error.message)
        return { error }
      }
      
      console.log('Auth: Sign in successful, user:', data.user?.id)
      return { error: null }
    } catch (error) {
      console.error('Auth: Unexpected sign in error:', error)
      return { error: error as Error }
    } finally {
      set({ loading: false })
    }
  },

  signInWithGitHub: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'repo user:email'
        }
      })
      
      if (error) {
        console.error('Auth: GitHub sign in error:', error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Auth: Unexpected GitHub sign in error:', error)
      return { error: error as Error }
    } finally {
      set({ loading: false })
    }
  },

  // Connect GitHub to existing account (forces fresh OAuth token capture)
  connectGitHub: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?reconnect=true`,
          scopes: 'repo user:email',
          skipBrowserRedirect: false
        }
      })
      
      if (error) {
        console.error('Auth: GitHub connect error:', error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Auth: Unexpected GitHub connect error:', error)
      return { error: error as Error }
    } finally {
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        console.error('Auth: Google sign in error:', error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Auth: Unexpected Google sign in error:', error)
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

    try {
      console.log('Auth: Fetching profile for user', user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.warn('Auth: Profile fetch error:', error.message)
        // If profile doesn't exist, that's okay - user may need to complete onboarding
        return
      }

      if (data) {
        console.log('Auth: Profile loaded:', data.username)
        set({ profile: data })
      }
    } catch (e) {
      console.error('Auth: Unexpected error fetching profile:', e)
    }
  }
}))
