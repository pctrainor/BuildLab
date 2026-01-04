# BuildLab AWS Agent Architecture

This directory contains AWS Lambda functions and infrastructure for the BuildLab AI agent system.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Supabase Edge  │────▶│  AWS API Gateway │────▶│  Step Functions │
│    Function     │     │    (dispatch)    │     │   (orchestrate) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
              ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
              │  Lambda: Docs   │            │ Lambda: CodeGen │            │  Lambda: Deploy │
              │ (research, PRD) │            │  (React/TS app) │            │  (S3 + GitHub)  │
              └─────────────────┘            └─────────────────┘            └─────────────────┘
                        │                                 │                                 │
                        └─────────────────────────────────┼─────────────────────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │    Supabase     │
                                               │   (webhook cb)  │
                                               └─────────────────┘
```

## Components

### 1. `generate-docs/` - Document Generation Lambda
- Market Research
- Project Charter  
- PRD
- Tech Spec
- Fast execution (~30s each)

### 2. `generate-code/` - Code Generation Lambda
- Full React/TypeScript MVP generation
- Uses Claude 3.5 Sonnet or GPT-4o
- Higher memory/timeout (15 min)
- Outputs structured file map

### 3. `deploy-project/` - Deployment Lambda
- Uploads to S3 for preview
- Creates GitHub repository
- Returns URLs

### 4. `state-machine.json` - Step Functions Definition
- Orchestrates the full workflow
- Parallel document generation
- Sequential code → deploy flow
- Error handling and retries

## Deployment

```bash
# Install AWS CDK (if not already)
npm install -g aws-cdk

# Deploy the stack
cd aws
npm install
cdk deploy
```

## Environment Variables

Set in AWS Lambda console or via CDK:
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key (optional, for Claude)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `AWS_S3_BUCKET` - S3 bucket for previews
- `GITHUB_APP_PRIVATE_KEY` - For creating repos (optional)

## Local Development

```bash
# Install dependencies
cd aws/functions/generate-code
npm install

# Test locally with SAM
sam local invoke GenerateCodeFunction -e events/test.json
```
