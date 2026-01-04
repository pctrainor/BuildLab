import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Loader2, Maximize2, Minimize2, ExternalLink, Download } from 'lucide-react'

interface GeneratedProject {
  id: string
  project_slug: string
  code_files: Record<string, string> | null
  preview_url: string | null
  build_request: {
    title: string
    short_description: string
  }
}

// Generate a complete HTML document that loads React from CDN and runs the code
function generateLivePreviewHtml(codeFiles: Record<string, string>, title: string): string {
  const indexCss = codeFiles['src/index.css'] || ''
  const appTsx = codeFiles['src/App.tsx'] || codeFiles['src/App.jsx'] || ''
  
  // Extract additional page components
  const pages: Record<string, string> = {}
  Object.entries(codeFiles).forEach(([path, content]) => {
    if (path.startsWith('src/pages/') && (path.endsWith('.tsx') || path.endsWith('.jsx'))) {
      const pageName = path.replace('src/pages/', '').replace(/\.(tsx|jsx)$/, '')
      pages[pageName] = content
    }
  })
  
  // Extract components
  const components: Record<string, string> = {}
  Object.entries(codeFiles).forEach(([path, content]) => {
    if (path.startsWith('src/components/') && (path.endsWith('.tsx') || path.endsWith('.jsx'))) {
      const compName = path.replace('src/components/', '').replace(/\.(tsx|jsx)$/, '')
      components[compName] = content
    }
  })

  // Clean the App code for browser execution
  function cleanCodeForBrowser(code: string): string {
    return code
      // Remove import statements (we'll use globals)
      .replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
      // Remove export statements but keep the content
      .replace(/^export\s+default\s+/gm, 'const __DefaultExport__ = ')
      .replace(/^export\s+/gm, '')
      // Convert TypeScript to JavaScript
      .replace(/:\s*(React\.FC|FC|string|number|boolean|any|\w+\[\]|Record<[^>]+>)\s*(?=[=,)])/g, '')
      .replace(/<[A-Z]\w*(?:\s+extends\s+[^>]+)?>/g, '') // Remove generics
      .replace(/:\s*(React\.ReactNode|JSX\.Element|void)\s*(?=[{=])/g, '')
      .replace(/interface\s+\w+\s*\{[^}]+\}/g, '') // Remove interfaces
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
      // Clean up any remaining TypeScript syntax
      .replace(/as\s+\w+/g, '')
      .replace(/\?\./g, '?.') // Keep optional chaining, it's valid JS
  }

  const cleanedApp = cleanCodeForBrowser(appTsx)
  
  // Build page components
  const pageScripts = Object.entries(pages).map(([name, code]) => {
    const cleaned = cleanCodeForBrowser(code)
    return `
      // Page: ${name}
      ${cleaned}
      window.Pages = window.Pages || {};
      window.Pages['${name}'] = typeof __DefaultExport__ !== 'undefined' ? __DefaultExport__ : ${name};
    `
  }).join('\n')

  // Build component scripts  
  const componentScripts = Object.entries(components).map(([name, code]) => {
    const cleaned = cleanCodeForBrowser(code)
    return `
      // Component: ${name}
      ${cleaned}
      window.Components = window.Components || {};
      window.Components['${name}'] = typeof __DefaultExport__ !== 'undefined' ? __DefaultExport__ : ${name};
    `
  }).join('\n')

  // Process CSS - remove Tailwind directives but keep custom styles
  const processedCss = indexCss
    .replace(/@tailwind\s+[^;]+;/g, '')
    .replace(/@layer\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/@apply\s+[^;]+;/g, (match) => {
      // Convert common @apply directives to actual CSS
      const classes = match.replace('@apply', '').replace(';', '').trim().split(/\s+/)
      const cssProps: string[] = []
      classes.forEach(cls => {
        if (cls.includes('bg-')) cssProps.push('/* background */')
        if (cls.includes('text-')) cssProps.push('/* text */')
        if (cls.includes('p-')) cssProps.push('/* padding */')
        if (cls.includes('m-')) cssProps.push('/* margin */')
      })
      return cssProps.join(' ')
    })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Live Preview</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            zinc: {
              950: '#09090b',
            }
          }
        }
      }
    }
  </script>
  
  <!-- React & ReactDOM from CDN -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  
  <!-- Babel for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    body { background-color: #09090b; color: white; min-height: 100vh; margin: 0; }
    #root { min-height: 100vh; }
    .icon-placeholder { display: inline-flex; width: 20px; height: 20px; align-items: center; justify-content: center; }
    ${processedCss}
  </style>
</head>
<body class="bg-zinc-950 text-white dark">
  <div id="root">
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-zinc-400">Loading preview...</p>
      </div>
    </div>
  </div>

  <script type="text/babel" data-presets="react">
    // Setup React globals
    const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;
    
    // Mock react-router-dom
    const BrowserRouter = ({ children }) => children;
    const Router = ({ children }) => children;
    const Routes = ({ children }) => {
      const childArray = React.Children.toArray(children);
      // Just render the first route (Home) for simplicity
      const firstRoute = childArray.find(child => 
        child.props && child.props.path === '/'
      );
      return firstRoute ? firstRoute.props.element : childArray[0]?.props?.element || null;
    };
    const Route = ({ element }) => element;
    const Link = ({ to, children, className, ...props }) => (
      <a href={to} className={className} onClick={(e) => e.preventDefault()} {...props}>{children}</a>
    );
    const Outlet = () => <div className="outlet-placeholder"></div>;
    const useParams = () => ({});
    const useNavigate = () => () => {};
    const useLocation = () => ({ pathname: '/' });
    
    // Mock lucide-react icons
    const createIcon = (name) => ({ className, size = 24, ...props }) => (
      <span 
        className={\`icon-placeholder \${className || ''}\`} 
        style={{ width: size, height: size }}
        title={name}
        {...props}
      >
        <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </span>
    );
    
    // Common icons
    const Home = createIcon('Home');
    const Info = createIcon('Info');
    const Mail = createIcon('Mail');
    const User = createIcon('User');
    const Video = createIcon('Video');
    const MessageSquare = createIcon('MessageSquare');
    const MessageCircle = createIcon('MessageCircle');
    const Calendar = createIcon('Calendar');
    const ShoppingBag = createIcon('ShoppingBag');
    const DollarSign = createIcon('DollarSign');
    const Star = createIcon('Star');
    const Phone = createIcon('Phone');
    const Facebook = createIcon('Facebook');
    const Twitter = createIcon('Twitter');
    const Instagram = createIcon('Instagram');
    const Check = createIcon('Check');
    const X = createIcon('X');
    const Trophy = createIcon('Trophy');
    const Sparkles = createIcon('Sparkles');
    const ArrowRight = createIcon('ArrowRight');
    const Menu = createIcon('Menu');
    const Search = createIcon('Search');
    const Settings = createIcon('Settings');
    const LogOut = createIcon('LogOut');
    const Plus = createIcon('Plus');
    const Minus = createIcon('Minus');
    const Edit = createIcon('Edit');
    const Trash = createIcon('Trash');
    const ExternalLink = createIcon('ExternalLink');
    const ChevronRight = createIcon('ChevronRight');
    const ChevronLeft = createIcon('ChevronLeft');
    const ChevronDown = createIcon('ChevronDown');
    const ChevronUp = createIcon('ChevronUp');
    const Clock = createIcon('Clock');
    const Heart = createIcon('Heart');
    const Share = createIcon('Share');
    const Download = createIcon('Download');
    const Upload = createIcon('Upload');
    const Image = createIcon('Image');
    const Film = createIcon('Film');
    const Music = createIcon('Music');
    const Play = createIcon('Play');
    const Pause = createIcon('Pause');
    const Volume = createIcon('Volume');
    const Loader2 = createIcon('Loader2');
    const AlertCircle = createIcon('AlertCircle');
    const CheckCircle = createIcon('CheckCircle');
    const XCircle = createIcon('XCircle');
    
    // Mock axios
    const axios = {
      get: async (url) => ({ data: {} }),
      post: async (url, data) => ({ data: {} }),
    };
    
    // Mock Redux
    const configureStore = () => ({ getState: () => ({}), dispatch: () => {} });
    const createSlice = (config) => ({ 
      reducer: () => config.initialState, 
      actions: {} 
    });
    const useSelector = () => ({});
    const useDispatch = () => () => {};
    const Provider = ({ children }) => children;
    
    // Pages container
    window.Pages = window.Pages || {};
    window.Components = window.Components || {};
    
    // Load page components
    ${pageScripts}
    
    // Load components
    ${componentScripts}

    // Main App component
    ${cleanedApp}
    
    // Get the App component
    const AppComponent = typeof App !== 'undefined' ? App : 
                         typeof __DefaultExport__ !== 'undefined' ? __DefaultExport__ : 
                         () => <div className="p-8 text-center">Preview Loading...</div>;
    
    // Render the app
    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);
    root.render(<AppComponent />);
  </script>
  
  <script>
    // Error handling for the preview
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('Preview Error:', msg);
      const root = document.getElementById('root');
      root.innerHTML = \`
        <div class="min-h-screen flex items-center justify-center p-8">
          <div class="max-w-lg text-center">
            <div class="text-6xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bold mb-4 text-red-400">Preview Error</h2>
            <p class="text-zinc-400 mb-4">The generated code couldn't be previewed in the browser.</p>
            <p class="text-sm text-zinc-500 bg-zinc-900 p-4 rounded-lg text-left font-mono overflow-auto">\${msg}</p>
            <p class="text-zinc-500 mt-4">Download the code to run it locally with proper tooling.</p>
          </div>
        </div>
      \`;
      return true;
    };
  </script>
</body>
</html>`
}

export function DemoPage() {
  const { projectSlug } = useParams()
  const [project, setProject] = useState<GeneratedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [iframeContent, setIframeContent] = useState<string>('')

  useEffect(() => {
    const loadProject = async () => {
      if (!projectSlug) return

      const { data, error } = await supabase
        .from('generated_projects')
        .select(`
          id,
          project_slug,
          code_files,
          preview_url,
          build_request:build_requests(title, short_description)
        `)
        .eq('project_slug', projectSlug)
        .single()

      if (error) {
        console.error('Error loading project:', error)
        setLoading(false)
        return
      }

      setProject(data as GeneratedProject)
      
      // Generate the iframe content from code_files
      if (data?.code_files) {
        const html = generateLivePreviewHtml(
          data.code_files as Record<string, string>, 
          data.build_request?.title || 'Demo'
        )
        setIframeContent(html)
      }
      
      setLoading(false)
    }

    loadProject()
  }, [projectSlug])

  const downloadCode = () => {
    if (!project?.code_files) return
    
    // Create a simple zip-like download of all files
    const files = Object.entries(project.code_files)
    const content = files.map(([path, code]) => `// FILE: ${path}\n// ${'='.repeat(60)}\n\n${code}`).join('\n\n\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.project_slug}-code.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!project || !iframeContent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Preview Not Available</h1>
          <p className="text-slate-400 mb-6">This project doesn't have a preview yet.</p>
          <Link to={`/project/${projectSlug}`} className="text-cyan-400 hover:underline">
            ← Back to Project
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-950 ${fullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      {/* Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/project/${projectSlug}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Project</span>
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-white font-medium">{project.build_request?.title}</span>
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Live Preview</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCode}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <Download size={16} />
            <span>Download Code</span>
          </button>
          {project.preview_url && (
            <a
              href={project.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ExternalLink size={16} />
              <span>Open External</span>
            </a>
          )}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className={`${fullscreen ? 'h-[calc(100vh-49px)]' : 'h-[calc(100vh-120px)]'}`}>
        <iframe
          srcDoc={iframeContent}
          title={`${project.build_request?.title} Preview`}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
