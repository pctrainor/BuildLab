import { useState, useEffect } from 'react'

import { Link } from 'react-router-dom'
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LeaderboardUser {
  id: string
  username: string
  avatar_url: string | null
  total_votes: number
  submissions_count: number
  wins_count: number
}

export function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe])

  async function fetchLeaderboard() {
    setLoading(true)
    try {
      // Fetch users with their actual stats from the database
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          total_votes_received,
          wins_count
        `)
        .order('total_votes_received', { ascending: false, nullsFirst: false })
        .limit(50)

      if (error) throw error

      // Count submissions for each user
      const leaderboardData: LeaderboardUser[] = await Promise.all(
        (data || []).map(async (user) => {
          // Get submission count for this user
          const { count } = await supabase
            .from('build_requests')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)

          return {
            id: user.id,
            username: user.username || `user_${user.id.slice(0, 8)}`,
            avatar_url: user.avatar_url,
            total_votes: user.total_votes_received || 0,
            submissions_count: count || 0,
            wins_count: user.wins_count || 0
          }
        })
      )

      // Sort by total votes (already sorted but ensure consistency)
      leaderboardData.sort((a, b) => b.total_votes - a.total_votes)

      setUsers(leaderboardData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-slate-300" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">{rank}</span>
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
      case 2:
        return 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/30'
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30'
      default:
        return 'bg-slate-800/50 border-slate-700/50'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl mb-6">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Leaderboard</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Top contributors ranked by votes, submissions, and competition wins
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-800/50 rounded-xl p-1">
            {(['all', 'month', 'week'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-sm text-slate-400">Contributors</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {users.reduce((sum, u) => sum + u.total_votes, 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Total Votes</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {users.reduce((sum, u) => sum + u.wins_count, 0)}
            </div>
            <div className="text-sm text-slate-400">Competitions Won</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading leaderboard...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No users yet</h3>
            <p className="text-slate-400">Be the first to submit an idea!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <Link
                key={user.id}
                to={`/u/${user.username}`}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] ${getRankBg(index + 1)}`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-10 flex justify-center">
                  {getRankIcon(index + 1)}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{user.username}</h3>
                  <p className="text-sm text-slate-400">
                    {user.submissions_count} submissions · {user.wins_count} wins
                  </p>
                </div>

                {/* Votes */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xl font-bold text-cyan-400">{user.total_votes.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">votes</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
