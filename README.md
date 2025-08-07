# MindTek AI Assistant

A professional AI chatbot for lead generation and customer discovery, built with OpenAI and Supabase.

## 🚀 Features

- **AI-Powered Chat**: MindTek AI Assistant with structured conversation flow
- **Lead Analysis**: Automatic extraction of customer information and lead quality assessment
- **Dashboard**: Conversation management with analysis and deletion capabilities
- **Multi-language Support**: Responds in the same language as the user
- **Industry-Specific Recommendations**: Tailored AI solutions for different sectors

## 🏗️ Architecture

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Vercel Serverless Functions
- **AI**: OpenAI GPT-3.5-turbo
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 📁 Project Structure

```
├── api/                          # Vercel serverless functions
│   ├── chat.js                   # Chat endpoint
│   ├── conversations.js          # Get all conversations
│   ├── conversation/[sessionId].js # Get/delete conversation
│   ├── conversation/[sessionId]/analyze.js # Lead analysis
│   └── health.js                 # Health check
├── index.html                    # Main chat interface
├── dashboard.html                # Conversation dashboard
├── styles.css                    # Styling
├── script.js                     # Frontend chat logic
├── dashboard.js                  # Frontend dashboard logic
├── vercel.json                   # Vercel configuration
└── package.json                  # Dependencies
```

## 🚀 Deployment

### 1. Prerequisites

- Vercel account
- Supabase project
- OpenAI API key

### 2. Environment Variables

Set these in your Vercel project settings:

```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect to existing project
vercel --prod
```

### 4. Database Setup

Create the `conversations` table in Supabase:

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

## 🎯 Usage

### Chat Interface
- Visit your deployed URL
- Start a conversation with the MindTek AI Assistant
- Follow the structured discovery process

### Dashboard
- Click "📊 Dashboard" button
- View all conversations with timestamps
- Analyze leads with the 🔍 button
- Delete conversations with the 🗑️ button

## 🔧 API Endpoints

- `POST /api/chat` - Send chat message
- `GET /api/conversations` - Get all conversations
- `GET /api/conversation/[sessionId]` - Get conversation
- `DELETE /api/conversation/[sessionId]` - Delete conversation
- `POST /api/conversation/[sessionId]/analyze` - Analyze lead
- `GET /api/health` - Health check

## 🎨 Features

### MindTek AI Assistant
- Industry-specific service recommendations
- Structured conversation flow
- Contact information collection
- Lead quality assessment

### Lead Analysis
- Customer name, email, phone extraction
- Industry identification
- Problem/needs analysis
- Consultation booking status
- Lead quality categorization (good/ok/spam)

### Dashboard Features
- Conversation list with timestamps
- Real-time analysis updates
- Lead quality badges
- Conversation deletion
- Detailed conversation view

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your keys

# Run locally
npm run dev
```

### Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Lead Quality Assessment

The system automatically categorizes leads:

- **Good**: Customer provided contact details
- **OK**: Some engagement but no contact info
- **Spam**: No meaningful engagement

## 🔒 Security

- CORS enabled for cross-origin requests
- Environment variables for sensitive data
- Input validation on all endpoints
- Error handling for API failures

## 📈 Performance

- Serverless functions for scalability
- Conversation history limited to 20 messages
- Efficient database queries
- Optimized for Vercel's cold start

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the health endpoint: `/api/health`
- Verify environment variables
- Check Supabase connection
- Review Vercel function logs

---

**MindTek AI Assistant** - Professional AI consulting chatbot with lead analysis capabilities.
