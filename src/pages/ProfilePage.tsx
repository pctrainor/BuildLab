import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Profile, BuildRequestWithProfile } from '../lib/database.types'
import { Trophy, Star, Calendar, ArrowLeft, ChevronUp, ExternalLink } from 'lucide-react'

export function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<BuildRequestWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return

      // Fetch profile by username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)

        // Fetch user's projects
        const { data: projectsData } = await supabase
          .from('build_requests')
          .select('*, profiles(*)')
          .eq('user_id', profileData.id)
          .order('vote_count', { ascending: false })

        setProjects((projectsData as BuildRequestWithProfile[]) || [])
      }

      setLoading(false)
    }

    fetchProfile()
  }, [username])

  const formatDate = (date: string | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-slate-700 rounded-full"></div>
            <div>
              <div className="h-8 bg-slate-700 rounded w-48 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-32"></div>
            </div>
          </div>
          <div className="h-64 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
        <p className="text-slate-400 mb-6">The user @{username} doesn't exist.</p>
        <Link to="/explore" className="text-cyan-400 hover:underline">
          Back to Explore
        </Link>
      </div>
    )
  }

  const winningProjects = projects.filter(p => p.status === 'winner')
  const otherProjects = projects.filter(p => p.status !== 'winner')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Link */}
      <Link 
        to="/explore" 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </Link>

      {/* Profile Header */}
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.username[0]?.toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">
                {profile.display_name || profile.username}
              </h1>
              {profile.is_verified && (
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                  Verified
                </span>
              )}
              {profile.is_builder && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                  Builder
                </span>
              )}
            </div>
            <p className="text-slate-400 mb-3">@{profile.username}</p>
            {profile.bio && (
              <p className="text-slate-300 mb-4">{profile.bio}</p>
            )}
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(profile.created_at)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-700/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ChevronUp className="w-5 h-5 text-cyan-400" />
              <span className="text-2xl font-bold text-white">{profile.total_votes_received || 0}</span>
            </div>
            <p className="text-slate-400 text-sm">Total Votes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{profile.wins_count || 0}</span>
            </div>
            <p className="text-slate-400 text-sm">Wins</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{profile.reputation_score || 0}</span>
            </div>
            <p className="text-slate-400 text-sm">Reputation</p>
          </div>
        </div>
      </div>

      {/* Winning Projects */}
      {winningProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Winning Projects
          </h2>
          <div className="space-y-4">
            {winningProjects.map(project => (
              <Link
                key={project.id}
                to={`/request/${project.id}`}
                className="block bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-5 border border-yellow-500/30 hover:border-yellow-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Winner
                      </span>
                      <span className="text-slate-500 text-sm capitalize">{project.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                      {project.title}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {project.detailed_description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400 shrink-0">
                    <ChevronUp className="w-4 h-4" />
                    <span className="font-medium">{project.vote_count || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            {winningProjects.length > 0 ? 'Other Projects' : 'Projects'}
            <span className="text-slate-500 font-normal ml-2">({otherProjects.length})</span>
          </h2>
          <div className="space-y-3">
            {otherProjects.map(project => (
              <Link
                key={project.id}
                to={`/request/${project.id}`}
                className="block bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {project.status === 'in_competition' && (
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                          In Competition
                        </span>
                      )}
                      <span className="text-slate-500 text-sm capitalize">{project.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {project.title}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {project.detailed_description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {project.gif_url && (
                      <img 
                        src={project.gif_url} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                      <ChevronUp className="w-4 h-4" />
                      <span className="font-medium">{project.vote_count || 0}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Projects */}
      {projects.length === 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
          <p className="text-slate-400">This user hasn't submitted any projects yet.</p>
        </div>
      )}
    </div>
  )
}
