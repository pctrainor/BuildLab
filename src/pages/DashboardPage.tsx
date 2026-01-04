import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { BuildRequest } from '../lib/database.types'
import { ReferralWidget } from '../components/ReferralWidget'

export function DashboardPage() {
  const { user, profile } = useAuthStore()
  const [requests, setRequests] = useState<BuildRequest[]>([])
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalVotes: 0,
    wins: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    
    const loadData = async () => {
      // Fetch user's build requests
      const { data: requestsData } = await supabase
        .from('build_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setRequests(requestsData || [])

      // Calculate stats
      if (requestsData) {
        const totalVotes = requestsData.reduce((sum, r) => sum + r.vote_count, 0)
        const wins = requestsData.filter(r => r.status === 'winner').length
        
        setStats({
          totalSubmissions: requestsData.length,
          totalVotes,
          wins
        })
      }

      setLoading(false)
    }
    
    loadData()
  }, [user])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
        <p className="text-slate-400 mb-8">Please sign in to view your dashboard.</p>
        <Link
          to="/auth"
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl"
        >
          Sign In
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winner': return 'bg-yellow-500/20 text-yellow-400'
      case 'in_progress': return 'bg-green-500/20 text-green-400'
      case 'completed': return 'bg-blue-500/20 text-blue-400'
      case 'in_competition': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-slate-700/50 text-slate-400'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">@{profile?.username}</h1>
            <p className="text-slate-400">Member since {new Date(profile?.created_at || '').toLocaleDateString()}</p>
          </div>
        </div>
        <Link
          to="/submit"
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-center"
        >
          + Submit New Idea
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
          <div className="text-4xl font-bold text-white mb-2">{stats.totalSubmissions}</div>
          <div className="text-slate-400">Submissions</div>
        </div>
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
          <div className="text-4xl font-bold text-cyan-400 mb-2">{stats.totalVotes}</div>
          <div className="text-slate-400">Total Votes</div>
        </div>
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.wins}</div>
          <div className="text-slate-400">Wins</div>
        </div>
      </div>

      {/* Referral Widget */}
      <div className="mb-12">
        <ReferralWidget />
      </div>

      {/* Submissions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Your Submissions</h2>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-white mb-2">No submissions yet</h3>
            <p className="text-slate-400 mb-6">Submit your first idea and compete for a chance to win!</p>
            <Link
              to="/submit"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl"
            >
              Submit Your Idea
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/request/${request.id}`}
                        className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors"
                      >
                        {request.title}
                      </Link>
                      <span className={`px-3 py-1 text-xs rounded-full capitalize ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{request.short_description}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-cyan-400">{request.vote_count}</div>
                      <div className="text-slate-500 text-xs">votes</div>
                    </div>
                    {request.boost_amount > 0 && (
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">${request.boost_amount}</div>
                        <div className="text-slate-500 text-xs">boosted</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                  <span className="text-slate-500 text-sm">
                    Created {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-3">
                    <Link
                      to={`/request/${request.id}`}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                    >
                      View
                    </Link>
                    {request.status === 'draft' && (
                      <button className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm rounded-lg transition-colors">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
