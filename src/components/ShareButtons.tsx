import { Twitter, Share2, MessageCircle, Link2, Check } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonsProps {
  title: string
  description: string
  url?: string
  compact?: boolean
}

export function ShareButtons({ title, description, url, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDesc = encodeURIComponent(description.slice(0, 100) + '...')
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}%0A%0A${encodedDesc}&url=${encodedUrl}&hashtags=BuildLab,WebDev`
  const redditUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-slate-800/50 hover:bg-[#1DA1F2]/20 text-slate-400 hover:text-[#1DA1F2] rounded-lg transition-all"
          title="Share on Twitter"
        >
          <Twitter size={18} />
        </a>
        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-slate-800/50 hover:bg-[#FF4500]/20 text-slate-400 hover:text-[#FF4500] rounded-lg transition-all"
          title="Share on Reddit"
        >
          <MessageCircle size={18} />
        </a>
        <button
          onClick={copyToClipboard}
          className="p-2 bg-slate-800/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-lg transition-all"
          title="Copy link"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Link2 size={18} />}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-300">Share this idea</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg transition-all border border-[#1DA1F2]/20"
        >
          <Twitter size={18} />
          <span className="text-sm font-medium">Twitter</span>
        </a>
        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 text-[#FF4500] rounded-lg transition-all border border-[#FF4500]/20"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">Reddit</span>
        </a>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-all border border-slate-700/50"
        >
          {copied ? (
            <>
              <Check size={18} className="text-green-400" />
              <span className="text-sm font-medium text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Link2 size={18} />
              <span className="text-sm font-medium">Copy Link</span>
            </>
          )}
        </button>
        {'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all border border-purple-500/20"
          >
            <Share2 size={18} />
            <span className="text-sm font-medium">More</span>
          </button>
        )}
      </div>
    </div>
  )
}
