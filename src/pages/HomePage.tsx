import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { FileText, Vote, Trophy, Rocket, Zap, Globe, ShoppingCart, Smartphone, Gamepad2, Bot, Hammer, DollarSign, Users, Shield } from 'lucide-react'
import { CompetitionCountdown } from '../components/CompetitionCountdown'
import { BuildLabLogo } from '../components/BuildLabLogo'

export function HomePage() {
  const { user } = useAuthStore()

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="absolute top-20 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Link to={user ? "/submit" : "/auth"} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm mb-8 hover:bg-cyan-500/20 transition-all cursor-pointer">
              Weekly Competition Now Live! Click here to submit your idea.
            </Link>
            
            {/* Logo above title */}
            <div className="flex justify-center mb-8">
              <BuildLabLogo size="xl" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Turn Your Ideas Into{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                Reality
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Submit detailed build requests for websites and web apps. 
              Win weekly competitions and get your project built for free by our expert team.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to="/submit"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/25"
                >
                  Submit Your Idea
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/25"
                >
                  Get Started Free
                </Link>
              )}
              <Link
                to="/explore"
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all border border-slate-700/50"
              >
                Explore Ideas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From idea to launch in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: FileText,
                title: 'Submit Your Idea',
                description: 'Create a detailed build request with specs, features, and design preferences.'
              },
              {
                icon: Vote,
                title: 'Community Votes',
                description: 'Your idea enters the weekly competition. Refine it and gather votes from the community.'
              },
              {
                icon: Trophy,
                title: 'Win the Week',
                description: 'Voting closes Thursday 8PM CST. The top-voted idea wins!'
              },
              {
                icon: Rocket,
                title: 'We Build It',
                description: 'Our team builds your project. You own the business, we handle the tech.'
              }
            ].map((step, index) => {
              const Icon = step.icon
              return (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-cyan-500/30 to-purple-500/30" />
                )}
                <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 text-center hover:border-cyan-500/30 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                    <Icon className="text-cyan-400" size={32} />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/25">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </div>
              </div>
            )
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What Can You Build?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From simple landing pages to complex web applications
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Websites', desc: 'Landing pages, portfolios, blogs, company sites' },
              { icon: Zap, title: 'Web Apps', desc: 'SaaS products, dashboards, tools, platforms' },
              { icon: ShoppingCart, title: 'E-Commerce', desc: 'Online stores, marketplaces, booking systems' },
              { icon: Smartphone, title: 'Mobile Web', desc: 'Progressive web apps, responsive designs' },
              { icon: Gamepad2, title: 'Interactive', desc: 'Games, quizzes, calculators, tools' },
              { icon: Bot, title: 'AI-Powered', desc: 'Chatbots, automations, smart features' }
            ].map((category, index) => {
              const Icon = category.icon
              return (
              <div
                key={index}
                className="group p-6 bg-slate-900/30 hover:bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-cyan-500/30 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div className="mb-4">
                  <Icon className="text-cyan-400 group-hover:text-cyan-300 transition-colors" size={40} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {category.title}
                </h3>
                <p className="text-slate-400">{category.desc}</p>
              </div>
            )
            })}
          </div>
        </div>
      </section>

      {/* Two Ways to Participate */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Two Ways to Participate
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Whether you have ideas or skills, there's a place for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Idea Creators */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-500/40 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/25">
                  <FileText className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Submit Ideas</h3>
                <p className="text-slate-400 mb-6">
                  Have a great idea for a website or app? Submit it to our weekly competition. 
                  Get votes from the community and boost your idea with funds to increase visibility.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-300">
                    <Vote className="text-cyan-400 flex-shrink-0" size={18} />
                    <span>Compete in weekly voting rounds</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <DollarSign className="text-cyan-400 flex-shrink-0" size={18} />
                    <span>Boost your idea with funding</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Trophy className="text-cyan-400 flex-shrink-0" size={18} />
                    <span>Win and get your project built</span>
                  </li>
                </ul>
                <Link
                  to={user ? "/submit" : "/auth"}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all"
                >
                  Submit Your Idea
                  <Rocket size={18} />
                </Link>
              </div>
            </div>

            {/* Builders */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                  <Hammer className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Become a Builder</h3>
                <p className="text-slate-400 mb-6">
                  Are you a developer or designer? Join our builder network and take on winning projects. 
                  Get paid to build amazing products for the community.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-300">
                    <Users className="text-purple-400 flex-shrink-0" size={18} />
                    <span>Join verified builder network</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Shield className="text-purple-400 flex-shrink-0" size={18} />
                    <span>Secure contracts & payments</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <DollarSign className="text-purple-400 flex-shrink-0" size={18} />
                    <span>Earn from funded projects</span>
                  </li>
                </ul>
                <Link
                  to="/auth?role=builder"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-400 hover:to-purple-500 transition-all"
                >
                  Apply as Builder
                  <Hammer size={18} />
                </Link>
              </div>
            </div>
          </div>

          {/* Platform Fee Note */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-full border border-slate-700/50">
              <Shield className="text-green-400" size={20} />
              <span className="text-slate-300">
                <span className="text-green-400 font-semibold">Secure Platform</span> — Small platform fee on funded projects ensures quality & accountability
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Competition Countdown with Calendar */}
      <CompetitionCountdown />
    </div>
  )
}
