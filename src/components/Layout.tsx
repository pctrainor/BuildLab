import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../lib/auth'
import { Compass, Trophy, HelpCircle, PlusCircle, LayoutDashboard, User, LogOut, Sparkles, Menu, X } from 'lucide-react'
import { BuildLabLogo } from './BuildLabLogo'

export function Layout() {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/95 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <BuildLabLogo size="sm" />
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/explore"
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <Compass size={18} className="text-cyan-400" />
                <span>Explore</span>
              </Link>
              <Link
                to="/competitions"
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <Trophy size={18} className="text-cyan-300" />
                <span>Competitions</span>
              </Link>
              <Link
                to="/campaigns"
                className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors"
              >
                <Sparkles size={18} className="text-purple-400" />
                <span>Campaigns</span>
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-2 text-slate-400 hover:text-purple-500 transition-colors"
              >
                <Trophy size={18} className="text-purple-500" />
                <span>Leaderboard</span>
              </Link>
              <Link
                to="/how-it-works"
                className="flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors"
              >
                <HelpCircle size={18} className="text-pink-400" />
                <span>How It Works</span>
              </Link>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              {user ? (
                <>
                  <Link
                    to="/submit"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/25"
                  >
                    <PlusCircle size={18} />
                    <span>Submit Idea</span>
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg shadow-cyan-500/25">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-slate-300 hidden sm:block">
                        {profile?.username || 'User'}
                      </span>
                    </button>
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 rounded-xl border border-slate-700/50 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <LayoutDashboard size={16} />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </Link>
                        <hr className="my-2 border-slate-700/50" />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/25"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Compass size={20} className="text-cyan-400" />
                <span>Explore</span>
              </Link>
              <Link
                to="/competitions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Trophy size={20} className="text-cyan-300" />
                <span>Competitions</span>
              </Link>
              <Link
                to="/campaigns"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-purple-400 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Sparkles size={20} className="text-purple-400" />
                <span>Campaigns</span>
              </Link>
              <Link
                to="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-purple-500 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Trophy size={20} className="text-purple-500" />
                <span>Leaderboard</span>
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-pink-400 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <HelpCircle size={20} className="text-pink-400" />
                <span>How It Works</span>
              </Link>
              
              <hr className="border-slate-800/50 my-2" />
              
              {user ? (
                <>
                  <Link
                    to="/submit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg"
                  >
                    <PlusCircle size={20} />
                    <span>Submit Idea</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link to="/explore" className="text-slate-400 hover:text-white transition-colors">Explore Ideas</Link></li>
                <li><Link to="/competitions" className="text-slate-400 hover:text-white transition-colors">Competitions</Link></li>
                <li><Link to="/leaderboard" className="text-slate-400 hover:text-white transition-colors">Leaderboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/guidelines" className="text-slate-400 hover:text-white transition-colors">Submission Guidelines</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/careers" className="text-slate-400 hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500">© 2026 BuildLab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
