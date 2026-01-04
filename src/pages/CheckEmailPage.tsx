import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { BuildLabLogo } from '../components/BuildLabLogo'

export function CheckEmailPage() {
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
          {/* Email Icon with animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="absolute -top-1 -right-1 left-0 right-0 mx-auto w-fit">
              <CheckCircle className="w-8 h-8 text-green-400 bg-slate-900 rounded-full" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
          
          <p className="text-slate-400 mb-6 leading-relaxed">
            We've sent a confirmation link to your email address. 
            Click the link to verify your account and get started building!
          </p>

          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-slate-300">Didn't receive the email?</span>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Check your spam folder or wait a few minutes. 
              The link expires in 24 hours.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Sign In
            </Link>
            
            <Link
              to="/"
              className="block w-full py-3 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* Footer tip */}
        <p className="mt-6 text-slate-500 text-sm">
          Once verified, you'll be able to submit ideas and vote on projects!
        </p>
      </div>
    </div>
  )
}
