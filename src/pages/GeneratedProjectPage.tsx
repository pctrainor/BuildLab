import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/auth'
import { 
  BarChart3, 
  Code, 
  Github, 
  ExternalLink, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Clock,
  Rocket,
  BookOpen,
  Target,
  Cpu,
  Share2,
  Copy,
  Check
} from 'lucide-react'
import { useToast } from '../components/Toast'
import Markdown from 'react-markdown'

interface GeneratedProject {
  id: string
  project_slug: string
  market_research: string
  project_charter: string
  prd: string
  tech_spec: string
  code_files: Record<string, string>
  preview_url: string
  github_url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  generated_at: string
  build_request: {
    title: string
    short_description: string
    category: string
  }
}

type TabType = 'overview' | 'research' | 'charter' | 'prd' | 'tech' | 'code'

export function GeneratedProjectPage() {
  const { projectSlug } = useParams()
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [project, setProject] = useState<GeneratedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectSlug) return

      const { data, error } = await supabase
        .from('generated_projects')
        .select(`
          *,
          build_request:build_requests(title, short_description, category)
        `)
        .eq('project_slug', projectSlug)
        .single()

      if (error) {
        console.error('Error loading project:', error)
      } else {
        setProject(data)
      }
      setLoading(false)
    }
    
    loadProjectData()
  }, [projectSlug])

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    showToast('Link copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const startGeneration = async () => {
    if (!project) return
    setGenerating(true)
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-project`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ build_request_id: project.id }),
        }
      )

      if (!response.ok) throw new Error('Generation failed')
      
      showToast('Project generation started! This may take a few minutes.', 'success')
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from('generated_projects')
          .select('status')
          .eq('project_slug', projectSlug)
          .single()
        
        if (data?.status === 'completed' || data?.status === 'failed') {
          clearInterval(pollInterval)
          setGenerating(false)
          window.location.reload()
        }
      }, 5000)

    } catch {
      showToast('Failed to start generation', 'error')
      setGenerating(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Rocket },
    { id: 'research', label: 'Market Research', icon: BarChart3 },
    { id: 'charter', label: 'Project Charter', icon: Target },
    { id: 'prd', label: 'PRD', icon: BookOpen },
    { id: 'tech', label: 'Tech Spec', icon: Cpu },
    { id: 'code', label: 'Code', icon: Code },
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
        <p className="text-slate-400 mb-6">This project doesn't exist or you don't have access.</p>
        <Link to="/dashboard" className="text-cyan-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                project.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : project.status === 'processing'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}>
                {project.status === 'completed' && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                {project.status === 'processing' && <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />}
                {project.status === 'pending' && <Clock className="inline w-3 h-3 mr-1" />}
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span className="text-slate-500 text-sm">
                Generated {project.generated_at ? new Date(project.generated_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {project.build_request?.title || project.project_slug}
            </h1>
            <p className="text-slate-400">
              {project.build_request?.short_description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              {copied ? <Check size={18} /> : <Share2 size={18} />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
            
            {project.preview_url && (
              <a
                href={project.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
              >
                <ExternalLink size={18} />
                <span>Live Preview</span>
              </a>
            )}
            
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors border border-purple-500/30"
              >
                <Github size={18} />
                <span>GitHub Repo</span>
              </a>
            )}

            {project.status === 'pending' && user && (
              <button
                onClick={startGeneration}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    <span>Generate Project</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Project Overview</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <BarChart3 size={20} />
                  <span className="font-medium">Market Research</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Competitor analysis, market sizing, and opportunity assessment
                </p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Target size={20} />
                  <span className="font-medium">Project Charter</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Goals, scope, stakeholders, and success criteria
                </p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-pink-400 mb-2">
                  <BookOpen size={20} />
                  <span className="font-medium">PRD</span>
                </div>
                <p className="text-slate-400 text-sm">
                  User stories, features, and acceptance criteria
                </p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Cpu size={20} />
                  <span className="font-medium">Tech Spec</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Architecture, database schema, and API design
                </p>
              </div>
            </div>

            {project.preview_url && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">Live Preview</h3>
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-slate-400 text-sm ml-2">{project.preview_url}</span>
                  </div>
                  <iframe 
                    src={project.preview_url}
                    className="w-full h-[500px] bg-white"
                    title="Project Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'research' && (
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="text-cyan-400" />
              Market Research
            </h2>
            {project.market_research ? (
              <div className="text-slate-300 prose-headings:text-white prose-strong:text-white"><Markdown>
                {project.market_research}
              </Markdown></div>
            ) : (
              <p className="text-slate-500">Market research not yet generated.</p>
            )}
          </div>
        )}

        {activeTab === 'charter' && (
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="text-purple-400" />
              Project Charter
            </h2>
            {project.project_charter ? (
              <div className="text-slate-300 prose-headings:text-white prose-strong:text-white"><Markdown>
                {project.project_charter}
              </Markdown></div>
            ) : (
              <p className="text-slate-500">Project charter not yet generated.</p>
            )}
          </div>
        )}

        {activeTab === 'prd' && (
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="text-pink-400" />
              Product Requirements Document
            </h2>
            {project.prd ? (
              <div className="text-slate-300 prose-headings:text-white prose-strong:text-white"><Markdown>
                {project.prd}
              </Markdown></div>
            ) : (
              <p className="text-slate-500">PRD not yet generated.</p>
            )}
          </div>
        )}

        {activeTab === 'tech' && (
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Cpu className="text-yellow-400" />
              Technical Specification
            </h2>
            {project.tech_spec ? (
              <div className="text-slate-300 prose-headings:text-white prose-strong:text-white"><Markdown>
                {project.tech_spec}
              </Markdown></div>
            ) : (
              <p className="text-slate-500">Technical spec not yet generated.</p>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Code className="text-green-400" />
                Generated Code
              </h2>
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <Download size={18} />
                  <span>Download from GitHub</span>
                </a>
              )}
            </div>
            
            {project.code_files && Object.keys(project.code_files).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(project.code_files).map(([filename, content]) => (
                  <div key={filename} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
                      <span className="text-cyan-400 font-mono text-sm">{filename}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(content)
                          showToast('Code copied!', 'success')
                        }}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm">
                      <code className="text-slate-300">{content}</code>
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Code not yet generated.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
