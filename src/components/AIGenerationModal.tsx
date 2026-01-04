import { useState } from 'react'
import { X, Sparkles, FileText, Target, Code, BarChart3, BookOpen, Loader2 } from 'lucide-react'

interface GenerationOptions {
  marketResearch: boolean
  projectCharter: boolean
  prd: boolean
  techSpec: boolean
  codePrototype: boolean
  customInstructions: string
  focusArea: string
}

interface AIGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (options: GenerationOptions) => Promise<void>
  projectTitle: string
  projectDescription: string
}

const FOCUS_AREAS = [
  { id: 'balanced', label: 'Balanced', description: 'Equal focus on all aspects' },
  { id: 'budget', label: 'Budget-Focused', description: 'Optimize for cost efficiency' },
  { id: 'speed', label: 'Speed-to-Market', description: 'Prioritize quick development' },
  { id: 'quality', label: 'Quality-First', description: 'Focus on robust, scalable solution' },
  { id: 'mvp', label: 'MVP Only', description: 'Minimal viable product approach' },
  { id: 'enterprise', label: 'Enterprise-Grade', description: 'Full-scale production ready' },
]

const REPORT_OPTIONS = [
  { 
    id: 'marketResearch', 
    label: 'Market Research', 
    icon: BarChart3,
    description: 'Competitor analysis, market size, target audience insights'
  },
  { 
    id: 'projectCharter', 
    label: 'Project Charter', 
    icon: Target,
    description: 'Goals, scope, stakeholders, success criteria, timeline'
  },
  { 
    id: 'prd', 
    label: 'Product Requirements (PRD)', 
    icon: FileText,
    description: 'User stories, features, acceptance criteria, priorities'
  },
  { 
    id: 'techSpec', 
    label: 'Technical Specification', 
    icon: BookOpen,
    description: 'Architecture, tech stack, database design, APIs'
  },
  { 
    id: 'codePrototype', 
    label: 'Code Prototype', 
    icon: Code,
    description: 'Working starter code with project structure'
  },
]

export function AIGenerationModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  projectTitle,
  projectDescription 
}: AIGenerationModalProps) {
  const [options, setOptions] = useState<GenerationOptions>({
    marketResearch: true,
    projectCharter: true,
    prd: true,
    techSpec: true,
    codePrototype: false,
    customInstructions: '',
    focusArea: 'balanced',
  })
  const [generating, setGenerating] = useState(false)

  const handleToggle = (key: keyof GenerationOptions) => {
    if (typeof options[key] === 'boolean') {
      setOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await onGenerate(options)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setGenerating(false)
    }
  }

  const selectedCount = REPORT_OPTIONS.filter(
    opt => options[opt.id as keyof GenerationOptions]
  ).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Project Generation</h2>
              <p className="text-slate-400 text-sm">Customize what you want to generate</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Preview */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Generating for</p>
            <h3 className="text-white font-semibold">{projectTitle}</h3>
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{projectDescription}</p>
          </div>

          {/* Focus Area */}
          <div>
            <label className="block text-white font-medium mb-3">Focus Area</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FOCUS_AREAS.map(area => (
                <button
                  key={area.id}
                  onClick={() => setOptions(prev => ({ ...prev, focusArea: area.id }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    options.focusArea === area.id
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-medium text-sm">{area.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{area.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Report Types */}
          <div>
            <label className="block text-white font-medium mb-3">
              Select Reports to Generate
              <span className="text-slate-400 font-normal ml-2">({selectedCount} selected)</span>
            </label>
            <div className="space-y-2">
              {REPORT_OPTIONS.map(option => {
                const Icon = option.icon
                const isChecked = options[option.id as keyof GenerationOptions] as boolean
                return (
                  <button
                    key={option.id}
                    onClick={() => handleToggle(option.id as keyof GenerationOptions)}
                    className={`w-full p-4 rounded-xl border flex items-start gap-4 text-left transition-all ${
                      isChecked
                        ? 'bg-slate-800 border-cyan-500/50'
                        : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isChecked
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-slate-500'
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={isChecked ? 'text-cyan-400' : 'text-slate-400'} />
                        <span className={`font-medium ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                          {option.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-white font-medium mb-2">
              Custom Instructions
              <span className="text-slate-400 font-normal ml-2">(optional)</span>
            </label>
            <textarea
              value={options.customInstructions}
              onChange={(e) => setOptions(prev => ({ ...prev, customInstructions: e.target.value }))}
              placeholder="Add specific requirements, constraints, or focus areas...&#10;&#10;Examples:&#10;• Focus on mobile-first design&#10;• Budget constraint of $5,000&#10;• Must integrate with Stripe&#10;• Target launch in 4 weeks"
              className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700/50 p-6 flex items-center justify-between">
          <div className="text-slate-400 text-sm">
            {selectedCount === 0 ? (
              <span className="text-yellow-400">Select at least one report type</span>
            ) : (
              <span>Estimated time: ~{selectedCount * 30} seconds</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || selectedCount === 0}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
