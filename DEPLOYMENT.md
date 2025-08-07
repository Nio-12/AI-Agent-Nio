# Vercel Deployment Guide

## Quick Deploy

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add these environment variables:
     - `OPENAI_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`

## Project Structure

```
├── api/                    # Serverless functions
│   ├── chat.js            # POST /api/chat
│   ├── conversations.js   # GET /api/conversations
│   ├── conversation/[sessionId].js
│   ├── conversation/[sessionId]/analyze.js
│   └── health.js          # GET /api/health
├── index.html             # Main chat interface
├── dashboard.html         # Conversation dashboard
├── styles.css             # Styling
├── script.js              # Frontend chat logic
├── dashboard.js           # Frontend dashboard logic
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies
```

## Database Setup

Run this SQL in your Supabase project:

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    conversation_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    messages JSONB,
    customerName VARCHAR(255),
    customerEmail VARCHAR(255),
    customerPhone VARCHAR(50),
    customerIndustry VARCHAR(255),
    customerProblem TEXT,
    customerAvailability VARCHAR(255),
    customerConsultation BOOLEAN DEFAULT FALSE,
    specialNotes TEXT,
    leadQuality VARCHAR(20) CHECK (leadQuality IN ('good', 'ok', 'spam')),
    analyzed_at TIMESTAMP WITH TIME ZONE
);
```

## Features

- ✅ AI Chat with MindTek Assistant
- ✅ Lead Analysis & Quality Assessment
- ✅ Conversation Dashboard
- ✅ Real-time Analysis Updates
- ✅ Multi-language Support

## Troubleshooting

- **Build Error**: Make sure all files are in the root directory
- **API Errors**: Check environment variables in Vercel dashboard
- **Database Errors**: Verify Supabase connection and table structure
