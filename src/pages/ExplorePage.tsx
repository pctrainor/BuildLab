import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/auth'
import type { BuildRequestWithProfile, Competition } from '../lib/database.types'
import { Globe, Zap, ShoppingCart, Cloud, BarChart3, Gamepad2, Clock, ChevronUp, Flame, Inbox, LayoutGrid, Table, ExternalLink, TrendingUp, Smartphone, Sparkles } from 'lucide-react'
import { useToast } from '../components/Toast'

// Helper function to get category icon
const getCategoryIcon = (category: string) => {
  const iconClass = "w-5 h-5 text-slate-400"
  switch (category?.toLowerCase()) {
    case 'website': return <Globe className={iconClass} />
    case 'webapp': return <Zap className={iconClass} />
    case 'ecommerce': return <ShoppingCart className={iconClass} />
    case 'saas': return <Cloud className={iconClass} />
    case 'dashboard': return <BarChart3 className={iconClass} />
    case 'game': case 'interactive': return <Gamepad2 className={iconClass} />
    case 'mobile': return <Smartphone className={iconClass} />
    case 'ai': return <Sparkles className={iconClass} />
    default: return <Globe className={iconClass} />
  }
}

export function ExplorePage() {
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [requests, setRequests] = useState<BuildRequestWithProfile[]>([])
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'votes' | 'recent' | 'boost'>('votes')
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      // Fetch active competition
      const { data: compData } = await supabase
        .from('competitions')
        .select('*')
        .in('status', ['active', 'voting'])
        .single()
      
      setCompetition(compData)

      // Fetch build requests
      let query = supabase
        .from('build_requests')
        .select('*, profiles(*)')
        .in('status', ['submitted', 'in_competition'])

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      if (sortBy === 'votes') {
        query = query.order('vote_count', { ascending: false })
      } else if (sortBy === 'boost') {
        query = query.order('boost_amount', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data } = await query.limit(50)
      setRequests((data as BuildRequestWithProfile[]) || [])
      setLoading(false)
    }
    loadData()
  }, [category, sortBy])

  useEffect(() => {
    const loadUserVotes = async () => {
      if (!user) return
      const { data } = await supabase
        .from('votes')
        .select('build_request_id')
        .eq('user_id', user.id)
      
      if (data) {
        setUserVotes(new Set(data.map(v => v.build_request_id)))
      }
    }
    if (user) {
      loadUserVotes()
    }
  }, [user])

  const refreshData = async () => {
    // Fetch build requests
    let query = supabase
      .from('build_requests')
      .select('*, profiles(*)')
      .in('status', ['submitted', 'in_competition'])

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    if (sortBy === 'votes') {
      query = query.order('vote_count', { ascending: false })
    } else if (sortBy === 'boost') {
      query = query.order('boost_amount', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data } = await query.limit(50)
    setRequests((data as BuildRequestWithProfile[]) || [])
  }

  const handleVote = async (requestId: string) => {
    if (!user) {
      showToast('Sign in to vote', 'warning')
      return
    }
    if (!competition) {
      showToast('No active competition', 'warning')
      return
    }

    const hasVoted = userVotes.has(requestId)
    
    if (hasVoted) {
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('build_request_id', requestId)
      
      setUserVotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
      showToast('Vote removed', 'info')
    } else {
      await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          build_request_id: requestId,
          competition_id: competition.id
        })
      
      setUserVotes(prev => new Set([...prev, requestId]))
      showToast('Vote cast!', 'success')
    }
    
    refreshData()
  }

  const getTimeRemaining = () => {
    if (!competition) return null
    const deadline = new Date(competition.voting_deadline)
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    
    if (diff <= 0) return 'Voting ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  const CATEGORIES = [
    { value: 'all', label: 'All Categories', icon: null },
    { value: 'website', label: 'Website', icon: Globe },
    { value: 'webapp', label: 'Web App', icon: Zap },
    { value: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart },
    { value: 'saas', label: 'SaaS', icon: Cloud },
    { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { value: 'game', label: 'Game', icon: Gamepad2 }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Explore Ideas</h1>
          <p className="text-slate-400">
            Discover and vote for the best build requests
          </p>
        </div>
        
        {competition && (
          <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-xl">
            <div className="text-sm text-slate-400">This Week's Competition</div>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Clock size={16} />
              <span>{getTimeRemaining()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {Icon && <Icon size={16} />}
              <span>{cat.label}</span>
            </button>
          )
          })}
        </div>
        
        <div className="flex gap-2 ml-auto">
          {/* View Toggle */}
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid' 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-all ${
                viewMode === 'table' 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <Table size={18} />
            </button>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'votes' | 'recent' | 'boost')}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="votes">Most Votes</option>
            <option value="boost">Most Boosted</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="mx-auto text-slate-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">No ideas found</h3>
          <p className="text-slate-400 mb-6">Be the first to submit an idea in this category!</p>
          <Link
            to="/submit"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl"
          >
            Submit Your Idea
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        /* Professional Data Grid / Table View */
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          {/* Table Header - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Project</div>
            <div className="col-span-2">Creator</div>
            <div className="col-span-1 text-center">Category</div>
            <div className="col-span-1 text-center">
              <TrendingUp size={14} className="inline" />
            </div>
            <div className="col-span-1 text-center">Boost</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>
          {/* Mobile Header */}
          <div className="md:hidden px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Top Ideas
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-slate-800/50">
            {requests.map((request, index) => (
              <div 
                key={request.id}
                className="hover:bg-slate-800/30 transition-colors group"
              >
                {/* Desktop Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  {/* Rank */}
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500' :
                      index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400' :
                      index === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Project Info */}
                  <div className="col-span-4">
                    <Link to={`/request/${request.id}`} className="flex items-center gap-3 group-hover:text-cyan-400 transition-colors">
                      {/* GIF Thumbnail or Category Icon */}
                      {request.gif_url ? (
                        <img 
                          src={request.gif_url} 
                          alt="" 
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-600"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex-shrink-0 border border-slate-600 flex items-center justify-center">
                          {getCategoryIcon(request.category)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{request.title}</h3>
                        <p className="text-slate-500 text-xs line-clamp-1">{request.short_description}</p>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Creator */}
                  <div className="col-span-2">
                    <Link 
                      to={`/u/${request.profiles?.username}`}
                      className="flex items-center gap-2 group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 group-hover:ring-2 group-hover:ring-cyan-400/50 transition-all">
                        {request.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-slate-400 text-sm truncate group-hover:text-cyan-400 transition-colors">@{request.profiles?.username}</span>
                    </Link>
                  </div>
                  
                  {/* Category */}
                  <div className="col-span-1 text-center">
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded capitalize">
                      {request.category}
                    </span>
                  </div>
                  
                  {/* Votes */}
                  <div className="col-span-1 text-center">
                    <span className="text-cyan-400 font-bold">{request.vote_count}</span>
                  </div>
                  
                  {/* Boost Amount */}
                  <div className="col-span-1 text-center">
                    {(request.boost_amount || 0) > 0 ? (
                      <span className="text-yellow-400 font-semibold text-sm">${request.boost_amount}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleVote(request.id)}
                      disabled={!user}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        userVotes.has(request.id)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ChevronUp size={14} strokeWidth={userVotes.has(request.id) ? 3 : 2} />
                      <span>Vote</span>
                    </button>
                    <Link
                      to={`/request/${request.id}`}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
                
                {/* Mobile Row */}
                <div className="md:hidden px-4 py-4">
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500' :
                      index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400' :
                      index === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                    
                    {/* Thumbnail */}
                    {request.gif_url ? (
                      <img 
                        src={request.gif_url} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex-shrink-0 border border-slate-600 flex items-center justify-center">
                        {getCategoryIcon(request.category)}
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/request/${request.id}`}>
                        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{request.title}</h3>
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Link 
                          to={`/u/${request.profiles?.username}`}
                          className="hover:text-cyan-400 transition-colors"
                        >
                          @{request.profiles?.username}
                        </Link>
                        <span>•</span>
                        <span className="capitalize">{request.category}</span>
                      </div>
                      
                      {/* Mobile Actions Row */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleVote(request.id)}
                          disabled={!user}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
                            userVotes.has(request.id)
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                              : 'bg-slate-700/50 text-slate-400'
                          } ${!user ? 'opacity-50' : ''}`}
                        >
                          <ChevronUp size={12} strokeWidth={userVotes.has(request.id) ? 3 : 2} />
                          <span>{request.vote_count}</span>
                        </button>
                        
                        {(request.boost_amount || 0) > 0 && (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs">
                            <Flame size={12} />
                            ${request.boost_amount}
                          </span>
                        )}
                        
                        <Link
                          to={`/request/${request.id}`}
                          className="ml-auto text-slate-400 hover:text-white text-xs flex items-center gap-1"
                        >
                          View <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Table Footer */}
          <div className="px-6 py-3 bg-slate-800/30 border-t border-slate-700/50 text-xs text-slate-500 text-center">
            Showing {requests.length} ideas • Updated in real-time
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all overflow-hidden group"
            >
              <div className="p-6">
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full capitalize">
                    {request.category}
                  </span>
                  {(request.boost_amount || 0) > 0 && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      <Flame size={12} />
                      <span>${request.boost_amount} boosted</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <Link to={`/request/${request.id}`}>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {request.title}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {request.short_description}
                </p>

                {/* Author */}
                <Link 
                  to={`/u/${request.profiles?.username}`}
                  className="flex items-center gap-3 mb-4 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium group-hover:ring-2 group-hover:ring-cyan-400/50 transition-all">
                    {request.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-slate-400 text-sm group-hover:text-cyan-400 transition-colors">
                    @{request.profiles?.username}
                  </span>
                </Link>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => handleVote(request.id)}
                    disabled={!user}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      userVotes.has(request.id)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ChevronUp size={20} strokeWidth={userVotes.has(request.id) ? 3 : 2} />
                    <span className="font-semibold">{request.vote_count}</span>
                  </button>
                  
                  <Link
                    to={`/request/${request.id}`}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
