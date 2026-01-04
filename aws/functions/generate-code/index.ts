/**
 * BuildLab Code Generation Agent
 * 
 * This Lambda function generates a complete React/TypeScript MVP
 * using advanced AI models with higher timeouts and resources.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import OpenAI from 'openai'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

// Environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const S3_BUCKET = process.env.S3_BUCKET || 'buildlab-previews'
const AWS_REGION = process.env.AWS_REGION || 'us-east-1'

// Clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const s3 = new S3Client({ region: AWS_REGION })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Types
interface GenerationJob {
  build_request_id: string
  project_slug: string
  title: string
  description: string
  short_description: string
  category: string
  target_audience: string
  features: string[]
  prd?: string
  tech_spec?: string
  user_id: string
  github_token?: string
}

interface GeneratedFiles {
  [filePath: string]: string
}

// Code generation system prompt - optimized for quality
const CODE_GENERATION_PROMPT = `You are an expert full-stack developer creating a production-ready React TypeScript application.

## REQUIREMENTS
- React 18 with TypeScript (strict mode)
- Tailwind CSS with a modern dark theme
- Lucide React for icons
- Framer Motion for animations
- React Router for navigation
- Zustand for state management (if needed)
- Fully responsive design
- Realistic mock data with 10+ items
- Loading states, error handling, empty states
- Accessible (ARIA labels, keyboard nav)
- Performance optimized (React.memo, useMemo where appropriate)

## OUTPUT FORMAT
Return ONLY a valid JSON object. No markdown, no explanation, no text before or after.
Keys are file paths, values are complete file contents.

Required files:
- package.json (with all dependencies, scripts for dev/build)
- vite.config.ts
- tsconfig.json
- index.html
- src/main.tsx
- src/App.tsx
- src/index.css (with Tailwind directives and custom styles)
- src/components/*.tsx (modular components)
- src/pages/*.tsx (if multi-page)
- src/hooks/*.ts (custom hooks if needed)
- src/types/*.ts (TypeScript types)
- src/data/*.ts (mock data)

## QUALITY STANDARDS
- Clean, readable code with comments for complex logic
- Consistent naming conventions (PascalCase components, camelCase functions)
- Proper TypeScript types (no 'any')
- Error boundaries for fault tolerance
- Mobile-first responsive design
- Smooth animations and transitions
- Professional UI with attention to detail

Generate a complete, deployable application based on the project requirements.`

/**
 * Generate code files using OpenAI with structured output
 */
async function generateCode(job: GenerationJob): Promise<GeneratedFiles> {
  console.log(`🚀 Starting code generation for: ${job.title}`)
  
  const projectContext = `
# Project: ${job.title}

## Description
${job.description || job.short_description}

## Category
${job.category}

## Target Audience
${job.target_audience || 'General users'}

## Key Features
${job.features?.map(f => `- ${f}`).join('\n') || '- Core functionality'}

${job.prd ? `## Product Requirements (Summary)\n${job.prd.substring(0, 3000)}` : ''}

${job.tech_spec ? `## Technical Specification (Summary)\n${job.tech_spec.substring(0, 2000)}` : ''}

Create a complete, production-ready React application implementing these requirements.
`.trim()

  const startTime = Date.now()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: CODE_GENERATION_PROMPT },
      { role: 'user', content: projectContext }
    ],
    temperature: 0.2,
    max_tokens: 16000,
    response_format: { type: 'json_object' }
  })

  const duration = Date.now() - startTime
  console.log(`✅ Code generation complete in ${duration}ms`)
  
  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from OpenAI')
  }
  
  // Parse and validate
  let files: GeneratedFiles
  try {
    files = JSON.parse(content)
  } catch (e) {
    console.error('Failed to parse code generation response:', content.substring(0, 500))
    throw new Error('Invalid JSON response from code generation')
  }
  
  // Validate minimum files
  const requiredFiles = ['package.json', 'index.html', 'src/main.tsx', 'src/App.tsx']
  for (const required of requiredFiles) {
    if (!files[required]) {
      console.warn(`⚠️ Missing required file: ${required}`)
    }
  }
  
  console.log(`📁 Generated ${Object.keys(files).length} files`)
  return files
}

/**
 * Upload generated files to S3 for live preview
 */
async function uploadToS3(projectSlug: string, files: GeneratedFiles): Promise<string> {
  console.log(`📤 Uploading ${Object.keys(files).length} files to S3...`)
  
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
  }
  
  for (const [filePath, content] of Object.entries(files)) {
    const key = `${projectSlug}/${filePath}`
    const ext = filePath.substring(filePath.lastIndexOf('.'))
    const contentType = contentTypes[ext] || 'text/plain'
    
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: content,
      ContentType: contentType,
      CacheControl: 'public, max-age=3600',
    }))
    
    console.log(`  ✓ ${filePath}`)
  }
  
  const previewUrl = `http://${S3_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com/${projectSlug}`
  console.log(`🌐 Preview URL: ${previewUrl}`)
  
  return previewUrl
}

/**
 * Create GitHub repository with generated code
 */
async function createGitHubRepo(
  githubToken: string,
  projectSlug: string,
  files: GeneratedFiles,
  description: string
): Promise<string> {
  console.log(`🐙 Creating GitHub repository...`)
  
  const repoName = `buildlab-${projectSlug}`
  
  // Create repo
  const createResponse = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BuildLab-Agent',
    },
    body: JSON.stringify({
      name: repoName,
      description: `${description} - Generated by BuildLab`,
      private: false,
      auto_init: true,
    }),
  })
  
  if (!createResponse.ok) {
    const error = await createResponse.text()
    console.error('GitHub repo creation failed:', error)
    throw new Error('Failed to create GitHub repository')
  }
  
  const repo = await createResponse.json()
  console.log(`  ✓ Created repo: ${repo.html_url}`)
  
  // Wait for repo initialization
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Upload files
  let uploadedCount = 0
  for (const [path, content] of Object.entries(files)) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'BuildLab-Agent',
          },
          body: JSON.stringify({
            message: `Add ${path}`,
            content: Buffer.from(content).toString('base64'),
          }),
        }
      )
      
      if (response.ok) {
        uploadedCount++
      } else {
        console.warn(`  ⚠️ Failed to upload ${path}`)
      }
    } catch (e) {
      console.warn(`  ⚠️ Error uploading ${path}:`, e)
    }
  }
  
  console.log(`  ✓ Uploaded ${uploadedCount}/${Object.keys(files).length} files`)
  return repo.html_url
}

/**
 * Update job status in Supabase
 */
async function updateJobStatus(
  buildRequestId: string,
  status: 'processing' | 'completed' | 'failed',
  data?: {
    preview_url?: string
    github_url?: string
    code_files?: GeneratedFiles
    error?: string
  }
) {
  // Update build_requests
  await supabase
    .from('build_requests')
    .update({
      generation_status: status,
      ...(data?.preview_url && { preview_url: data.preview_url }),
      ...(data?.github_url && { github_url: data.github_url }),
    })
    .eq('id', buildRequestId)
  
  // Update generated_projects if code was generated
  if (status === 'completed' && data?.code_files) {
    await supabase
      .from('generated_projects')
      .update({
        code_files: data.code_files,
        preview_url: data.preview_url,
        github_url: data.github_url,
        status: 'completed',
      })
      .eq('build_request_id', buildRequestId)
  }
  
  console.log(`📊 Updated job status: ${status}`)
}

/**
 * Lambda Handler
 */
export async function handler(
  event: APIGatewayProxyEvent | { body: GenerationJob },
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log('🎯 Code Generation Lambda invoked')
  console.log('Remaining time:', context.getRemainingTimeInMillis(), 'ms')
  
  try {
    // Parse job from event (could be API Gateway or direct invocation)
    let job: GenerationJob
    if ('body' in event && typeof event.body === 'string') {
      job = JSON.parse(event.body)
    } else if ('body' in event && typeof event.body === 'object') {
      job = event.body as GenerationJob
    } else {
      throw new Error('Invalid event format')
    }
    
    console.log(`📋 Job: ${job.title} (${job.build_request_id})`)
    
    // Update status to processing
    await updateJobStatus(job.build_request_id, 'processing')
    
    // Generate code
    const files = await generateCode(job)
    
    // Upload to S3
    const previewUrl = await uploadToS3(job.project_slug, files)
    
    // Create GitHub repo if user has connected GitHub
    let githubUrl: string | undefined
    if (job.github_token) {
      try {
        githubUrl = await createGitHubRepo(
          job.github_token,
          job.project_slug,
          files,
          job.short_description || job.title
        )
      } catch (e) {
        console.error('GitHub creation failed:', e)
        // Don't fail the whole job if GitHub fails
      }
    }
    
    // Update status to completed
    await updateJobStatus(job.build_request_id, 'completed', {
      preview_url: previewUrl,
      github_url: githubUrl,
      code_files: files,
    })
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        preview_url: previewUrl,
        github_url: githubUrl,
        file_count: Object.keys(files).length,
      }),
    }
    
  } catch (error) {
    console.error('❌ Code generation failed:', error)
    
    // Try to update status to failed
    try {
      const job = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
      if (job?.build_request_id) {
        await updateJobStatus(job.build_request_id, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (e) {
      console.error('Failed to update error status:', e)
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}
