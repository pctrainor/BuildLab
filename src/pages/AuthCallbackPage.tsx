import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/auth'
import { Loader2 } from 'lucide-react'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash (Supabase OAuth redirect)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setError(error.message)
          return
        }

        if (data.session) {
          const user = data.session.user
          const providerToken = data.session.provider_token
          const provider = user.app_metadata?.provider

          console.log('🔍 Auth Callback Debug:', {
            provider,
            hasProviderToken: !!providerToken,
            providerToken: providerToken ? 'TOKEN_EXISTS' : 'NO_TOKEN',
            user_metadata: user.user_metadata
          })

          // Check if profile exists, if not create one
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', user.id)
            .single()

          // Build profile update/insert data
          const username = user.user_metadata?.user_name || 
                         user.user_metadata?.preferred_username ||
                         user.email?.split('@')[0] ||
                         `user_${user.id.slice(0, 8)}`
          
          const displayName = user.user_metadata?.full_name || 
                            user.user_metadata?.name || 
                            username

          // If logged in with GitHub, store the access token for repo creation
          const githubData = provider === 'github' && providerToken ? {
            github_access_token: providerToken,
            github_username: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
            github_connected_at: new Date().toISOString()
          } : {}

          console.log('📝 GitHub Data to Save:', provider === 'github' ? {
            willSaveToken: !!providerToken,
            username: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
            hasGithubData: Object.keys(githubData).length > 0
          } : 'Not a GitHub login')

          if (!profile) {
            // Create new profile with GitHub token if applicable
            await supabase.from('profiles').insert({
              id: user.id,
              username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
              display_name: displayName,
              avatar_url: user.user_metadata?.avatar_url || null,
              bio: null,
              ...githubData
            })
          } else if (provider === 'github' && providerToken) {
            // Update existing profile with GitHub token
            console.log('✅ Updating existing profile with GitHub token')
            const { error: updateError } = await supabase.from('profiles').update({
              ...githubData,
              avatar_url: user.user_metadata?.avatar_url || undefined
            }).eq('id', user.id)
            
            if (updateError) {
              console.error('❌ Failed to update profile with GitHub token:', updateError)
            } else {
              console.log('✅ Successfully updated profile with GitHub token')
            }
          }

          await fetchProfile()
          navigate('/dashboard')
        } else {
          // No session, redirect to auth
          navigate('/auth')
        }
      } catch (e) {
        console.error('Callback processing error:', e)
        setError('Failed to complete authentication')
      }
    }

    handleCallback()
  }, [navigate, fetchProfile])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Completing sign in...</p>
        <p className="text-slate-400 text-sm mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  )
}
