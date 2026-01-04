import { useState, useMemo } from 'react'
import { Users, Gift, Copy, Check, Trophy, Zap } from 'lucide-react'
import { useAuthStore } from '../lib/auth'

interface ReferralStats {
  referralCode: string
  referralCount: number
  bonusVotes: number
}

export function ReferralWidget() {
  const { user, profile } = useAuthStore()
  const [copied, setCopied] = useState(false)

  const stats = useMemo<ReferralStats | null>(() => {
    if (user && profile) {
      const referralCode = profile.username?.toUpperCase() || user.id.slice(0, 8).toUpperCase()
      return {
        referralCode,
        referralCount: 0,
        bonusVotes: 0
      }
    }
    return null
  }, [user, profile])

  const referralLink = stats 
    ? `${window.location.origin}/?ref=${stats.referralCode}`
    : ''

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`🚀 I'm on BuildLab where the community decides what gets built for FREE!\n\nSubmit your web app ideas and vote for your favorites. Join me:\n\n${referralLink}\n\n#BuildLab #WebDev #StartupIdeas`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const shareToReddit = () => {
    const title = encodeURIComponent('BuildLab - Submit your web app ideas and get them built for free!')
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(referralLink)}&title=${title}`, '_blank')
  }

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <Gift className="text-cyan-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Invite Friends</h3>
            <p className="text-sm text-slate-400">Sign in to get your referral link</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <Gift className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Invite Friends</h3>
          <p className="text-sm text-slate-400">Earn bonus votes for each referral!</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Your Referral Link</label>
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-300 text-sm truncate">
            {referralLink}
          </div>
          <button
            onClick={copyReferralLink}
            className="px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl transition-all flex items-center gap-2"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Quick Share Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={shareToTwitter}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-xl transition-all border border-[#1DA1F2]/20"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span className="font-medium">Share on X</span>
        </button>
        <button
          onClick={shareToReddit}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 text-[#FF4500] rounded-xl transition-all border border-[#FF4500]/20"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
          <span className="font-medium">Share on Reddit</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">
            <Users size={18} />
            <span className="text-2xl font-bold">{stats?.referralCount || 0}</span>
          </div>
          <p className="text-xs text-slate-400">Friends Invited</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-400 mb-1">
            <Zap size={18} />
            <span className="text-2xl font-bold">{stats?.bonusVotes || 0}</span>
          </div>
          <p className="text-xs text-slate-400">Bonus Votes</p>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <h4 className="text-sm font-medium text-white mb-3">Referral Rewards</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Trophy size={14} className="text-yellow-400" />
            <span>5 referrals = <span className="text-cyan-400">+3 bonus votes</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Trophy size={14} className="text-yellow-400" />
            <span>10 referrals = <span className="text-purple-400">Priority submission review</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Trophy size={14} className="text-yellow-400" />
            <span>25 referrals = <span className="text-green-400">Featured creator badge</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
