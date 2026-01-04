import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Globe, Zap, ShoppingCart, BarChart3, Cloud, Smartphone, Gamepad2, Sparkles, X, Clock, AlertTriangle, CreditCard, Loader2, Rocket, Check } from 'lucide-react'
import { GiphyPicker } from '../components/GiphyPicker'
import { useSubmissionLimits, SUBMISSION_PACK_SIZES, PREMIUM_TIERS, createCheckoutSession, createPremiumCheckoutSession } from '../lib/submissions'
import { useToast } from '../components/Toast'

const CATEGORIES = [
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'webapp', label: 'Web Application', icon: Zap },
  { value: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart },
  { value: 'dashboard', label: 'Dashboard / Admin', icon: BarChart3 },
  { value: 'saas', label: 'SaaS Product', icon: Cloud },
  { value: 'mobile', label: 'Mobile Web App', icon: Smartphone },
  { value: 'game', label: 'Interactive / Game', icon: Gamepad2 },
  { value: 'other', label: 'Other', icon: Sparkles }
]

export function SubmitPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const submissionLimits = useSubmissionLimits()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState<number | string | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    short_description: '',
    detailed_description: '',
    target_audience: '',
    features: [''],
    design_preferences: '',
    examples_inspiration: '',
    budget_notes: '',
    gif_url: null as string | null
  })

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const success = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')
    const isPremium = searchParams.get('premium')
    
    if (success === 'true') {
      if (isPremium === 'true') {
        showToast('Premium purchase successful! AI generation will start with your next submission.', 'success')
      } else {
        showToast('Payment successful! Your extra submissions have been added.', 'success')
      }
      submissionLimits.refresh()
      // Clear the URL params
      window.history.replaceState({}, '', '/submit')
    } else if (cancelled === 'true') {
      showToast('Payment cancelled', 'info')
      window.history.replaceState({}, '', '/submit')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handlePurchase = async (packSize: number) => {
    setPurchaseLoading(packSize)
    try {
      const url = await createCheckoutSession(packSize)
      if (url) {
        window.location.href = url
      } else {
        showToast('Failed to create checkout session. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      showToast('An error occurred. Please try again.', 'error')
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handlePremiumPurchase = async (tierId: 'pro_generate' | 'premium') => {
    setPurchaseLoading(tierId)
    try {
      const url = await createPremiumCheckoutSession(tierId)
      if (url) {
        window.location.href = url
      } else {
        showToast('Failed to create checkout session. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Premium purchase error:', error)
      showToast('An error occurred. Please try again.', 'error')
    } finally {
      setPurchaseLoading(null)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
        <p className="text-slate-400 mb-8">You need to be signed in to submit a build request.</p>
        <button
          onClick={() => navigate('/auth')}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl"
        >
          Sign In
        </button>
      </div>
    )
  }

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Use a submission slot
      const used = await submissionLimits.useSubmission()
      if (!used) {
        showToast('No submissions remaining. Please purchase more.', 'error')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('build_requests').insert({
        user_id: user.id,
        title: formData.title,
        category: formData.category,
        short_description: formData.short_description,
        detailed_description: formData.detailed_description,
        target_audience: formData.target_audience,
        features: formData.features.filter(f => f.trim() !== ''),
        design_preferences: formData.design_preferences,
        examples_inspiration: formData.examples_inspiration,
        budget_notes: formData.budget_notes,
        gif_url: formData.gif_url,
        status: 'submitted'
      })

      if (error) throw error
      
      showToast('Build request submitted successfully!', 'success')
      navigate('/dashboard')
    } catch (error) {
      console.error('Error submitting:', error)
      showToast('Failed to submit. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Submission Limit Banner */}
      {!submissionLimits.loading && (
        <div className={`mb-8 p-4 rounded-xl border ${
          submissionLimits.canSubmit 
            ? 'bg-cyan-500/10 border-cyan-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {submissionLimits.canSubmit ? (
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Sparkles className="text-cyan-400" size={20} />
                </div>
              ) : (
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="text-red-400" size={20} />
                </div>
              )}
              <div>
                <div className="text-white font-medium">
                  {submissionLimits.canSubmit 
                    ? `${submissionLimits.totalRemaining} submission${submissionLimits.totalRemaining !== 1 ? 's' : ''} remaining`
                    : 'No submissions remaining this week'}
                </div>
                <div className="text-slate-400 text-sm">
                  {submissionLimits.resetDate && (
                    <>
                      <Clock size={12} className="inline mr-1" />
                      Resets {submissionLimits.resetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </>
                  )}
                  {submissionLimits.extraRemaining > 0 && (
                    <span className="ml-2 text-purple-400">
                      +{submissionLimits.extraRemaining} bonus
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-400 hover:to-pink-500 transition-all"
            >
              <CreditCard size={16} />
              Get More Submissions
            </button>
          </div>
        </div>
      )}

      {/* No Submissions Left - Block Form */}
      {!submissionLimits.loading && !submissionLimits.canSubmit && (
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
          <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-yellow-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Weekly Limit Reached</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            You've used your free weekly submission. Purchase additional submissions to keep sharing your ideas!
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {SUBMISSION_PACK_SIZES.map((pack) => (
              <button
                key={pack.count}
                onClick={() => handlePurchase(pack.count)}
                disabled={purchaseLoading !== null}
                className={`relative p-6 rounded-xl border transition-all ${
                  pack.popular 
                    ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20' 
                    : 'bg-slate-800 border-slate-700 hover:border-purple-500/50'
                } ${purchaseLoading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {pack.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                    Popular
                  </span>
                )}
                {purchaseLoading === pack.count ? (
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-white mb-1">{pack.count}</div>
                )}
                <div className="text-slate-400 text-sm mb-3">submissions</div>
                <div className="text-purple-400 font-semibold">${pack.price}</div>
              </button>
            ))}
          </div>
          
          <p className="text-slate-500 text-sm">
            Secure payment via Stripe • Submissions never expire
          </p>
        </div>
      )}

      {/* Main Form - Only show if can submit */}
      {(submissionLimits.loading || submissionLimits.canSubmit) && (
        <>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Submit Your Build Request</h1>
        <p className="text-slate-400">
          Provide detailed specs for your project. The more detail, the better!
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`w-20 h-1 mx-2 rounded ${step > s ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., AI-Powered Recipe Finder"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => updateField('category', cat.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.category === cat.value
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icon size={24} className="mb-1" />
                    <div className="text-sm font-medium">{cat.label}</div>
                  </button>
                )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Short Description * <span className="text-slate-500">(max 200 chars)</span>
              </label>
              <textarea
                value={formData.short_description}
                onChange={(e) => updateField('short_description', e.target.value)}
                placeholder="A brief elevator pitch for your project..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
              <div className="text-right text-slate-500 text-sm mt-1">
                {formData.short_description.length}/200
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.category || !formData.short_description}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Detailed Specs */}
      {step === 2 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6">Detailed Specifications</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={formData.detailed_description}
                onChange={(e) => updateField('detailed_description', e.target.value)}
                placeholder="Describe your project in detail. What problem does it solve? What should it do? How should it work?"
                rows={6}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Audience
              </label>
              <input
                type="text"
                value={formData.target_audience}
                onChange={(e) => updateField('target_audience', e.target.value)}
                placeholder="Who is this for? e.g., Small business owners, students, developers..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Key Features
              </label>
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder={`Feature ${index + 1}`}
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  + Add Another Feature
                </button>
              </div>
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
              disabled={!formData.detailed_description}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Design & Submit */}
      {step === 3 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6">Design & Inspiration</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Design Preferences
              </label>
              <textarea
                value={formData.design_preferences}
                onChange={(e) => updateField('design_preferences', e.target.value)}
                placeholder="Describe the look and feel you want. Colors, style (modern, minimal, playful, professional), any specific design requirements..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Examples & Inspiration
              </label>
              <textarea
                value={formData.examples_inspiration}
                onChange={(e) => updateField('examples_inspiration', e.target.value)}
                placeholder="Link to websites, apps, or designs that inspire you. What do you like about them?"
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.budget_notes}
                onChange={(e) => updateField('budget_notes', e.target.value)}
                placeholder="Any other details, timeline preferences, or notes for the team..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>

            {/* GIF Picker */}
            <GiphyPicker
              selectedGif={formData.gif_url}
              onSelect={(url) => setFormData(prev => ({ ...prev, gif_url: url }))}
            />
          </div>

          {/* Preview Card */}
          <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            <div className="flex items-start gap-4">
              {/* GIF Preview */}
              {formData.gif_url ? (
                <img 
                  src={formData.gif_url} 
                  alt="Project GIF" 
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-slate-600"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex-shrink-0 border border-slate-600 flex items-center justify-center">
                  <span className="text-slate-500 text-2xl">📋</span>
                </div>
              )}
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.value === formData.category)
                    const Icon = cat?.icon
                    return Icon && <Icon size={24} className="text-cyan-400" />
                  })()}
                  <span className="text-white font-medium">{formData.title}</span>
                </div>
                <p className="text-slate-400 text-sm">{formData.short_description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>by @{profile?.username}</span>
                  <span>•</span>
                  <span>{formData.features.filter(f => f.trim()).length} features</span>
                </div>
              </div>
            </div>
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
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {loading ? 'Submitting...' : 'Submit to Competition'}
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Buy More Submissions Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Get More Submissions</h3>
              <button
                onClick={() => setShowBuyModal(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Premium Tiers */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Rocket className="text-purple-400" size={20} />
                Premium Packages
                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {PREMIUM_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className={`relative p-6 rounded-xl border transition-all ${
                      tier.popular 
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500 ring-2 ring-purple-500/20' 
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="text-xl font-bold text-white">{tier.name}</h5>
                        <p className="text-slate-400 text-sm">{tier.submissions} premium submissions</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">${tier.price}</div>
                        <div className="text-slate-500 text-xs">one-time</div>
                      </div>
                    </div>
                    
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="text-green-400 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handlePremiumPurchase(tier.id as 'pro_generate' | 'premium')}
                      disabled={purchaseLoading !== null}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        tier.popular
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-400 hover:to-pink-500'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      } ${purchaseLoading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {purchaseLoading === tier.id ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        <>Get {tier.name}</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg flex-shrink-0">
                    <Sparkles className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">What you get with Premium</p>
                    <p className="text-slate-400 text-sm">
                      Our AI automatically generates market research, business plans, technical specs, 
                      and a <strong className="text-white">working prototype hosted on BuildLab</strong>. 
                      You'll also get a <strong className="text-white">GitHub repository</strong> with the full codebase. 
                      Share your prototype with anyone via a simple link!
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Basic Packs */}
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                Basic Submission Packs
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                {SUBMISSION_PACK_SIZES.map((pack) => (
                  <button
                    key={pack.count}
                    onClick={() => handlePurchase(pack.count)}
                    disabled={purchaseLoading !== null}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all bg-slate-800/50 border-slate-700 hover:border-slate-600 ${
                      purchaseLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {purchaseLoading === pack.count ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      ) : (
                        <div className="text-lg font-bold text-white">{pack.count}</div>
                      )}
                      <div className="text-slate-400 text-sm">submissions</div>
                    </div>
                    <div className="text-slate-300 font-semibold">${pack.price}</div>
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Basic packs include submissions only (no AI generation)
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <p className="text-slate-500 text-xs">
                Secure payment via Stripe • Submissions never expire
              </p>
              <button
                onClick={() => setShowBuyModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
