import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/auth'
import type { BuildRequestWithProfile, CommentWithProfile } from '../lib/database.types'
import { ChevronUp, Check } from 'lucide-react'
import { ShareButtons } from '../components/ShareButtons'
import { useToast } from '../components/Toast'

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuthStore()
  const { showToast } = useToast()
  const [request, setRequest] = useState<BuildRequestWithProfile | null>(null)
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    const fetchRequest = async () => {
      const { data } = await supabase
        .from('build_requests')
        .select('*, profiles(*)')
        .eq('id', id)
        .single()
      
      setRequest(data as BuildRequestWithProfile)
      setLoading(false)
    }

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(*)')
        .eq('build_request_id', id)
        .order('created_at', { ascending: true })
      
      setComments((data as CommentWithProfile[]) || [])
    }

    const checkUserVote = async () => {
      if (!user) return
      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('build_request_id', id)
        .single()
      
      setHasVoted(!!data)
    }

    fetchRequest()
    fetchComments()
    if (user) checkUserVote()

    // Subscribe to real-time comments
    const channel = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `build_request_id=eq.${id}`
        },
        async (payload) => {
          // Fetch the full comment with profile
          const { data } = await supabase
            .from('comments')
            .select('*, profiles(*)')
            .eq('id', payload.new.id)
            .single()
          
          if (data) {
            setComments(prev => [...prev, data as CommentWithProfile])
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, user])

  const refreshRequest = async () => {
    if (!id) return
    const { data } = await supabase
      .from('build_requests')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()
    
    setRequest(data as BuildRequestWithProfile)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      build_request_id: id!,
      content: newComment.trim()
    })

    if (error) {
      showToast('Failed to post comment', 'error')
    } else {
      setNewComment('')
      showToast('Comment posted!', 'success')
    }
  }

  const handleVote = async () => {
    if (!user || !request) return

    // Get active competition
    const { data: competition } = await supabase
      .from('competitions')
      .select('id')
      .in('status', ['active', 'voting'])
      .single()

    if (!competition) {
      showToast('No active competition to vote in', 'warning')
      return
    }

    if (hasVoted) {
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('build_request_id', id)
      
      setHasVoted(false)
      showToast('Vote removed', 'info')
    } else {
      await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          build_request_id: id!,
          competition_id: competition.id
        })
      
      setHasVoted(true)
      showToast('Vote cast!', 'success')
    }
    
    refreshRequest()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Request Not Found</h1>
        <Link to="/explore" className="text-cyan-400 hover:underline">
          Back to Explore
        </Link>
      </div>
    )
  }

  const features = Array.isArray(request.features) ? request.features : []

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-full capitalize">
                {request.category}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full ${
                request.status === 'winner'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : request.status === 'in_progress'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-700/50 text-slate-400'
              }`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">{request.title}</h1>
            
            {/* Project GIF */}
            {request.gif_url && (
              <div className="mb-6">
                <img 
                  src={request.gif_url} 
                  alt="Project GIF" 
                  className="h-24 rounded-xl border border-slate-600"
                />
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <Link 
                to={`/u/${request.profiles?.username}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium group-hover:ring-2 group-hover:ring-cyan-400/50 transition-all">
                  {request.profiles?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">@{request.profiles?.username}</div>
                  <div className="text-slate-500 text-sm">{formatDate(request.created_at)}</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {request.detailed_description}
            </p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Key Features</h2>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span className="text-slate-300">{String(feature)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {request.target_audience && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Target Audience</h3>
                <p className="text-white">{request.target_audience}</p>
              </div>
            )}
            {request.design_preferences && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Design Preferences</h3>
                <p className="text-white">{request.design_preferences}</p>
              </div>
            )}
          </div>

          {request.examples_inspiration && (
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Examples & Inspiration</h3>
              <p className="text-slate-300">{request.examples_inspiration}</p>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">
                Discussion ({comments.length})
              </h2>
            </div>
            
            {/* Comments List */}
            <div className="max-h-96 overflow-y-auto p-6 space-y-4">
              {comments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.profiles?.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">
                          @{comment.profiles?.username}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="p-4 border-t border-slate-700/50">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {profile?.username?.[0]?.toUpperCase()}
                  </div>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t border-slate-700/50 text-center">
                <Link to="/auth" className="text-cyan-400 hover:underline">
                  Sign in to comment
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vote Card */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 sticky top-24">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-white mb-2">{request.vote_count}</div>
              <div className="text-slate-400">votes</div>
            </div>

            <button
              onClick={handleVote}
              disabled={!user}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                hasVoted
                  ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {hasVoted ? (
                <>
                  <Check size={20} />
                  <span>Voted</span>
                </>
              ) : (
                <>
                  <ChevronUp size={20} />
                  <span>Upvote</span>
                </>
              )}
            </button>

            {!user && (
              <p className="text-slate-500 text-sm text-center mt-3">
                <Link to="/auth" className="text-cyan-400 hover:underline">Sign in</Link> to vote
              </p>
            )}

            {request.boost_amount > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">${request.boost_amount}</div>
                  <div className="text-slate-400 text-sm">total boosted</div>
                </div>
              </div>
            )}
          </div>

          {/* Share Card */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-4">Share this idea</h3>
            <ShareButtons
              title={request.title}
              description={request.detailed_description}
              url={window.location.href}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
