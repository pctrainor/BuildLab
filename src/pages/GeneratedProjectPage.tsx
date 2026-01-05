import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/auth'
import { 
  BarChart3, 
  Code, 
  Github, 
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
  Check,
  Sparkles,
  ClipboardList
} from 'lucide-react'
import { useToast } from '../components/Toast'
import Markdown from 'react-markdown'

interface GeneratedProject {
  id: string
  build_request_id: string
  project_slug: string
  market_research: string | null
  project_charter: string | null
  prd: string | null
  tech_spec: string | null
  code_files: Record<string, string> | null
  preview_url: string | null
  github_url: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  generated_at: string | null
  build_request: {
    title: string
    short_description: string
    category: string
  }
}

type TabType = 'overview' | 'research' | 'charter' | 'prd' | 'tech' | 'code'
type SectionType = 'marketResearch' | 'projectCharter' | 'prd' | 'techSpec' | 'codePrototype'

export function GeneratedProjectPage() {
  const { projectSlug } = useParams()
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [project, setProject] = useState<GeneratedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [copied, setCopied] = useState(false)
  const [copiedContext, setCopiedContext] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingSection, setGeneratingSection] = useState<SectionType | null>(null)

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectSlug) return

      const { data, error } = await supabase
        .from('generated_projects')
        .select(`
          *,
          build_request:build_requests(id, title, short_description, category)
        `)
        .eq('project_slug', projectSlug)
        .single()

      if (error) {
        console.error('Error loading project:', error)
      } else if (data) {
        // Extract build_request_id from the nested build_request
        const projectData = {
          ...data,
          build_request_id: data.build_request?.id || data.build_request_id,
        }
        setProject(projectData as unknown as GeneratedProject)
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

  // Copy all project context as JSON
  const copyAllContext = () => {
    if (!project) return

    const contextData = {
      project: {
        title: project.build_request?.title || '',
        slug: project.project_slug,
        description: project.build_request?.short_description || '',
        category: project.build_request?.category || '',
        status: project.status,
        generated_at: project.generated_at,
        github_url: project.github_url,
      },
      documents: {
        market_research: project.market_research || null,
        project_charter: project.project_charter || null,
        prd: project.prd || null,
        tech_spec: project.tech_spec || null,
      },
      code_files: project.code_files || {},
    }

    navigator.clipboard.writeText(JSON.stringify(contextData, null, 2))
    setCopiedContext(true)
    showToast('All project context copied to clipboard!', 'success')
    setTimeout(() => setCopiedContext(false), 2000)
  }

  const downloadCode = () => {
    if (!project?.code_files) {
      showToast('No code files to download', 'error')
      return
    }
    
    const codeFiles = project.code_files as Record<string, string>
    const projectName = project.build_request?.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'project'
    
    // Create a formatted download with instructions
    const downloadData = {
      projectName,
      generatedAt: project.generated_at,
      instructions: "To use this code: 1) Create a new folder, 2) Create each file with its content, 3) Run 'npm install' then 'npm run dev'",
      files: codeFiles
    }
    
    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}-code.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToast('Code files downloaded!', 'success')
  }

  const generateSection = async (section: SectionType) => {
    if (!project?.build_request_id) {
      showToast('Cannot generate: missing project reference', 'error')
      return
    }
    
    setGeneratingSection(section)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        showToast('Session expired. Please log out and log back in.', 'error')
        setGeneratingSection(null)
        return
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-project`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            build_request_id: project.build_request_id,
            options: {
              generateOnly: section,
            }
          }),
        }
      )

      if (!response.ok) throw new Error('Generation failed')
      
      const sectionNames: Record<SectionType, string> = {
        marketResearch: 'Market Research',
        projectCharter: 'Project Charter',
        prd: 'PRD',
        techSpec: 'Tech Spec',
        codePrototype: 'Code Prototype',
      }
      
      showToast(`${sectionNames[section]} generation started! This may take a minute.`, 'success')
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        if (!projectSlug) return
        const { data } = await supabase
          .from('generated_projects')
          .select('*')
          .eq('project_slug', projectSlug)
          .single()
        
        if (data) {
          // Check if the specific section is now populated
          const sectionFieldMap: Record<SectionType, string> = {
            marketResearch: 'market_research',
            projectCharter: 'project_charter',
            prd: 'prd',
            techSpec: 'tech_spec',
            codePrototype: 'code_files',
          }
          const field = sectionFieldMap[section]
          const value = data[field as keyof typeof data]
          
          if (value && (typeof value === 'string' ? value.length > 0 : Object.keys(value as object).length > 0)) {
            clearInterval(pollInterval)
            setGeneratingSection(null)
            setProject(prev => prev ? { ...prev, ...data } as GeneratedProject : null)
            showToast(`${sectionNames[section]} generated successfully!`, 'success')
          }
        }
      }, 3000)
      
      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        if (generatingSection === section) {
          setGeneratingSection(null)
          showToast('Generation is taking longer than expected. Please refresh the page.', 'error')
        }
      }, 120000)

    } catch {
      showToast('Failed to start generation', 'error')
      setGeneratingSection(null)
    }
  }

  const startGeneration = async () => {
    if (!project) return
    setGenerating(true)
    
    try {
      // Refresh session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
      
      if (sessionError || !session?.access_token) {
        showToast('Session expired. Please log out and log back in.', 'error')
        setGenerating(false)
        return
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-project`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ build_request_id: project.id }),
        }
      )

      if (!response.ok) throw new Error('Generation failed')
      
      showToast('Project generation started! This may take a few minutes.', 'success')
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        if (!projectSlug) return
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
              onClick={copyAllContext}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
              title="Copy all project context as JSON"
            >
              {copiedContext ? <Check size={18} /> : <ClipboardList size={18} />}
              <span>{copiedContext ? 'Copied!' : 'Copy All Context'}</span>
            </button>
            
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              {copied ? <Check size={18} /> : <Share2 size={18} />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
            
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

            {/* Show GitHub connect prompt when code exists but no GitHub URL */}
            {!project.github_url && project.code_files && typeof project.code_files === 'object' && Object.keys(project.code_files as Record<string, string>).length > 0 && (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 transition-colors"
              >
                <Github size={18} />
                <span className="text-sm">Sign in with GitHub to auto-create repos</span>
              </Link>
            )}

            {/* Download Code button - shows when code files exist */}
            {project.code_files && typeof project.code_files === 'object' && Object.keys(project.code_files as Record<string, string>).length > 0 && (
              <button
                onClick={downloadCode}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors border border-green-500/30"
              >
                <Download size={18} />
                <span>Download Code</span>
              </button>
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
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">Market research not yet generated.</p>
                <button
                  onClick={() => generateSection('marketResearch')}
                  disabled={generatingSection !== null}
                  className="flex items-center gap-2 px-4 py-2 mx-auto bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50"
                >
                  {generatingSection === 'marketResearch' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate Market Research</span>
                    </>
                  )}
                </button>
              </div>
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
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">Project charter not yet generated.</p>
                <button
                  onClick={() => generateSection('projectCharter')}
                  disabled={generatingSection !== null}
                  className="flex items-center gap-2 px-4 py-2 mx-auto bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50"
                >
                  {generatingSection === 'projectCharter' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate Project Charter</span>
                    </>
                  )}
                </button>
              </div>
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
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">PRD not yet generated.</p>
                <button
                  onClick={() => generateSection('prd')}
                  disabled={generatingSection !== null}
                  className="flex items-center gap-2 px-4 py-2 mx-auto bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50"
                >
                  {generatingSection === 'prd' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate PRD</span>
                    </>
                  )}
                </button>
              </div>
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
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">Technical spec not yet generated.</p>
                <button
                  onClick={() => generateSection('techSpec')}
                  disabled={generatingSection !== null}
                  className="flex items-center gap-2 px-4 py-2 mx-auto bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50"
                >
                  {generatingSection === 'techSpec' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate Tech Spec</span>
                    </>
                  )}
                </button>
              </div>
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
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">Code not yet generated.</p>
                <button
                  onClick={() => generateSection('codePrototype')}
                  disabled={generatingSection !== null}
                  className="flex items-center gap-2 px-4 py-2 mx-auto bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50"
                >
                  {generatingSection === 'codePrototype' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating Code...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate Code Prototype</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
