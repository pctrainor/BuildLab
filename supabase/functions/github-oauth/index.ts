// GitHub OAuth Handler for BuildLab
// Handles the OAuth callback and stores the user's GitHub token

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const githubClientId = Deno.env.get('GITHUB_CLIENT_ID')!
const githubClientSecret = Deno.env.get('GITHUB_CLIENT_SECRET')!
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://buildlab.dev'

// Production CORS - restrict to known origins
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    frontendUrl,
    'https://buildlab.dev',
    'https://www.buildlab.dev',
    // Allow localhost for development only if FRONTEND_URL indicates dev
    ...(frontendUrl.includes('localhost') ? ['http://localhost:5173', 'http://localhost:3000'] : [])
  ]
  
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    // Action: Get OAuth URL to redirect user
    if (action === 'authorize') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Generate state token for CSRF protection
      const state = crypto.randomUUID()
      
      // Store state temporarily (in production, use Redis or similar)
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Store state with user ID for callback verification
      await supabase.from('github_oauth_states').upsert({
        state,
        user_id: user.id,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
      })

      const redirectUri = `${supabaseUrl}/functions/v1/github-oauth?action=callback`
      const scope = 'repo' // Scope for creating repos
      
      const authUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${githubClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${state}`

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: Handle OAuth callback from GitHub
    if (action === 'callback') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      if (error) {
        return new Response(`
          <html><body>
            <h1>GitHub Connection Failed</h1>
            <p>${error}</p>
            <script>window.close();</script>
          </body></html>
        `, { headers: { 'Content-Type': 'text/html' } })
      }

      if (!code || !state) {
        return new Response('Missing code or state', { status: 400 })
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Verify state and get user
      const { data: stateData, error: stateError } = await supabase
        .from('github_oauth_states')
        .select('user_id, expires_at')
        .eq('state', state)
        .single()

      if (stateError || !stateData) {
        return new Response('Invalid or expired state', { status: 400 })
      }

      if (new Date(stateData.expires_at) < new Date()) {
        return new Response('State expired', { status: 400 })
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: githubClientId,
          client_secret: githubClientSecret,
          code,
        }),
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        console.error('GitHub token error:', tokenData)
        return new Response(`Token error: ${tokenData.error_description}`, { status: 400 })
      }

      // Get GitHub user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      const githubUser = await userResponse.json()

      // Store token in user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          github_access_token: tokenData.access_token,
          github_username: githubUser.login,
          github_connected_at: new Date().toISOString(),
        })
        .eq('id', stateData.user_id)

      if (updateError) {
        console.error('Failed to save GitHub token:', updateError)
        return new Response('Failed to save connection', { status: 500 })
      }

      // Clean up state
      await supabase.from('github_oauth_states').delete().eq('state', state)

      // Sanitize GitHub username to prevent XSS in HTML response
      const safeUsername = githubUser.login.replace(/[<>"'&]/g, '')
      
      // Return success page that closes popup
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>GitHub Connected</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px;">
          <h1>✅ GitHub Connected!</h1>
          <p>Connected as <strong>@${safeUsername}</strong></p>
          <p>You can close this window.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'github-connected', username: '${safeUsername}' }, '${frontendUrl}');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    // Action: Disconnect GitHub
    if (action === 'disconnect') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)

      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      await supabase
        .from('profiles')
        .update({
          github_access_token: null,
          github_username: null,
          github_connected_at: null,
        })
        .eq('id', user.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Unknown action', { status: 400, headers: corsHeaders })

  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
