import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { BuildRequestWithProfile } from '../lib/database.types'
import { Trophy, Star, ChevronLeft, ChevronRight, Flame, DollarSign, TrendingUp, Calendar, Zap } from 'lucide-react'

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

export function CompetePage() {
  const [topProjects, setTopProjects] = useState<BuildRequestWithProfile[]>([])
  const [pastWinners, setPastWinners] = useState<BuildRequestWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'projects' | 'creators' | 'winners'>('projects')
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
      // Fetch top projects by vote count (this week's contenders)
      const { data: projects } = await supabase
        .from('build_requests')
        .select('*, profiles(*)')
        .order('vote_count', { ascending: false })
        .limit(10)
      
      setTopProjects((projects as BuildRequestWithProfile[]) || [])

      // Fetch past winners
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
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
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
      {/* Hero Section with Countdown */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-3xl p-8 mb-8 border border-purple-500/20 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="text-orange-400" size={28} />
                <span className="text-orange-400 font-semibold text-lg">Weekly Competition</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                Submit & Compete for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Victory</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl">
                Every Thursday at 8PM CST, votes are tallied and winners are crowned. Submit your best ideas and rise to the top!
              </p>
            </div>
            
            {/* Countdown Timer */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="text-center mb-4">
                <div className="text-slate-400 text-sm mb-1">Competition Closes In</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white tabular-nums">{timeLeft.days.toString().padStart(2, '0')}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider">Days</div>
                </div>
                <div className="text-2xl text-slate-600">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider">Hours</div>
                </div>
                <div className="text-2xl text-slate-600">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider">Mins</div>
                </div>
                <div className="text-2xl text-slate-600">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 tabular-nums">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider">Secs</div>
                </div>
              </div>
              <Link
                to="/submit"
                className="mt-4 block w-full text-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/25"
              >
                Submit Your Idea →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column - Top Projects */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden sticky top-20">
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={20} />
                  <h2 className="text-lg font-bold text-white">Top Projects</h2>
                </div>
                <Link to="/leaderboard" className="text-cyan-400 text-sm hover:underline">
                  View All →
                </Link>
              </div>
              <p className="text-xs text-slate-400 mt-1">Projects competing this week</p>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-12 bg-slate-800 rounded"></div>
                  </div>
                ))
              ) : topProjects.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-slate-400 text-sm">No projects yet this week</p>
                  <Link to="/submit" className="text-cyan-400 text-sm hover:underline mt-2 inline-block">
                    Be the first to submit →
                  </Link>
                </div>
              ) : (
                topProjects.slice(0, 7).map((project, index) => (
                  <Link 
                    key={project.id} 
                    to={`/request/${project.id}`}
                    className="block p-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
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

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{project.title}</div>
                        <div className="text-xs text-slate-500 truncate">
                          by @{project.profiles?.username || 'anonymous'}
                        </div>
                      </div>

                      {/* Vote Count */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className={`text-sm font-bold ${
                          index === 0 ? 'text-yellow-400' : 'text-cyan-400'
                        }`}>
                          {project.vote_count || 0}
                        </div>
                        <Star size={12} className={index === 0 ? 'text-yellow-400' : 'text-slate-500'} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            
            {/* Top Creators Link */}
            <div className="p-3 border-t border-slate-800/50 bg-slate-900/50">
              <Link 
                to="/leaderboard" 
                className="flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-yellow-400" />
                  <span>View Top Creators</span>
                </div>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Center Column - Calendar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Calendar with enhanced deadline highlight */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="text-slate-400" size={20} />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="text-cyan-400" size={20} />
                <h3 className="text-lg font-semibold text-white">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
              </div>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="text-slate-400" size={20} />
              </button>
            </div>
            
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day, i) => (
                <div key={i} className="text-center text-sm text-slate-500 font-medium py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
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
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative ${
                      isCompetitionDay
                        ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-xl shadow-purple-500/40 scale-110 z-10 ring-2 ring-purple-400/50'
                        : isToday
                        ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                        : isThursday
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    {day}
                    {isCompetitionDay && (
                      <div className="absolute -top-1 -right-1">
                        <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Enhanced Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-purple-500/30" />
                <span className="text-sm text-white font-medium">Next Deadline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500/30 border border-purple-500/50" />
                <span className="text-sm text-slate-400">All Thursdays</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-500/20 border-2 border-cyan-500/50" />
                <span className="text-sm text-slate-400">Today</span>
              </div>
            </div>
          </div>

          {/* Tabs and Content */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab('creators')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                tab === 'creators'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              <Trophy size={16} />
              <span>About Competition</span>
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

          {/* Tab Content */}
          {tab === 'creators' && (
            <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-semibold text-white mb-4">How the Competition Works</h3>
              <div className="space-y-4 text-slate-400">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Submit Your Idea</h4>
                    <p className="text-sm">Share your project concept with the community before Thursday 8PM CST.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Gather Votes</h4>
                    <p className="text-sm">Community members vote on their favorite ideas throughout the week.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Win & Build</h4>
                    <p className="text-sm">Top voted ideas get featured and can receive funding to become reality!</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <Link
                  to="/leaderboard"
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View Current Rankings →
                </Link>
              </div>
            </div>
          )}

          {tab === 'winners' && (
            <div className="space-y-4">
              {pastWinners.length === 0 ? (
                <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/50 text-center">
                  <Trophy className="text-yellow-400 mx-auto mb-3" size={32} />
                  <h3 className="text-lg font-semibold text-white mb-2">No Winners Yet</h3>
                  <p className="text-slate-400 text-sm">Be the first to win a competition!</p>
                </div>
              ) : (
                pastWinners.slice(0, 5).map((winner) => (
                  <Link
                    key={winner.id}
                    to={`/request/${winner.id}`}
                    className="block bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-yellow-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="text-yellow-400" size={16} />
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                        Winner
                      </span>
                      <span className="text-slate-500 text-xs ml-auto">
                        {winner.updated_at ? new Date(winner.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
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
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column - Funding & Stats */}
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
                <p className="text-slate-500 text-xs">Goes directly to fund the project</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 text-sm font-medium">Platform Fee</span>
                  <span className="text-cyan-400 font-bold">15%</span>
                </div>
                <p className="text-slate-500 text-xs">Supports BuildLab operations</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <TrendingUp size={14} />
                <span>Funding is non-refundable.</span>
              </div>
            </div>
          </div>
          
          {/* Platform Stats */}
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
