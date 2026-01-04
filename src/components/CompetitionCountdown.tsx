import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Trophy, ChevronLeft, ChevronRight, Flame, Users } from 'lucide-react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getNextThursday8PMCST(): Date {
  const now = new Date()
  // Convert to CST (UTC-6)
  const cstOffset = -6 * 60
  const localOffset = now.getTimezoneOffset()
  const cstTime = new Date(now.getTime() + (localOffset - cstOffset) * 60 * 1000)
  
  // 3-day competition window: Mon-Wed submit, Thu 8PM voting closes
  // Find next Thursday
  const daysUntilThursday = (4 - cstTime.getDay() + 7) % 7
  const nextThursday = new Date(cstTime)
  
  if (daysUntilThursday === 0 && cstTime.getHours() >= 20) {
    // It's Thursday after 8 PM, go to next Thursday
    nextThursday.setDate(cstTime.getDate() + 7)
  } else if (daysUntilThursday === 0) {
    // It's Thursday before 8 PM, use today
    nextThursday.setDate(cstTime.getDate())
  } else {
    nextThursday.setDate(cstTime.getDate() + daysUntilThursday)
  }
  
  nextThursday.setHours(20, 0, 0, 0) // 8 PM
  
  // Convert back to local time
  return new Date(nextThursday.getTime() - (localOffset - cstOffset) * 60 * 1000)
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime()
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference
  }
}

// TimeBlock component - defined outside main component
function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative group">
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 sm:p-6 text-center min-w-[80px] sm:min-w-[100px] shadow-xl">
        <div className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-b from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent tabular-nums">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="text-xs sm:text-sm text-slate-400 mt-2 uppercase tracking-widest font-medium">
          {label}
        </div>
      </div>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
    </div>
  )
}

// Separator component - defined outside main component
function Separator() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-cyan-400/60 text-3xl sm:text-4xl font-bold pb-6">
      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
    </div>
  )
}

export function CompetitionCountdown() {
  const [targetDate] = useState(() => getNextThursday8PMCST())
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate))
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  // Calendar helpers
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth)
  const today = new Date()
  const competitionDay = targetDate.getDate()
  const competitionMonth = targetDate.getMonth()
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Get all Thursdays in the current month for highlighting
  const getThursdaysInMonth = () => {
    const thursdays: number[] = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date.getDay() === 4) { // Thursday
        thursdays.push(day)
      }
    }
    return thursdays
  }
  
  const thursdays = getThursdaysInMonth()

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
            <Flame size={16} />
            <span>Live Competition</span>
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Voting Closes In
          </h2>
          <p className="text-slate-400 text-lg">
            3-day sprints: Submit Mon-Wed, Vote Thu 8PM CST • Top idea wins!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Countdown Timer */}
          <div className="order-2 lg:order-1">
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
              <TimeBlock value={timeLeft.days} label="Days" />
              <Separator />
              <TimeBlock value={timeLeft.hours} label="Hours" />
              <Separator />
              <TimeBlock value={timeLeft.minutes} label="Mins" />
              <Separator />
              <TimeBlock value={timeLeft.seconds} label="Secs" />
            </div>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Competition Progress</span>
                <span>{Math.max(0, 100 - Math.round((timeLeft.total / (7 * 24 * 60 * 60 * 1000)) * 100))}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(0, 100 - (timeLeft.total / (7 * 24 * 60 * 60 * 1000)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
                  <Trophy size={20} />
                  <span className="text-2xl font-bold">12</span>
                </div>
                <p className="text-slate-400 text-sm">Ideas Competing</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
                  <Users size={20} />
                  <span className="text-2xl font-bold">847</span>
                </div>
                <p className="text-slate-400 text-sm">Votes Cast</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/competitions"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/25"
              >
                <Trophy size={20} />
                View & Vote Now
              </Link>
              <Link
                to="/submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-800/50 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all border border-slate-700/50"
              >
                Submit for Next Week
              </Link>
            </div>
          </div>

          {/* Calendar */}
          <div className="order-1 lg:order-2">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <Calendar className="text-cyan-400" size={20} />
                  <h3 className="text-lg font-semibold text-white">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                </div>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const isToday = today.getDate() === day && 
                                  today.getMonth() === currentMonth.getMonth() && 
                                  today.getFullYear() === currentMonth.getFullYear()
                  const isCompetitionDay = thursdays.includes(day)
                  const isNextCompetition = day === competitionDay && 
                                            currentMonth.getMonth() === competitionMonth &&
                                            currentMonth.getFullYear() === targetDate.getFullYear()
                  const isPast = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                  return (
                    <div
                      key={day}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium relative
                        transition-all cursor-default
                        ${isToday ? 'bg-slate-700 text-white ring-2 ring-cyan-500' : ''}
                        ${isNextCompetition ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30' : ''}
                        ${isCompetitionDay && !isNextCompetition ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : ''}
                        ${!isToday && !isCompetitionDay && !isPast ? 'text-slate-300 hover:bg-slate-800/50' : ''}
                        ${isPast && !isToday ? 'text-slate-600' : ''}
                      `}
                    >
                      {day}
                      {isNextCompetition && (
                        <div className="absolute -top-1 -right-1">
                          <Clock size={12} className="text-white" />
                        </div>
                      )}
                      {isCompetitionDay && !isNextCompetition && !isPast && (
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-cyan-500 to-purple-600 rounded" />
                  <span>Next Competition</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500/30 border border-purple-500/50 rounded" />
                  <span>Voting Day (Thursdays)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-700 ring-2 ring-cyan-500 rounded" />
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
