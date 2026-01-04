import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react'
import { BuildLabLogo } from '../components/BuildLabLogo'

export function EmailConfirmedPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <BuildLabLogo size="lg" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-800/50 shadow-2xl">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-400" />
            <Sparkles className="absolute bottom-0 left-1/4 w-4 h-4 text-cyan-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Welcome to BuildLab!</h2>
          
          <p className="text-slate-400 mb-6 leading-relaxed">
            Your email has been verified successfully. 
            You're all set to start submitting ideas and voting on projects!
          </p>

          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-4 mb-6 border border-cyan-500/20">
            <p className="text-cyan-300 font-medium">
              Redirecting to dashboard in {countdown}s...
            </p>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Go to Dashboard Now
            <ArrowRight size={18} />
          </Link>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-sm mb-3">Quick actions:</p>
            <div className="flex gap-3">
              <Link
                to="/submit"
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
              >
                Submit Idea
              </Link>
              <Link
                to="/explore"
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
              >
                Browse Ideas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
