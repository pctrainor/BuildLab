// BuildLab Project Generator - Multi-Agent AI System
// This Edge Function orchestrates AI agents to generate complete project packages

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const openaiKey = Deno.env.get('OPENAI_API_KEY')!
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://buildlab.dev'

// AWS Configuration
const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!
const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!
const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1'
const s3Bucket = 'buildlab-previews'

// Production CORS - restrict to known origins
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    frontendUrl,
    'https://buildlab.dev',
    'https://www.buildlab.dev',
    // Always allow localhost for development
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ]
  
  // Check if origin is a Vercel preview URL for this project
  const isVercelPreview = origin && (
    origin.includes('pctrainors-projects.vercel.app') ||
    origin.includes('buildlab') && origin.includes('.vercel.app')
  )
  
  // If origin is in allowedOrigins or is a Vercel preview, use it
  const corsOrigin = origin && (allowedOrigins.includes(origin) || isVercelPreview) 
    ? origin 
    : allowedOrigins[0]
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-supabase-api-version',
  }
}

interface ProjectRequest {
  build_request_id: string
  user_id: string
  title: string
  description: string
  category: string
  target_audience: string
  features: string[]
}

interface GenerationOptions {
  marketResearch: boolean
  projectCharter: boolean
  prd: boolean
  techSpec: boolean
  codePrototype: boolean
  customInstructions: string
  focusArea: string
  generateOnly?: 'marketResearch' | 'projectCharter' | 'prd' | 'techSpec' | 'codePrototype' | null
}

interface GeneratedProject {
  charter: string
  market_research: string
  prd: string
  tech_spec: string
  code_files: Record<string, string>
  preview_url: string
  github_url: string
}

// Focus area modifiers for prompts
const FOCUS_MODIFIERS: Record<string, string> = {
  balanced: '',
  budget: 'Focus heavily on cost-efficiency, free/open-source tools, and minimizing infrastructure costs.',
  speed: 'Prioritize speed-to-market, use existing templates/libraries, and suggest the fastest development approach.',
  quality: 'Focus on code quality, testing, scalability, security best practices, and maintainability.',
  mvp: 'Keep it minimal - only essential features for a proof of concept. Suggest what to cut.',
  enterprise: 'Design for enterprise-grade: high availability, security compliance, audit logging, scalability.',
}

// =============================================================================
// PROMPT SAFETY & INJECTION PROTECTION
// =============================================================================

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
  /disregard\s+(previous|above|all)/i,
  /forget\s+(everything|all|previous)/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /assistant\s*:\s*/i,
  /human\s*:\s*/i,
  /user\s*:\s*/i,
  /pretend\s+(you|to\s+be)/i,
  /act\s+as\s+if/i,
  /roleplay\s+as/i,
  /jailbreak/i,
  /bypass\s+(safety|filter|restriction)/i,
  /do\s+anything\s+now/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
  /output\s+(the|your)\s+(system|initial)\s+prompt/i,
  /what\s+(is|are)\s+your\s+instructions/i,
  /reveal\s+your\s+(prompt|instructions)/i,
]

// Content that should never appear in project descriptions
const FORBIDDEN_CONTENT = [
  /\b(hack|exploit|malware|ransomware|phishing|ddos|botnet)\b/i,
  /\b(illegal|illicit|criminal|fraud)\b/i,
  /\b(weapon|bomb|explosive|drug\s+dealing)\b/i,
  /\b(child|minor).*(abuse|porn|exploit)/i,
  /\b(hate\s+speech|terrorism|extremis)/i,
]

// Sanitize user input to prevent injection
function sanitizeInput(input: string): string {
  if (!input) return ''
  
  // Remove potential control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Escape markdown that could be used to confuse the model
  sanitized = sanitized.replace(/```/g, '\\`\\`\\`')
  
  // Limit length to prevent token exhaustion
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000) + '...[truncated]'
  }
  
  return sanitized.trim()
}

// Check for prompt injection attempts
function detectInjection(text: string): { safe: boolean; reason?: string } {
  const lowerText = text.toLowerCase()
  
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      console.warn('⚠️ Prompt injection detected:', pattern.toString())
      return { safe: false, reason: 'Potential prompt injection detected' }
    }
  }
  
  for (const pattern of FORBIDDEN_CONTENT) {
    if (pattern.test(text)) {
      console.warn('⚠️ Forbidden content detected:', pattern.toString())
      return { safe: false, reason: 'Content violates usage policy' }
    }
  }
  
  return { safe: true }
}

// Validate and clean project request data
function validateProjectRequest(data: {
  title?: string
  description?: string
  short_description?: string
  target_audience?: string
  features?: string[]
  customInstructions?: string
}): { valid: boolean; error?: string; sanitized: typeof data } {
  const fields = [
    { name: 'title', value: data.title },
    { name: 'description', value: data.description },
    { name: 'short_description', value: data.short_description },
    { name: 'target_audience', value: data.target_audience },
    { name: 'customInstructions', value: data.customInstructions },
  ]
  
  // Check each field for injection
  for (const field of fields) {
    if (field.value) {
      const check = detectInjection(field.value)
      if (!check.safe) {
        return { 
          valid: false, 
          error: `${field.name}: ${check.reason}`,
          sanitized: data 
        }
      }
    }
  }
  
  // Check features array
  if (data.features) {
    for (const feature of data.features) {
      const check = detectInjection(feature)
      if (!check.safe) {
        return { valid: false, error: `Feature: ${check.reason}`, sanitized: data }
      }
    }
  }
  
  // Return sanitized data
  return {
    valid: true,
    sanitized: {
      title: sanitizeInput(data.title || ''),
      description: sanitizeInput(data.description || ''),
      short_description: sanitizeInput(data.short_description || ''),
      target_audience: sanitizeInput(data.target_audience || ''),
      features: data.features?.map(f => sanitizeInput(f)) || [],
      customInstructions: sanitizeInput(data.customInstructions || ''),
    }
  }
}

// =============================================================================
// AGENT PROMPTS
// =============================================================================

// Agent prompts for specialized tasks
const AGENT_PROMPTS = {
  research: `You are a Senior Market Research Analyst at a leading VC firm. Analyze this project idea as if pitching to investors.

Provide a comprehensive market analysis:

1. **Market Size & Opportunity**
   - TAM (Total Addressable Market) with realistic dollar figures
   - SAM (Serviceable Addressable Market)
   - SOM (Serviceable Obtainable Market) in Year 1
   - Growth trends and drivers (cite industry reports where applicable)

2. **Competitive Landscape**
   - Direct competitors (3-5) with URLs, pricing, user base estimates
   - Indirect competitors/alternatives
   - Competitive advantages and gaps in the market

3. **Target Audience Personas** (Create 3 detailed personas)
   - Demographics (age, income, location, job title)
   - Psychographics (goals, pain points, behaviors)
   - Tech savviness and buying power
   - Day-in-the-life scenario

4. **Unique Value Proposition**
   - What makes this different/better?
   - Positioning statement
   - Key differentiators

5. **Go-to-Market Strategy**
   - Customer acquisition channels (with cost estimates)
   - Marketing tactics for first 90 days
   - Pricing strategy recommendations
   - Partnership opportunities

Be specific, use realistic data, and make it actionable for a founder.`,

  product_manager: `You are a Senior Product Manager who has shipped multiple successful products at FAANG companies.

Create a comprehensive PRD that a developer can actually build from:

1. **Executive Summary** (2-3 paragraphs)
   - What are we building and why?
   - Who is it for?
   - What success looks like

2. **Problem Statement**
   - Current situation and pain points
   - Impact of the problem (quantify if possible)
   - Why now? (market timing)

3. **Goals & Success Metrics**
   - Business goals (revenue, users, retention)
   - User goals (what users can accomplish)
   - Success metrics with targets (e.g., "10k MAU in 6 months")

4. **User Stories** (15-20 stories with acceptance criteria)
   Format: "As a [user type], I want to [action], so that [benefit]"
   Include: Authentication, core features, edge cases, admin functions
   Add specific acceptance criteria for each

5. **MVP Feature Set** (Prioritized using MoSCoW)
   - MUST have (for launch)
   - SHOULD have (nice to have)
   - COULD have (future)
   - WON'T have (explicitly out of scope)

6. **User Flows** (Describe 3-5 critical flows)
   - Onboarding flow
   - Primary use case flow
   - Payment/conversion flow (if applicable)

7. **Technical Requirements**
   - Performance (load times, response times)
   - Security requirements
   - Compliance needs
   - Browser/device support

8. **Timeline & Milestones**
   - Week-by-week breakdown for 12 weeks
   - Key milestones and deliverables

9. **Risks & Mitigations**
   - Technical risks
   - Market risks
   - Resource risks
   With specific mitigation strategies for each

Format in clean Markdown with proper headers and bullet points.`,

  architect: `You are a Principal Software Architect with 15 years of experience building scalable web applications.

Design a practical, modern technical architecture:

1. **System Overview**
   - High-level architecture (Frontend → API → Database → External Services)
   - Data flow diagram description
   - Key architectural decisions and trade-offs

2. **Technology Stack** (Justify each choice)
   - Frontend: Framework, state management, styling
   - Backend: Language, framework, API design
   - Database: Type, rationale, alternatives considered
   - Authentication: Provider and approach
   - Hosting/Infrastructure: Platform recommendations
   - CI/CD: Deployment strategy

3. **Database Schema**
   Create detailed tables with:
   - Table name
   - Columns (name, type, constraints)
   - Relationships (foreign keys, indexes)
   - Sample data structure
   
   Format as SQL or plaintext schema

4. **API Design**
   - RESTful endpoints (or GraphQL if more appropriate)
   - Request/Response examples
   - Authentication flow
   - Error handling approach
   
   Format:
   \`\`\`
   GET /api/resource
   POST /api/resource
   PUT /api/resource/:id
   DELETE /api/resource/:id
   \`\`\`

5. **Authentication & Security**
   - Auth flow (JWT, OAuth, etc.)
   - Session management
   - API security (rate limiting, CORS)
   - Data encryption approach

6. **Scalability Plan**
   - How to handle 10x growth
   - Caching strategy
   - Database optimization
   - CDN and static assets

7. **Third-Party Services**
   - Required integrations (payment, email, analytics, etc.)
   - API providers and alternatives
   - Estimated costs

8. **Development Phases**
   - Phase 1: MVP core features
   - Phase 2: Scaling and optimization
   - Phase 3: Advanced features

Be specific, practical, and make it buildable by a mid-level full-stack developer.`,

  project_charter: `You are a Project Management Professional. Create a formal Project Charter including:
1. Project Title and Description
2. Business Case and Justification
3. Project Objectives (SMART goals)
4. Scope Statement (In/Out of scope)
5. Key Stakeholders
6. High-level Requirements
7. Assumptions and Constraints
8. Preliminary Budget Estimate
9. Key Milestones
10. Success Criteria

Format professionally in Markdown.`,

  coder: `You are an Expert Full-Stack Developer specializing in React, TypeScript, and Tailwind CSS.
Generate a complete, working MVP based on the provided specifications.

Requirements:
- Use React 18 with TypeScript
- Use Tailwind CSS for styling (dark theme, modern UI)
- Create realistic mock data
- Include responsive design
- Add loading states and error handling
- Use Lucide React for icons
- Make it visually impressive

CRITICAL: You MUST return ONLY a valid JSON object with no markdown code fences, no explanation, no text before or after.
The JSON must have file paths as keys and file contents as strings.
Required files: package.json, index.html, src/main.tsx, src/App.tsx, src/index.css.
Add component files as needed in src/components/.

Example structure (your response must start with { and end with }):
{"package.json": "...", "index.html": "...", "src/main.tsx": "...", "src/App.tsx": "...", "src/index.css": "..."}`,

  // Planner prompt for multi-step code generation
  code_planner: `You are a Senior Software Architect. Analyze the project requirements and create a file structure plan.

Return ONLY a valid JSON object with this exact structure:
{
  "files": [
    {"path": "package.json", "description": "NPM configuration", "priority": 1},
    {"path": "index.html", "description": "HTML entry point", "priority": 1},
    {"path": "src/main.tsx", "description": "React entry", "priority": 1},
    {"path": "src/App.tsx", "description": "Main app component", "priority": 1},
    {"path": "src/index.css", "description": "Global styles", "priority": 1},
    ...additional component files...
  ],
  "dependencies": ["react", "react-dom", "tailwindcss", ...],
  "componentHierarchy": "Brief description of component structure"
}

Keep it focused - 8-15 files maximum for an MVP. Prioritize core functionality.`,

  // Single file generator prompt
  file_generator: `You are an Expert Full-Stack Developer. Generate the content for a SINGLE file.

Requirements:
- React 18 with TypeScript
- Tailwind CSS (dark theme, modern gradients, shadows)
- Lucide React for icons
- Realistic mock data
- Professional, production-ready code

Return ONLY the raw file content. No markdown, no explanation, no code fences.
For JSON files like package.json, return valid JSON.
For TypeScript/TSX files, return valid TypeScript.
For CSS files, return valid CSS with Tailwind directives.`
}

// Call OpenAI API
async function callAgent(systemPrompt: string, userPrompt: string, isJson = false): Promise<string> {
  // Use higher token limit for code generation
  const maxTokens = isJson ? 16000 : 4000
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: isJson ? 0.3 : 0.7, // Lower temperature for JSON to reduce creativity/errors
      max_tokens: maxTokens,
      ...(isJson && { response_format: { type: 'json_object' } })
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI API error:', response.status, errorText)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid OpenAI response:', JSON.stringify(data))
    throw new Error('Invalid response from OpenAI')
  }
  
  return data.choices[0].message.content
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ Attempt ${attempt}/${maxAttempts} failed:`, lastError.message)
      
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`   Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

// Multi-step code generation for better reliability
async function generateCodeMultiStep(
  projectContext: string,
  prd: string,
  techSpec: string
): Promise<Record<string, string>> {
  console.log('🏗️ Starting multi-step code generation...')
  
  // Step 1: Plan the file structure
  const planPrompt = `
Project: ${projectContext.substring(0, 1500)}

${prd ? `PRD Summary:\n${prd.substring(0, 1000)}` : ''}
${techSpec ? `Tech Stack:\n${techSpec.substring(0, 1000)}` : ''}

Create a file structure plan for this React MVP.
`.trim()

  let plan: { files: Array<{ path: string; description: string }> }
  
  try {
    const planResponse = await withRetry(
      () => callAgent(AGENT_PROMPTS.code_planner, planPrompt, true),
      2, // 2 attempts for planning
      500
    )
    
    let cleanedPlan = planResponse.trim()
    if (cleanedPlan.startsWith('```')) {
      cleanedPlan = cleanedPlan.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }
    
    plan = JSON.parse(cleanedPlan)
    console.log(`📋 Planned ${plan.files.length} files`)
  } catch (e) {
    console.warn('⚠️ Planning failed, using default structure')
    // Fallback to standard structure
    plan = {
      files: [
        { path: 'package.json', description: 'NPM package configuration' },
        { path: 'index.html', description: 'HTML entry point with Vite scripts' },
        { path: 'src/main.tsx', description: 'React DOM entry point' },
        { path: 'src/App.tsx', description: 'Main application component with routing and layout' },
        { path: 'src/index.css', description: 'Tailwind CSS imports and global styles' },
        { path: 'src/components/Layout.tsx', description: 'Main layout with navigation' },
        { path: 'src/components/Dashboard.tsx', description: 'Main dashboard view' },
      ]
    }
  }

  // Step 2: Generate each file individually
  const codeFiles: Record<string, string> = {}
  const generatedContext: string[] = [] // Track what's been generated for context
  
  for (const file of plan.files) {
    console.log(`  📝 Generating ${file.path}...`)
    
    const filePrompt = `
PROJECT CONTEXT:
${projectContext.substring(0, 800)}

FILE TO GENERATE: ${file.path}
PURPOSE: ${file.description}

${generatedContext.length > 0 ? `ALREADY GENERATED FILES (for import/reference):
${generatedContext.slice(-3).join('\n\n')}` : ''}

${file.path === 'package.json' ? `
Include these dependencies:
- react, react-dom (^18.2.0)
- react-router-dom (^6.20.0)
- lucide-react (^0.294.0)
- tailwindcss, postcss, autoprefixer (for styling)
- @types/react, @types/react-dom, typescript, vite (dev deps)
Use "type": "module" and proper Vite scripts.
` : ''}

${file.path === 'index.html' ? `
Create a Vite-compatible HTML file with:
- Dark background (#0a0a0a)
- Script src="/src/main.tsx" type="module"
- Proper meta tags and title
` : ''}

${file.path.endsWith('.tsx') ? `
Create a complete, working TypeScript React component.
Use Tailwind CSS classes for styling (dark theme with zinc/slate colors, gradients).
Import icons from lucide-react as needed.
Include realistic mock data.
` : ''}

${file.path === 'src/index.css' ? `
Include Tailwind directives (@tailwind base, components, utilities).
Add custom dark theme utilities if needed.
` : ''}

Generate ONLY the file content. No markdown fences, no explanation.
`.trim()

    try {
      const content = await withRetry(
        () => callAgent(AGENT_PROMPTS.file_generator, filePrompt, false),
        2, // 2 retries per file
        1000
      )
      
      // Clean up any accidental markdown fences
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      }
      
      // For JSON files, validate it's proper JSON
      if (file.path.endsWith('.json')) {
        try {
          JSON.parse(cleanContent)
        } catch {
          console.warn(`⚠️ Invalid JSON in ${file.path}, attempting to fix...`)
          // Try to extract JSON from response
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            cleanContent = jsonMatch[0]
          }
        }
      }
      
      codeFiles[file.path] = cleanContent
      generatedContext.push(`// ${file.path}\n${cleanContent.substring(0, 500)}...`)
      console.log(`  ✅ ${file.path} generated (${cleanContent.length} chars)`)
      
    } catch (e) {
      console.error(`  ❌ Failed to generate ${file.path}:`, e)
      // Continue with other files rather than failing entirely
    }
  }
  
  // Validate we have minimum required files
  const requiredFiles = ['package.json', 'index.html', 'vite.config.ts', 'src/main.tsx', 'src/App.tsx', 'src/index.css']
  const missingFiles = requiredFiles.filter(f => !codeFiles[f])
  
  if (missingFiles.length > 0) {
    console.warn(`⚠️ Missing required files: ${missingFiles.join(', ')}`)
    
    // Generate missing critical files with simple fallbacks
    for (const missing of missingFiles) {
      if (!codeFiles[missing]) {
        console.log(`  🔧 Generating fallback for ${missing}...`)
        codeFiles[missing] = getDefaultFileContent(missing, projectContext)
      }
    }
  }
  
  console.log(`✅ Multi-step generation complete: ${Object.keys(codeFiles).length} files`)
  return codeFiles
}

// Fallback content for critical files
function getDefaultFileContent(filePath: string, context: string): string {
  const title = context.split('\n')[0].substring(0, 50)
  
  const defaults: Record<string, string> = {
    'package.json': JSON.stringify({
      name: 'buildlab-project',
      private: true,
      version: '0.0.1',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.20.0',
        'lucide-react': '^0.294.0'
      },
      devDependencies: {
        '@types/react': '^18.2.43',
        '@types/react-dom': '^18.2.17',
        '@vitejs/plugin-react': '^4.2.1',
        'autoprefixer': '^10.4.16',
        'postcss': '^8.4.32',
        'tailwindcss': '^3.4.0',
        'typescript': '^5.2.2',
        'vite': '^5.0.8'
      }
    }, null, 2),
    
    'index.html': `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>body { background: #0a0a0a; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>`,

    'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,

    'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for GitHub Pages
})`,

    'src/App.tsx': `import React from 'react'
import { Sparkles } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-16 h-16 mx-auto text-purple-500 mb-4" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          ${title}
        </h1>
        <p className="mt-4 text-zinc-400">Generated by BuildLab</p>
      </div>
    </div>
  )
}`,

    'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #0a0a0a;
}`
  }
  
  return defaults[filePath] || ''
}

// AWS Signature V4 Helper Functions
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return toHex(hash)
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, 'aws4_request')
  return kSigning
}

// Upload files to S3
async function uploadToS3(
  projectSlug: string,
  files: Record<string, string>
): Promise<string> {
  const baseUrl = `http://${s3Bucket}.s3-website-${awsRegion}.amazonaws.com/${projectSlug}`
  
  for (const [filePath, content] of Object.entries(files)) {
    const key = `${projectSlug}/${filePath}`
    const endpoint = `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com/${key}`
    
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.substring(0, 8)
    
    // Determine content type
    let contentType = 'text/plain'
    if (filePath.endsWith('.html')) contentType = 'text/html'
    else if (filePath.endsWith('.css')) contentType = 'text/css'
    else if (filePath.endsWith('.js')) contentType = 'application/javascript'
    else if (filePath.endsWith('.json')) contentType = 'application/json'
    
    const encoder = new TextEncoder()
    const body = encoder.encode(content)
    const payloadHash = await sha256(content)
    
    // Create canonical request
    const method = 'PUT'
    const canonicalUri = '/' + key
    const canonicalQueryString = ''
    const canonicalHeaders = 
      `content-type:${contentType}\n` +
      `host:${s3Bucket}.s3.${awsRegion}.amazonaws.com\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
    
    const canonicalRequest = 
      `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    
    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${awsRegion}/s3/aws4_request`
    const stringToSign = 
      `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`
    
    // Calculate signature
    const signingKey = await getSignatureKey(awsSecretAccessKey, dateStamp, awsRegion, 's3')
    const signature = toHex(await hmacSha256(signingKey, stringToSign))
    
    // Create authorization header
    const authorizationHeader = 
      `${algorithm} Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    
    // Upload file
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
      body: body,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to upload ${filePath}:`, errorText)
      throw new Error(`Failed to upload ${filePath} to S3`)
    }
    
    console.log(`✅ Uploaded ${filePath} to S3`)
  }
  
  return baseUrl
}

// Create GitHub repository using user's connected GitHub token
async function createGitHubRepo(
  userGithubToken: string,
  projectSlug: string,
  files: Record<string, string>,
  description: string
): Promise<{ repoUrl: string; pagesUrl: string | null }> {
  const repoName = `buildlab-${projectSlug}`
  
  // Create repo using GitHub API with user's token
  const createRepoResponse = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userGithubToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BuildLab-Generator',
    },
    body: JSON.stringify({
      name: repoName,
      description: `${description} - Generated by BuildLab`,
      private: false,
      auto_init: true,
    }),
  })

  if (!createRepoResponse.ok) {
    const error = await createRepoResponse.text()
    console.error('GitHub repo creation failed:', error)
    throw new Error('Failed to create GitHub repository')
  }

  const repo = await createRepoResponse.json()
  
  // Wait a moment for GitHub to initialize the repo
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Add files to repo
  for (const [path, content] of Object.entries(files)) {
    const addFileResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userGithubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BuildLab-Generator',
      },
      body: JSON.stringify({
        message: `Add ${path}`,
        content: btoa(unescape(encodeURIComponent(content))),
      }),
    })
    
    if (!addFileResponse.ok) {
      console.warn(`Warning: Failed to add ${path} to repo`)
    }
  }

  // Enable GitHub Pages
  let pagesUrl: string | null = null
  try {
    const pagesResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userGithubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'BuildLab-Generator',
      },
      body: JSON.stringify({
        source: {
          branch: 'main',
          path: '/'
        }
      }),
    })
    
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()
      pagesUrl = pagesData.html_url
      console.log('✅ GitHub Pages enabled:', pagesUrl)
    } else {
      const error = await pagesResponse.text()
      console.warn('⚠️ Could not enable GitHub Pages:', error)
    }
  } catch (e) {
    console.warn('⚠️ GitHub Pages setup failed:', e)
  }

  return { repoUrl: repo.html_url, pagesUrl }
}

// Main handler
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Verify auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })
    
    // Verify the user token by passing it directly
    console.log('Attempting to verify token:', token.substring(0, 50) + '...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message, 'User:', user)
      console.error('Full auth error:', JSON.stringify(authError))
      return new Response(
        JSON.stringify({ error: authError?.message || 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }
    
    console.log('User authenticated:', user.id, user.email)
    
    // Now create a service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get request body with options
    const { build_request_id, options } = await req.json() as { 
      build_request_id: string
      options?: GenerationOptions 
    }
    
    // Check if this is a single-section generation request
    const generateOnly = options?.generateOnly || null
    
    // Default options if not provided
    const genOptions: GenerationOptions = {
      marketResearch: generateOnly === 'marketResearch' || (!generateOnly && (options?.marketResearch ?? true)),
      projectCharter: generateOnly === 'projectCharter' || (!generateOnly && (options?.projectCharter ?? true)),
      prd: generateOnly === 'prd' || (!generateOnly && (options?.prd ?? true)),
      techSpec: generateOnly === 'techSpec' || (!generateOnly && (options?.techSpec ?? true)),
      codePrototype: generateOnly === 'codePrototype' || (!generateOnly && (options?.codePrototype ?? false)),
      customInstructions: options?.customInstructions ?? '',
      focusArea: options?.focusArea ?? 'balanced',
      generateOnly,
    }
    
    // Fetch build request details
    const { data: buildRequest, error: fetchError } = await supabaseAdmin
      .from('build_requests')
      .select('*, profiles(*)')
      .eq('id', build_request_id)
      .single()

    if (fetchError || !buildRequest) {
      throw new Error('Build request not found')
    }

    // ==========================================================================
    // PROMPT SAFETY CHECK - Validate all user-provided content before processing
    // ==========================================================================
    const validation = validateProjectRequest({
      title: buildRequest.title,
      description: buildRequest.description,
      short_description: buildRequest.short_description,
      target_audience: buildRequest.target_audience,
      features: buildRequest.features,
      customInstructions: genOptions.customInstructions,
    })

    if (!validation.valid) {
      console.error('⛔ Content validation failed:', validation.error)
      return new Response(
        JSON.stringify({ error: `Content policy violation: ${validation.error}` }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }

    // Use sanitized data
    const safeData = validation.sanitized
    console.log('✅ Content validation passed')

    const focusModifier = FOCUS_MODIFIERS[genOptions.focusArea] || ''
    const customContext = safeData.customInstructions 
      ? `\n\nAdditional Context:\n${safeData.customInstructions}` 
      : ''

    const projectContext = `
Project Title: ${safeData.title}
Category: ${buildRequest.category}
Description: ${safeData.description}
Short Description: ${safeData.short_description}
Target Audience: ${safeData.target_audience || 'General users'}
Key Features Requested: ${safeData.features?.join(', ') || 'Standard web application features'}
Creator: ${buildRequest.profiles?.username}
${focusModifier ? `\nFocus Area: ${focusModifier}` : ''}${customContext}
    `.trim()

    // Update status to processing
    await supabaseAdmin
      .from('build_requests')
      .update({ generation_status: 'processing' })
      .eq('id', build_request_id)

    console.log('🚀 Starting multi-agent project generation...')
    console.log('Options:', genOptions)

    // Initialize results
    let marketResearch = ''
    let projectCharter = ''
    let prd = ''
    let techSpec = ''
    let codeFiles: Record<string, string> = {}

    // Run selected agents
    const parallelTasks: Promise<void>[] = []

    if (genOptions.marketResearch) {
      parallelTasks.push(
        callAgent(AGENT_PROMPTS.research, projectContext).then(result => {
          marketResearch = result
          console.log('✅ Market Research complete')
        })
      )
    }

    if (genOptions.projectCharter) {
      parallelTasks.push(
        callAgent(AGENT_PROMPTS.project_charter, projectContext).then(result => {
          projectCharter = result
          console.log('✅ Project Charter complete')
        })
      )
    }

    // Wait for parallel tasks
    await Promise.all(parallelTasks)

    // PRD needs research context (if available)
    if (genOptions.prd) {
      const prdContext = marketResearch 
        ? `${projectContext}\n\nMarket Research:\n${marketResearch}`
        : projectContext
      prd = await callAgent(AGENT_PROMPTS.product_manager, prdContext)
      console.log('✅ PRD complete')
    }

    // Tech spec needs PRD context (if available)
    if (genOptions.techSpec) {
      const techContext = prd
        ? `${projectContext}\n\nPRD:\n${prd}`
        : projectContext
      techSpec = await callAgent(AGENT_PROMPTS.architect, techContext)
      console.log('✅ Tech Spec complete')
    }

    // Code generation (optional, only if selected) - Use multi-step for reliability
    if (genOptions.codePrototype) {
      console.log('🚀 Starting code prototype generation...')
      
      try {
        // Try multi-step generation first (more reliable for complex apps)
        codeFiles = await generateCodeMultiStep(projectContext, prd, techSpec)
        console.log(`✅ Code generation complete - ${Object.keys(codeFiles).length} files generated`)
      } catch (multiStepError) {
        console.warn('⚠️ Multi-step generation failed, trying single-shot fallback...', multiStepError)
        
        // Fallback to single-shot if multi-step fails
        const codeContext = `
${projectContext}

${prd ? `PRD Summary:\n${prd.substring(0, 2000)}` : ''}

${techSpec ? `Technical Spec:\n${techSpec}` : ''}

Generate a complete, working React application based on these specifications.
Make it visually impressive with a modern dark theme, animations, and professional UI.
Include realistic mock data and full interactivity.
        `.trim()

        let codeFilesJson = ''
        try {
          codeFilesJson = await withRetry(
            () => callAgent(AGENT_PROMPTS.coder, codeContext, true),
            2,
            2000
          )
          
          // Clean up potential markdown code fences if model added them despite instructions
          let cleanedJson = codeFilesJson.trim()
          if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.slice(7)
          } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.slice(3)
          }
          if (cleanedJson.endsWith('```')) {
            cleanedJson = cleanedJson.slice(0, -3)
          }
          cleanedJson = cleanedJson.trim()
          
          codeFiles = JSON.parse(cleanedJson)
          
          // Validate that we got actual file content
          const fileCount = Object.keys(codeFiles).length
          if (fileCount < 3) {
            console.warn(`⚠️ Code generation returned only ${fileCount} files, using defaults`)
            // Add missing critical files
            const required = ['package.json', 'index.html', 'src/main.tsx', 'src/App.tsx', 'src/index.css']
            for (const file of required) {
              if (!codeFiles[file]) {
                codeFiles[file] = getDefaultFileContent(file, projectContext)
              }
            }
          }
          
          console.log(`✅ Fallback code generation complete - ${Object.keys(codeFiles).length} files`)
        } catch (parseError) {
          console.error('❌ Code generation JSON parse error:', parseError)
          console.error('Raw response length:', codeFilesJson?.length || 0)
          // Use default files rather than failing entirely
          codeFiles = {
            'package.json': getDefaultFileContent('package.json', projectContext),
            'index.html': getDefaultFileContent('index.html', projectContext),
            'src/main.tsx': getDefaultFileContent('src/main.tsx', projectContext),
            'src/App.tsx': getDefaultFileContent('src/App.tsx', projectContext),
            'src/index.css': getDefaultFileContent('src/index.css', projectContext),
          }
          console.log('✅ Using default code template')
        }
      }
    }

    // Generate project slug
    const projectSlug = buildRequest.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 30)

    // Create GitHub repo (only if code was generated AND user has connected GitHub)
    let githubUrl = ''
    let previewUrl: string | null = null
    
    if (genOptions.codePrototype && Object.keys(codeFiles).length > 0) {
      // Upload to S3 for live preview
      try {
        previewUrl = await uploadToS3(projectSlug, codeFiles)
        console.log('✅ S3 preview created:', previewUrl)
      } catch (e) {
        console.error('S3 upload failed, continuing...', e)
      }
      
      // Create GitHub repo only if user has connected their GitHub account
      const userGithubToken = buildRequest.profiles?.github_access_token
      let githubPagesUrl = null
      if (userGithubToken) {
        try {
          const result = await createGitHubRepo(
            userGithubToken,
            projectSlug,
            codeFiles,
            safeData.short_description || ''
          )
          githubUrl = result.repoUrl
          githubPagesUrl = result.pagesUrl
          console.log('✅ GitHub repo created:', githubUrl)
          if (githubPagesUrl) {
            console.log('✅ GitHub Pages URL:', githubPagesUrl)
          }
        } catch (e) {
          console.error('GitHub creation failed, continuing...', e)
        }
      } else {
        console.log('ℹ️ Skipping GitHub repo - user has not connected GitHub account')
      }
    }

    // For single-section generation, fetch existing data to merge
    let existingProject = null
    if (generateOnly) {
      const { data } = await supabaseAdmin
        .from('generated_projects')
        .select('*')
        .eq('build_request_id', build_request_id)
        .single()
      existingProject = data
    }

    // Build update object, preserving existing data for single-section generation
    const projectData = {
      build_request_id,
      user_id: buildRequest.user_id,
      project_slug: projectSlug,
      market_research: marketResearch || existingProject?.market_research || '',
      project_charter: projectCharter || existingProject?.project_charter || '',
      prd: prd || existingProject?.prd || '',
      tech_spec: techSpec || existingProject?.tech_spec || '',
      code_files: Object.keys(codeFiles).length > 0 ? codeFiles : (existingProject?.code_files || {}),
      preview_url: previewUrl || existingProject?.preview_url || null,
      github_url: githubUrl || existingProject?.github_url || null,
      github_pages_url: githubPagesUrl || existingProject?.github_pages_url || null,
      status: 'completed',
      generated_at: new Date().toISOString(),
    }

    // Store generated content
    const { error: insertError } = await supabaseAdmin
      .from('generated_projects')
      .upsert(projectData)

    if (insertError) {
      console.error('Failed to save generated project:', insertError)
    }

    // Update build request status
    await supabaseAdmin
      .from('build_requests')
      .update({ 
        generation_status: 'completed',
        preview_url: previewUrl,
        github_url: githubUrl,
      })
      .eq('id', build_request_id)

    console.log('🎉 Project generation complete!')

    return new Response(
      JSON.stringify({
        success: true,
        project: {
          project_slug: projectSlug,
          preview_url: previewUrl,
          github_url: githubUrl,
          documents: {
            market_research: marketResearch.substring(0, 500) + '...',
            project_charter: projectCharter.substring(0, 500) + '...',
            prd: prd.substring(0, 500) + '...',
            tech_spec: techSpec.substring(0, 500) + '...',
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )

  } catch (error: unknown) {
    console.error('Project generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})
