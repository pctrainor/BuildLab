import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useAuthStore } from './auth'

const FREE_WEEKLY_SUBMISSIONS = 1

// Basic submission packs
const SUBMISSION_PACK_SIZES = [
  { count: 3, price: 5, label: '3 Submissions', popular: false },
  { count: 5, price: 7, label: '5 Submissions', popular: true },
  { count: 10, price: 12, label: '10 Submissions', popular: false },
]

// Premium tiers with AI generation
const PREMIUM_TIERS = [
  {
    id: 'pro_generate',
    name: 'Pro Generate',
    price: 29,
    submissions: 5,
    features: [
      '5 premium submissions',
      'AI-generated Market Research',
      'Project Charter & PRD',
      'Technical Specification',
      'Working prototype (hosted)',
      'GitHub repository',
      'Shareable preview link'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    submissions: 10,
    features: [
      '10 premium submissions',
      'Everything in Pro Generate',
      'Featured placement',
      'Priority builder matching',
      '1-on-1 consultation call',
      'Priority winner selection'
    ],
    popular: false
  }
]

interface SubmissionLimits {
  weeklyUsed: number
  weeklyLimit: number
  extraRemaining: number
  totalRemaining: number
  canSubmit: boolean
  resetDate: Date | null
  loading: boolean
}

export function useSubmissionLimits(): SubmissionLimits & {
  refresh: () => Promise<void>
  useSubmission: () => Promise<boolean>
} {
  const { user } = useAuthStore()
  const [limits, setLimits] = useState<SubmissionLimits>({
    weeklyUsed: 0,
    weeklyLimit: FREE_WEEKLY_SUBMISSIONS,
    extraRemaining: 0,
    totalRemaining: FREE_WEEKLY_SUBMISSIONS,
    canSubmit: true,
    resetDate: null,
    loading: true
  })

  const checkWeeklyReset = (resetAt: string | null): boolean => {
    if (!resetAt) return true
    const resetDate = new Date(resetAt)
    const now = new Date()
    return now > resetDate
  }

  const getNextThursdayReset = (): string => {
    const now = new Date()
    const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7
    const nextThursday = new Date(now)
    nextThursday.setDate(now.getDate() + daysUntilThursday)
    nextThursday.setHours(20, 0, 0, 0) // 8 PM
    return nextThursday.toISOString()
  }

  const refresh = async () => {
    if (!user) {
      setLimits(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('weekly_submissions_used, weekly_submissions_reset_at, extra_submissions')
        .eq('id', user.id)
        .single()

      if (profileData) {
        // Check if week needs reset
        const needsReset = checkWeeklyReset(profileData.weekly_submissions_reset_at)
        
        let weeklyUsed = profileData.weekly_submissions_used || 0
        let resetAt = profileData.weekly_submissions_reset_at
        
        if (needsReset) {
          // Reset the weekly counter
          weeklyUsed = 0
          resetAt = getNextThursdayReset()
          
          await supabase
            .from('profiles')
            .update({
              weekly_submissions_used: 0,
              weekly_submissions_reset_at: resetAt
            })
            .eq('id', user.id)
        }

        const extraRemaining = profileData.extra_submissions || 0
        const weeklyRemaining = Math.max(0, FREE_WEEKLY_SUBMISSIONS - weeklyUsed)
        const totalRemaining = weeklyRemaining + extraRemaining

        setLimits({
          weeklyUsed,
          weeklyLimit: FREE_WEEKLY_SUBMISSIONS,
          extraRemaining,
          totalRemaining,
          canSubmit: totalRemaining > 0,
          resetDate: resetAt ? new Date(resetAt) : null,
          loading: false
        })
      }
    } catch (error) {
      console.error('Error fetching submission limits:', error)
      setLimits(prev => ({ ...prev, loading: false }))
    }
  }

  const useSubmission = async (): Promise<boolean> => {
    if (!user || !limits.canSubmit) return false

    try {
      const weeklyRemaining = Math.max(0, FREE_WEEKLY_SUBMISSIONS - limits.weeklyUsed)
      
      if (weeklyRemaining > 0) {
        // Use free weekly submission
        await supabase
          .from('profiles')
          .update({
            weekly_submissions_used: limits.weeklyUsed + 1
          })
          .eq('id', user.id)
      } else if (limits.extraRemaining > 0) {
        // Use paid extra submission
        await supabase
          .from('profiles')
          .update({
            extra_submissions: limits.extraRemaining - 1
          })
          .eq('id', user.id)
      } else {
        return false
      }

      await refresh()
      return true
    } catch (error) {
      console.error('Error using submission:', error)
      return false
    }
  }

  useEffect(() => {
    const loadLimits = async () => {
      if (!user) {
        setLimits(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('weekly_submissions_used, weekly_submissions_reset_at, extra_submissions')
          .eq('id', user.id)
          .single()

        if (profileData) {
          // Check if week needs reset
          const needsReset = checkWeeklyReset(profileData.weekly_submissions_reset_at)
          
          let weeklyUsed = profileData.weekly_submissions_used || 0
          let resetAt = profileData.weekly_submissions_reset_at
          
          if (needsReset) {
            // Reset the weekly counter
            weeklyUsed = 0
            resetAt = getNextThursdayReset()
            
            await supabase
              .from('profiles')
              .update({
                weekly_submissions_used: 0,
                weekly_submissions_reset_at: resetAt
              })
              .eq('id', user.id)
          }

          const extraRemaining = profileData.extra_submissions || 0
          const weeklyRemaining = Math.max(0, FREE_WEEKLY_SUBMISSIONS - weeklyUsed)
          const totalRemaining = weeklyRemaining + extraRemaining

          setLimits({
            weeklyUsed,
            weeklyLimit: FREE_WEEKLY_SUBMISSIONS,
            extraRemaining,
            totalRemaining,
            canSubmit: totalRemaining > 0,
            resetDate: resetAt ? new Date(resetAt) : null,
            loading: false
          })
        }
      } catch (error) {
        console.error('Error fetching submission limits:', error)
        setLimits(prev => ({ ...prev, loading: false }))
      }
    }
    
    loadLimits()
  }, [user])

  return { ...limits, refresh, useSubmission }
}

export { FREE_WEEKLY_SUBMISSIONS, SUBMISSION_PACK_SIZES, PREMIUM_TIERS }

// Create Stripe checkout session for purchasing submission packs
export async function createCheckoutSession(packSize: number): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        pack_size: packSize,
        success_url: `${window.location.origin}/submit?success=true`,
        cancel_url: `${window.location.origin}/submit?cancelled=true`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create checkout session')
    }

    const { url } = await response.json()
    return url
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return null
  }
}

// Create premium checkout session with AI generation
export async function createPremiumCheckoutSession(
  tierId: 'pro_generate' | 'premium'
): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        tier_id: tierId,
        is_premium: true,
        success_url: `${window.location.origin}/submit?success=true&premium=true`,
        cancel_url: `${window.location.origin}/submit?cancelled=true`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create checkout session')
    }

    const { url } = await response.json()
    return url
  } catch (error) {
    console.error('Error creating premium checkout session:', error)
    return null
  }
}

// Generation options for AI project generation
export interface GenerationOptions {
  marketResearch: boolean
  projectCharter: boolean
  prd: boolean
  techSpec: boolean
  codePrototype: boolean
  customInstructions: string
  focusArea: 'balanced' | 'budget' | 'speed' | 'quality' | 'mvp' | 'enterprise'
}

// Trigger AI project generation for a build request
export async function triggerProjectGeneration(
  buildRequestId: string, 
  options?: GenerationOptions
): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        build_request_id: buildRequestId,
        options: options,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to start generation')
    }

    return true
  } catch (error) {
    console.error('Error triggering project generation:', error)
    return false
  }
}
