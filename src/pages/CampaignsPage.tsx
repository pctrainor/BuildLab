import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/auth'
import type { CampaignWithProfile } from '../lib/database.types'
import { Plus, Clock, Users, DollarSign, Trophy, Sparkles, Search, Filter } from 'lucide-react'

export function CampaignsPage() {
  const { user } = useAuthStore()
  const [campaigns, setCampaigns] = useState<CampaignWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'voting' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true)
      let query = supabase
        .from('campaigns')
        .select('*, profiles!campaigns_creator_id_fkey(*)')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query.limit(50)
      setCampaigns((data as unknown as CampaignWithProfile[]) || [])
      setLoading(false)
    }
    loadCampaigns()
  }, [filter])

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const diff = new Date(deadline).getTime() - now.getTime()
    if (diff <= 0) return 'Ended'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'voting': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'completed': return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Campaigns</h1>
          <p className="text-slate-400">
            Custom competitions created by the community with their own rules and prizes
          </p>
        </div>
        
        {user && (
          <Link
            to="/campaigns/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
          >
            <Plus size={20} />
            Create Campaign
          </Link>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Sparkles className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">What are Campaigns?</h3>
            <p className="text-slate-400 text-sm mb-3">
              Unlike our main weekly competition (free builds), campaigns are custom contests created by users who want to crowdsource ideas for specific projects. Campaign creators set their own rules, budgets, and prize pools.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <DollarSign size={16} className="text-green-400" />
                <span>Set your own budget & prizes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users size={16} className="text-cyan-400" />
                <span>Get proposals from builders</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Trophy size={16} className="text-yellow-400" />
                <span>Choose your winner</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          {(['all', 'active', 'voting', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-slate-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
          <p className="text-slate-400 mb-6">
            {filter === 'all' 
              ? "Be the first to create a campaign!" 
              : `No ${filter} campaigns at the moment.`}
          </p>
          {user && (
            <Link
              to="/campaigns/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl"
            >
              <Plus size={20} />
              Create Campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to={`/campaigns/${campaign.id}`}
              className="group bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all overflow-hidden"
            >
              {/* Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  {campaign.is_featured && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      ⭐ Featured
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                  {campaign.title}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                  {campaign.description}
                </p>
                
                {/* Creator */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {campaign.profiles?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-slate-500 text-sm">@{campaign.profiles?.username}</span>
                </div>
              </div>
              
              {/* Footer Stats */}
              <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-white font-semibold">${campaign.prize_pool || 0}</div>
                  <div className="text-slate-500 text-xs">Prize</div>
                </div>
                <div>
                  <div className="text-white font-semibold flex items-center justify-center gap-1">
                    <Clock size={14} className="text-slate-500" />
                    {getTimeRemaining(campaign.deadline)}
                  </div>
                  <div className="text-slate-500 text-xs">Deadline</div>
                </div>
                <div>
                  <div className="text-white font-semibold">{(campaign.entry_fee || 0) > 0 ? `$${campaign.entry_fee}` : 'Free'}</div>
                  <div className="text-slate-500 text-xs">Entry</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
