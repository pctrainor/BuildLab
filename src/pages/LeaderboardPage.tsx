import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Profile, BuildRequestWithProfile } from '../lib/database.types'
import { Trophy, Star, Clock, ChevronLeft, ChevronRight, Flame, DollarSign, TrendingUp } from 'lucide-react'

// Countdown Timer Logic
function getNextThursday8PMCST(): Date {
  const now = new Date()
  const cstOffset = -6 * 60
  const localOffset = now.getTimezoneOffset()
  const cstTime = new Date(now.getTime() + (localOffset - cstOffset) * 60 * 1000)
  
  const daysUntilThursday = (4 - cstTime.getDay() + 7) % 7
  const nextThursday = new Date(cstTime)
  
  if (daysUntilThursday === 0 && cstTime.getHours() >= 20) {
    nextThursday.setDate(cstTime.getDate() + 7)
  } else if (daysUntilThursday === 0) {
    nextThursday.setDate(cstTime.getDate())
  } else {
    nextThursday.setDate(cstTime.getDate() + daysUntilThursday)
  }
  
  nextThursday.setHours(20, 0, 0, 0)
  return new Date(nextThursday.getTime() - (localOffset - cstOffset) * 60 * 1000)
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime()
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  }
}

export function LeaderboardPage() {
  const [topCreators, setTopCreators] = useState<Profile[]>([])
  const [pastWinners, setPastWinners] = useState<BuildRequestWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'creators' | 'winners'>('creators')
  const [targetDate] = useState(() => getNextThursday8PMCST())
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate))
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  useEffect(() => {
    const loadData = async () => {
      const { data: creators } = await supabase
        .from('profiles')
        .select('*')
        .order('total_votes_received', { ascending: false })
        .limit(10)
      
      setTopCreators(creators || [])

      const { data: winners } = await supabase
        .from('build_requests')
        .select('*, profiles(*)')
        .eq('status', 'winner')
        .order('updated_at', { ascending: false })
        .limit(20)
      
      setPastWinners((winners as BuildRequestWithProfile[]) || [])
      setLoading(false)
    }
    
    loadData()
  }, [])

  // Calendar helpers
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth)
  const today = new Date()
  const competitionDay = targetDate.getDate()
  const competitionMonth = targetDate.getMonth()

  const getThursdaysInMonth = () => {
    const thursdays: number[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      if (date.getDay() === 4) thursdays.push(day)
    }
    return thursdays
  }
  
  const thursdays = getThursdaysInMonth()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Compact Countdown Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 mb-8 border border-slate-700/50">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Flame className="text-cyan-400" size={24} />
            </div>
            <div>
              <div className="text-white font-semibold">Competition Closes Thursday 8PM CST</div>
              <div className="text-slate-400 text-sm">Submit your idea before voting ends!</div>
            </div>
          </div>
          
          {/* Compact Timer */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl px-4 py-2 border border-slate-700/50">
              <Clock size={16} className="text-cyan-400 mr-2" />
              <span className="text-2xl font-bold text-white tabular-nums">{timeLeft.days.toString().padStart(2, '0')}</span>
              <span className="text-slate-500 text-sm mr-2">d</span>
              <span className="text-2xl font-bold text-white tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="text-slate-500 text-sm mr-2">h</span>
              <span className="text-2xl font-bold text-white tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="text-slate-500 text-sm mr-2">m</span>
              <span className="text-2xl font-bold text-cyan-400 tabular-nums">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="text-slate-500 text-sm">s</span>
            </div>
            <Link
              to="/submit"
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Submit Idea
            </Link>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column - Top Creators Leaderboard */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden sticky top-20">
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-400" size={20} />
                <h2 className="text-lg font-bold text-white">Top Creators</h2>
              </div>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-10 bg-slate-800 rounded"></div>
                  </div>
                ))
              ) : (
                topCreators.slice(0, 10).map((creator, index) => {
                  const content = (
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        index === 0
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                          : index === 1
                          ? 'bg-slate-400/20 text-slate-300 border border-slate-400'
                          : index === 2
                          ? 'bg-amber-600/20 text-amber-500 border border-amber-600'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {creator.username?.[0]?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">@{creator.username}</div>
                        <div className="text-xs text-cyan-400">View profile →</div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-cyan-400">{creator.total_votes_received || 0}</div>
                          <div className="text-xs text-slate-500">votes</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-400">{creator.wins_count || 0}</div>
                          <div className="text-xs text-slate-500">wins</div>
                        </div>
                      </div>
                    </div>
                  )
                  
                  return (
                    <Link 
                      key={creator.id} 
                      to={`/u/${creator.username}`}
                      className="block p-3 hover:bg-slate-800/30 transition-colors"
                    >
                      {content}
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Calendar + Content */}
        <div className="lg:col-span-5 space-y-6">
          {/* Calendar */}
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="text-slate-400" size={18} />
              </button>
              <h3 className="text-base font-semibold text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="text-slate-400" size={18} />
              </button>
            </div>
            
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((day, i) => (
                <div key={i} className="text-center text-xs text-slate-500 font-medium py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const isToday = today.getDate() === day && 
                                today.getMonth() === currentMonth.getMonth() && 
                                today.getFullYear() === currentMonth.getFullYear()
                const isCompetitionDay = day === competitionDay && 
                                         currentMonth.getMonth() === competitionMonth &&
                                         currentMonth.getFullYear() === targetDate.getFullYear()
                const isThursday = thursdays.includes(day)
                
                return (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      isCompetitionDay
                        ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30 scale-105 z-10'
                        : isToday
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : isThursday
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded bg-gradient-to-br from-cyan-500 to-purple-600" />
                <span className="text-slate-400">Next Deadline</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded bg-purple-500/50" />
                <span className="text-slate-400">Thursdays</span>
              </div>
            </div>
          </div>

          {/* Tabs and Content */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('creators')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                tab === 'creators'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              <Trophy size={16} />
              <span>Top Creators</span>
            </button>
            <button
              onClick={() => setTab('winners')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                tab === 'winners'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              <Star size={16} />
              <span>Past Winners</span>
            </button>
          </div>

          {/* Past Winners Grid */}
          {tab === 'winners' && (
            <div className="space-y-4">
              {pastWinners.map((winner) => (
                <Link
                  key={winner.id}
                  to={`/request/${winner.id}`}
                  className="block bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-yellow-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-yellow-400" size={16} />
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      Winner
                    </span>
                    <span className="text-slate-500 text-xs ml-auto">
                      {new Date(winner.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {winner.title}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-2">{winner.short_description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">@{winner.profiles?.username}</span>
                    <span className="text-cyan-400 text-sm font-medium">{winner.vote_count} votes</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {tab === 'creators' && (
            <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/50 text-center">
              <Trophy className="text-yellow-400 mx-auto mb-3" size={32} />
              <h3 className="text-lg font-semibold text-white mb-2">Want to climb the ranks?</h3>
              <p className="text-slate-400 text-sm mb-4">Submit ideas, gather votes, and win competitions to become a top creator!</p>
              <Link
                to="/submit"
                className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
              >
                Submit Your Idea
              </Link>
            </div>
          )}
        </div>

        {/* Right Column - Funding Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* How Funding Works */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="text-green-400" size={20} />
              <h3 className="font-bold text-white">Project Funding</h3>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">
              Boost your favorite ideas with funding! Contributors help bring projects to life.
            </p>
            
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 text-sm font-medium">Creator Receives</span>
                  <span className="text-green-400 font-bold">85%</span>
                </div>
                <p className="text-slate-500 text-xs">Goes directly to fund the project per creator's terms</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 text-sm font-medium">Platform Fee</span>
                  <span className="text-cyan-400 font-bold">15%</span>
                </div>
                <p className="text-slate-500 text-xs">Supports BuildLab operations & development</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <TrendingUp size={14} />
                <span>Funding is non-refundable. Review project terms before contributing.</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
            <h3 className="font-bold text-white mb-4">Platform Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Ideas</span>
                <span className="text-white font-semibold">2,400+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Projects Built</span>
                <span className="text-cyan-400 font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Funded</span>
                <span className="text-green-400 font-semibold">$48,250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Community</span>
                <span className="text-purple-400 font-semibold">12K+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
