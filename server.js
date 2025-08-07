const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY?.replace(/\n/g, '') || '';
const openai = new OpenAI({
    apiKey: apiKey,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// API endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get existing conversation from Supabase
        let { data: existingConversation, error: fetchError } = await supabase
            .from('conversations')
            .select('messages')
            .eq('conversation_id', sessionId)
            .single();

        let conversation = [];
        if (existingConversation) {
            conversation = existingConversation.messages || [];
        }

        // Add user message to conversation history
        conversation.push({ role: 'user', content: message });

        // Prepare messages for OpenAI (include system message and conversation history)
        const messages = [
            {
                role: 'system',
                content: `You are the MindTek AI Assistant - a friendly and helpful virtual assistant representing AI, a company that offers AI consulting and implementation services.
Your goal is to guide users through a structured discovery conversation to understand their industry, challenges, and contact details, and recommend appropriate services.
Always keep responses short, helpful, and polite.
Always reply in the same language the user speaks.
Ask only one question at a time.

RECOMMENDED SERVICES:
- For real estate: Mention customer data extraction from documents, integration with CRM, and lead generation via 24/7 chatbots.
- For education: Mention email automation and AI training.
- For retail/customer service: Mention voice-based customer service chatbots, digital marketing, and AI training.
- For other industries: Mention chatbots, process automation, and digital marketing.

BENEFITS: Emphasize saving time, reducing costs, and improving customer satisfaction.
PRICING: Only mention 'starting from $1000 USD' if the user explicitly asks about pricing.

CONVERSATION FLOW:
1. Ask what industry the user works in.
2. Then ask what specific challenges or goals they have.
3. Based on that, recommend relevant MindTek AI services.
4. Ask if they'd like to learn more about the solutions.
5. If yes, collect their name -> email -> phone number (one at a time).
6. Provide a more technical description of the solution and invite them to book a free consultation.
7. Finally, ask if they have any notes or questions before ending the chat.

OTHER RULES:
- Be friendly but concise.
- Do not ask multiple questions at once.
- Do not mention pricing unless asked.
- Stay on-topic and professional throughout the conversation.`
            },
            ...conversation
        ];

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 150,
            temperature: 0.7,
        });

        const botResponse = completion.choices[0].message.content;

        // Add bot response to conversation history
        conversation.push({ role: 'assistant', content: botResponse });

        // Keep conversation history manageable (limit to last 20 messages)
        if (conversation.length > 20) {
            conversation = conversation.slice(-20);
        }

        // Upsert conversation to Supabase
        const { error: upsertError } = await supabase
            .from('conversations')
            .upsert({
                conversation_id: sessionId,
                messages: conversation,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'conversation_id'
            });

        if (upsertError) {
            console.error('Supabase upsert error:', upsertError);
            return res.status(500).json({ 
                error: 'Failed to save conversation to database.' 
            });
        }

        res.json({
            response: botResponse,
            conversation: conversation
        });

    } catch (error) {
        console.error('Error processing chat:', error);
        
        if (error.code === 'insufficient_quota') {
            res.status(500).json({ 
                error: 'OpenAI API quota exceeded. Please check your API key and billing.' 
            });
        } else if (error.code === 'invalid_api_key') {
            res.status(500).json({ 
                error: 'Invalid OpenAI API key. Please check your .env file.' 
            });
        } else {
            res.status(500).json({ 
                error: 'An error occurred while processing your request.',
                details: error.message 
            });
        }
    }
});

// API endpoint to get all conversations
app.get('/api/conversations', async (req, res) => {
    try {
        // First, try to get all columns including the new customer analysis columns
        let { data: conversations, error } = await supabase
            .from('conversations')
            .select('id, conversation_id, created_at, messages, customerName, customerEmail, customerPhone, customerIndustry, customerProblem, customerAvailability, customerConsultation, specialNotes, leadQuality, analyzed_at')
            .order('created_at', { ascending: false });

        // If that fails, fall back to basic columns
        if (error && error.code === '42703') { // Column doesn't exist
            console.log('New columns not found, using basic columns');
            const { data: basicConversations, error: basicError } = await supabase
                .from('conversations')
                .select('id, conversation_id, created_at, messages')
                .order('created_at', { ascending: false });

            if (basicError) {
                console.error('Supabase fetch error:', basicError);
                return res.status(500).json({ error: 'Failed to fetch conversations.' });
            }

            conversations = basicConversations;
        } else if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch conversations.' });
        }

        res.json({ 
            conversations: conversations || [] 
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'An error occurred while fetching conversations.' });
    }
});

// API endpoint to get conversation history
app.get('/api/conversation/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const { data: conversation, error } = await supabase
            .from('conversations')
            .select('messages')
            .eq('conversation_id', sessionId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch conversation.' });
        }

        res.json({ 
            conversation: conversation?.messages || [] 
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'An error occurred while fetching conversation.' });
    }
});

// API endpoint to analyze lead quality
app.post('/api/conversation/:sessionId/analyze', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Get conversation messages
        const { data: conversation, error: fetchError } = await supabase
            .from('conversations')
            .select('messages')
            .eq('conversation_id', sessionId)
            .single();

        if (fetchError) {
            console.error('Supabase fetch error:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch conversation.' });
        }

        if (!conversation || !conversation.messages || conversation.messages.length === 0) {
            return res.status(400).json({ error: 'No messages found in conversation.' });
        }

        // Prepare conversation text for analysis
        const conversationText = conversation.messages
            .map(msg => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        // System prompt for lead analysis
        const systemPrompt = `Extract the following customer details from the transcript:
- Name
- Email address
- Phone number
- Industry
- Problems, needs, and goals summary
- Availability
- Whether they have booked a consultation (true/false)
- Any special notes
- Lead quality (categorize as 'good', 'ok', or 'spam')

Format the response using this JSON schema:
{
  "type": "object",
  "properties": {
    "customerName": { "type": "string" },
    "customerEmail": { "type": "string" },
    "customerPhone": { "type": "string" },
    "customerIndustry": { "type": "string" },
    "customerProblem": { "type": "string" },
    "customerAvailability": { "type": "string" },
    "customerConsultation": { "type": "boolean" },
    "specialNotes": { "type": "string" },
    "leadQuality": { "type": "string", "enum": ["good", "ok", "spam"] }
  },
  "required": ["customerName", "customerEmail", "customerProblem", "leadQuality"]
}

If the user provided contact details, set lead quality to "good"; otherwise, "spam".`;

        // Call OpenAI API for analysis
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Analyze this conversation:\n\n${conversationText}`
                }
            ],
            max_tokens: 500,
            temperature: 0.3,
        });

        const analysisText = completion.choices[0].message.content;
        
        // Parse the JSON response
        let analysis;
        try {
            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Error parsing analysis JSON:', parseError);
            return res.status(500).json({ 
                error: 'Failed to parse analysis response',
                details: analysisText 
            });
        }

        // Try to save analysis to database using new columns
        try {
            const { error: updateError } = await supabase
                .from('conversations')
                .update({
                    customerName: analysis.customerName || null,
                    customerEmail: analysis.customerEmail || null,
                    customerPhone: analysis.customerPhone || null,
                    customerIndustry: analysis.customerIndustry || null,
                    customerProblem: analysis.customerProblem || null,
                    customerAvailability: analysis.customerAvailability || null,
                    customerConsultation: analysis.customerConsultation || false,
                    specialNotes: analysis.specialNotes || null,
                    leadQuality: analysis.leadQuality || 'unknown',
                    analyzed_at: new Date().toISOString()
                })
                .eq('conversation_id', sessionId);

            if (updateError) {
                if (updateError.code === '42703' || updateError.code === 'PGRST204') {
                    console.log('Analysis columns not found, analysis completed but not saved to database');
                } else {
                    console.error('Supabase update error:', updateError);
                    return res.status(500).json({ error: 'Failed to save analysis to database.' });
                }
            } else {
                console.log('Analysis saved to database successfully');
            }
        } catch (dbError) {
            console.log('Database update failed, but analysis completed:', dbError.message);
        }

        res.json({
            analysis: analysis,
            analyzed_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error analyzing lead:', error);
        
        if (error.code === 'insufficient_quota') {
            res.status(500).json({ 
                error: 'OpenAI API quota exceeded. Please check your API key and billing.' 
            });
        } else if (error.code === 'invalid_api_key') {
            res.status(500).json({ 
                error: 'Invalid OpenAI API key. Please check your .env file.' 
            });
        } else {
            res.status(500).json({ 
                error: 'An error occurred while analyzing the lead.',
                details: error.message 
            });
        }
    }
});

// API endpoint to clear conversation history
app.delete('/api/conversation/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('conversation_id', sessionId);

        if (error) {
            console.error('Supabase delete error:', error);
            return res.status(500).json({ error: 'Failed to clear conversation.' });
        }

        res.json({ message: 'Conversation cleared successfully' });
    } catch (error) {
        console.error('Error clearing conversation:', error);
        res.status(500).json({ error: 'An error occurred while clearing conversation.' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase count error:', error);
            return res.status(500).json({ 
                status: 'ERROR', 
                timestamp: new Date().toISOString(),
                error: 'Database connection failed'
            });
        }

        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            conversationsCount: count || 0
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API endpoints:`);
    console.log(`   POST /api/chat - Send a message`);
    console.log(`   GET /api/conversations - Get all conversations`);
    console.log(`   GET /api/conversation/:sessionId - Get conversation history`);
    console.log(`   POST /api/conversation/:sessionId/analyze - Analyze lead quality`);
    console.log(`   DELETE /api/conversation/:sessionId - Clear conversation`);
    console.log(`   GET /api/health - Health check`);
    console.log(`\n💾 Database: Supabase connected`);
    console.log(`🤖 AI: OpenAI GPT-3.5-turbo`);
    console.log(`\n⚠️  Make sure to:`);
    console.log(`   1. Add your OpenAI API key to .env`);
    console.log(`   2. Add your Supabase URL and key to .env`);
    console.log(`   3. Create the conversations table in Supabase`);
});
