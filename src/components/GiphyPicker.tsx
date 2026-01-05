import { useState, useEffect } from 'react'
import { Search, X, Loader2, Sparkles } from 'lucide-react'

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY

interface GiphyImage {
  id: string
  title: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
    fixed_height_small: {
      url: string
      width: string
      height: string
    }
    original: {
      url: string
    }
  }
}

interface GiphyPickerProps {
  selectedGif: string | null
  onSelect: (url: string | null) => void
}

export function GiphyPicker({ selectedGif, onSelect }: GiphyPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState<GiphyImage[]>([])
  const [loading, setLoading] = useState(false)
  const [trendingLoaded, setTrendingLoaded] = useState(false)

  const searchGifs = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg`
      )
      const data = await response.json()
      setGifs(data.data || [])
    } catch (error) {
      console.error('Failed to search GIFs:', error)
    }
    setLoading(false)
  }

  // Load trending GIFs on open
  useEffect(() => {
    if (!isOpen || trendingLoaded || search) return

    const fetchTrending = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=pg`
        )
        const data = await response.json()
        setGifs(data.data || [])
        setTrendingLoaded(true)
      } catch (error) {
        console.error('Failed to load trending GIFs:', error)
      }
      setLoading(false)
    }
    
    fetchTrending()
  }, [isOpen, trendingLoaded, search])

  // Search with debounce
  useEffect(() => {
    if (!search.trim()) {
      return
    }

    const timer = setTimeout(() => {
      searchGifs(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const handleSelect = (gif: GiphyImage) => {
    onSelect(gif.images.fixed_height_small.url)
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
  }

  if (!isOpen) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Project GIF <span className="text-slate-500">(optional)</span>
        </label>
        
        {selectedGif ? (
          <div className="relative inline-block">
            <img
              src={selectedGif}
              alt="Selected GIF"
              className="h-20 rounded-lg border border-slate-600"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="absolute -bottom-2 -right-2 p-1.5 bg-cyan-500 rounded-full text-white hover:bg-cyan-600 transition-colors"
            >
              <Search size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-600 border-dashed rounded-lg text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
          >
            <Sparkles size={18} />
            <span>Add a fun GIF to your project</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Project GIF <span className="text-slate-500">(optional)</span>
      </label>
      
      <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden max-w-full">
        {/* Header */}
        <div className="p-3 border-b border-slate-700 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GIPHY..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* GIF Grid */}
        <div className="p-3 max-h-64 overflow-y-auto overflow-x-hidden touch-pan-y">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-cyan-400" size={24} />
            </div>
          ) : gifs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {search ? 'No GIFs found' : 'Search for a GIF'}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => handleSelect(gif)}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-cyan-500 transition-all group"
                >
                  <img
                    src={gif.images.fixed_height_small.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Select</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500">Powered by GIPHY</span>
          {selectedGif && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove GIF
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
