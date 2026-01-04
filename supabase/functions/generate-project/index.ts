// BuildLab Project Generator - Multi-Agent AI System
// This Edge Function orchestrates AI agents to generate complete project packages

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiKey = Deno.env.get('OPENAI_API_KEY')!
const githubToken = Deno.env.get('GITHUB_TOKEN')!

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

Return a JSON object with file paths as keys and file contents as values.
Include: package.json, index.html, src/main.tsx, src/App.tsx, src/index.css, and all component files.`
}

// Call OpenAI API
async function callAgent(systemPrompt: string, userPrompt: string, isJson = false): Promise<string> {
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
      temperature: 0.7,
      max_tokens: 4000,
      ...(isJson && { response_format: { type: 'json_object' } })
    }),
  })

  const data = await response.json()
  return data.choices[0].message.content
}

// Create GitHub repository
async function createGitHubRepo(
  username: string,
  projectSlug: string,
  files: Record<string, string>,
  description: string
): Promise<string> {
  const repoName = `buildlab-${projectSlug}`
  
  // Create repo using GitHub API
  const createRepoResponse = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
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
  
  // Add files to repo
  for (const [path, content] of Object.entries(files)) {
    await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Add ${path}`,
        content: btoa(unescape(encodeURIComponent(content))),
      }),
    })
  }

  return repo.html_url
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
        }
      )
    }
    
    // Get request body with options
    const { build_request_id, options } = await req.json() as { 
      build_request_id: string
      options?: GenerationOptions 
    }
    
    // Default options if not provided
    const genOptions: GenerationOptions = {
      marketResearch: options?.marketResearch ?? true,
      projectCharter: options?.projectCharter ?? true,
      prd: options?.prd ?? true,
      techSpec: options?.techSpec ?? true,
      codePrototype: options?.codePrototype ?? false,
      customInstructions: options?.customInstructions ?? '',
      focusArea: options?.focusArea ?? 'balanced',
    }
    
    // Fetch build request details
    const { data: buildRequest, error: fetchError } = await supabase
      .from('build_requests')
      .select('*, profiles(*)')
      .eq('id', build_request_id)
      .single()

    if (fetchError || !buildRequest) {
      throw new Error('Build request not found')
    }

    const focusModifier = FOCUS_MODIFIERS[genOptions.focusArea] || ''
    const customContext = genOptions.customInstructions 
      ? `\n\nCustom Instructions from User:\n${genOptions.customInstructions}` 
      : ''

    const projectContext = `
Project Title: ${buildRequest.title}
Category: ${buildRequest.category}
Description: ${buildRequest.description}
Short Description: ${buildRequest.short_description}
Target Audience: ${buildRequest.target_audience || 'General users'}
Key Features Requested: ${buildRequest.features?.join(', ') || 'Standard web application features'}
Creator: ${buildRequest.profiles?.username}
${focusModifier ? `\nFocus Area: ${focusModifier}` : ''}${customContext}
    `.trim()

    // Update status to processing
    await supabase
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

    // Code generation (optional, only if selected)
    if (genOptions.codePrototype) {
      const codeContext = `
${projectContext}

${prd ? `PRD Summary:\n${prd.substring(0, 2000)}` : ''}

${techSpec ? `Technical Spec:\n${techSpec}` : ''}

Generate a complete, working React application based on these specifications.
Make it visually impressive with a modern dark theme, animations, and professional UI.
Include realistic mock data and full interactivity.
      `.trim()

      const codeFilesJson = await callAgent(AGENT_PROMPTS.coder, codeContext, true)
      codeFiles = JSON.parse(codeFilesJson)
      console.log('✅ Code generation complete')
    }

    // Generate project slug
    const projectSlug = buildRequest.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 30)

    // Create GitHub repo (only if code was generated)
    let githubUrl = ''
    if (genOptions.codePrototype && Object.keys(codeFiles).length > 0) {
      try {
        githubUrl = await createGitHubRepo(
          buildRequest.profiles?.username || 'user',
          projectSlug,
          codeFiles,
          buildRequest.short_description
        )
        console.log('✅ GitHub repo created:', githubUrl)
      } catch (e) {
        console.error('GitHub creation failed, continuing...', e)
      }
    }

    // Generate preview URL only if code was generated
    const previewUrl = genOptions.codePrototype ? `https://preview.buildlab.app/${projectSlug}` : null

    // Store generated content
    const { error: insertError } = await supabase
      .from('generated_projects')
      .upsert({
        build_request_id,
        user_id: buildRequest.user_id,
        project_slug: projectSlug,
        market_research: marketResearch,
        project_charter: projectCharter,
        prd,
        tech_spec: techSpec,
        code_files: codeFiles,
        preview_url: previewUrl,
        github_url: githubUrl,
        status: 'completed',
        generated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to save generated project:', insertError)
    }

    // Update build request status
    await supabase
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
          'Access-Control-Allow-Origin': '*',
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
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
