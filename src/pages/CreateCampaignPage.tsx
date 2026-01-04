import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Calendar, DollarSign, Users, FileText, Sparkles, Check, Info } from 'lucide-react'
import { useToast } from '../components/Toast'

const CAMPAIGN_CATEGORIES = [
  'Website',
  'Web Application',
  'Mobile App',
  'E-Commerce',
  'SaaS',
  'AI/ML',
  'Other'
]

export function CreateCampaignPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    voting_days: '3',
    prize_pool: '',
    entry_fee: '0',
    max_entries: '',
    contract_terms: ''
  })

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
        <p className="text-slate-400 mb-8">You need to be signed in to create a campaign.</p>
        <button
          onClick={() => navigate('/auth')}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl"
        >
          Sign In
        </button>
      </div>
    )
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateVotingEnd = () => {
    if (!formData.deadline) return ''
    const deadline = new Date(formData.deadline)
    deadline.setDate(deadline.getDate() + parseInt(formData.voting_days || '3'))
    return deadline.toISOString()
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('campaigns').insert({
        creator_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        deadline: formData.deadline,
        voting_ends_at: calculateVotingEnd(),
        prize_pool: parseFloat(formData.prize_pool || '0'),
        entry_fee: parseFloat(formData.entry_fee || '0'),
        max_entries: formData.max_entries ? parseInt(formData.max_entries) : null,
        contract_terms: formData.contract_terms || null,
        status: 'active'
      })

      if (error) throw error
      
      showToast('Campaign created successfully!', 'success')
      navigate('/campaigns')
    } catch (error) {
      console.error('Error creating campaign:', error)
      showToast('Failed to create campaign. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Link */}
      <button
        onClick={() => navigate('/campaigns')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Back to Campaigns
      </button>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-4">
          <Sparkles size={16} />
          Create a Campaign
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Launch Your Competition</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Create a custom campaign to crowdsource ideas from the BuildLab community. 
          Set your own rules, budget, and prize pool.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[
          { num: 1, label: 'Basics' },
          { num: 2, label: 'Budget & Prizes' },
          { num: 3, label: 'Terms' }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s.num
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > s.num ? <Check size={18} /> : s.num}
              </div>
              <span className={`text-xs mt-1 ${step >= s.num ? 'text-purple-400' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-16 h-1 mx-2 rounded ${step > s.num ? 'bg-purple-500' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText className="text-purple-400" size={24} />
            Campaign Basics
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Design a Modern Dashboard for My Startup"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe what you're looking for in detail. What problem are you solving? What do you want built?"
                rows={5}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField('category', cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.category === cat
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Submission Deadline *
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => updateField('deadline', e.target.value)}
                min={minDateString}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-slate-500 text-sm mt-1">
                After submissions close, voting will run for {formData.voting_days} days
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.description || !formData.deadline}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Budget & Prizes */}
      {step === 2 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <DollarSign className="text-green-400" size={24} />
            Budget & Prizes
          </h2>
          
          <div className="space-y-6">
            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Budget Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => updateField('budget_min', e.target.value)}
                    placeholder="Min"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => updateField('budget_max', e.target.value)}
                    placeholder="Max"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Let builders know your expected budget range for the project
              </p>
            </div>

            {/* Prize Pool */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prize Pool *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={formData.prize_pool}
                  onChange={(e) => updateField('prize_pool', e.target.value)}
                  placeholder="500"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-slate-500 text-sm mt-1">
                The total amount you'll award to the winning entry
              </p>
            </div>

            {/* Entry Fee */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Entry Fee
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={formData.entry_fee}
                  onChange={(e) => updateField('entry_fee', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Set to $0 for free entries, or charge a fee to filter serious proposals
              </p>
            </div>

            {/* Max Entries */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Users size={16} className="inline mr-2" />
                Maximum Entries
              </label>
              <input
                type="number"
                value={formData.max_entries}
                onChange={(e) => updateField('max_entries', e.target.value)}
                placeholder="Unlimited"
                min="1"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-slate-500 text-sm mt-1">
                Leave empty for unlimited entries
              </p>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.prize_pool}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Contract Terms */}
      {step === 3 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText className="text-purple-400" size={24} />
            Contract Terms
          </h2>
          
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Optional Contract Terms</p>
                <p className="text-blue-400/80">
                  Specify any special terms for the winning builder. This could include IP ownership, 
                  delivery timelines, revision policies, etc. These are not legally binding through BuildLab.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contract Terms & Conditions
              </label>
              <textarea
                value={formData.contract_terms}
                onChange={(e) => updateField('contract_terms', e.target.value)}
                placeholder={`Example terms:\n\n• Winner receives 50% upfront, 50% on completion\n• Deliverables include source code and documentation\n• 2 rounds of revisions included\n• Expected completion within 4 weeks\n• All IP rights transfer to campaign creator upon payment`}
                rows={8}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Voting Period (Days)
              </label>
              <select
                value={formData.voting_days}
                onChange={(e) => updateField('voting_days', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                <option value="1">1 day</option>
                <option value="2">2 days</option>
                <option value="3">3 days</option>
                <option value="5">5 days</option>
                <option value="7">7 days</option>
              </select>
              <p className="text-slate-500 text-sm mt-1">
                After submissions close, how long should voting remain open?
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Campaign Summary</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Title:</span>
                <span className="text-white font-medium">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="text-white">{formData.category || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prize Pool:</span>
                <span className="text-green-400 font-semibold">${formData.prize_pool || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Fee:</span>
                <span className="text-white">{parseFloat(formData.entry_fee) > 0 ? `$${formData.entry_fee}` : 'Free'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deadline:</span>
                <span className="text-white">{formData.deadline || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created by:</span>
                <span className="text-white">@{profile?.username}</span>
              </div>
            </div>
          </div>

          {/* Platform Fee Notice */}
          <div className="mt-4 p-4 bg-slate-900/30 rounded-xl border border-slate-800 text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Platform Fee:</span> BuildLab takes a 10% fee from campaign prize pools to maintain the platform.
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {loading ? 'Creating...' : 'Launch Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
