const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY?.replace(/\n/g, '') || '';
const openai = new OpenAI({
    apiKey: apiKey,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Store conversations in memory (in production, use a database)
const conversations = new Map();

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

        // Get or create conversation history for this session
        if (!conversations.has(sessionId)) {
            conversations.set(sessionId, []);
        }
        const conversation = conversations.get(sessionId);

        // Add user message to conversation history
        conversation.push({ role: 'user', content: message });

        // Prepare messages for OpenAI (include system message and conversation history)
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful AI assistant. Be friendly, concise, and helpful in your responses.'
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
            conversation.splice(0, conversation.length - 20);
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

// API endpoint to get conversation history
app.get('/api/conversation/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const conversation = conversations.get(sessionId) || [];
    res.json({ conversation });
});

// API endpoint to clear conversation history
app.delete('/api/conversation/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    conversations.delete(sessionId);
    res.json({ message: 'Conversation cleared successfully' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        conversationsCount: conversations.size
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API endpoints:`);
    console.log(`   POST /api/chat - Send a message`);
    console.log(`   GET /api/conversation/:sessionId - Get conversation history`);
    console.log(`   DELETE /api/conversation/:sessionId - Clear conversation`);
    console.log(`   GET /api/health - Health check`);
    console.log(`\n⚠️  Make sure to:`);
    console.log(`   1. Copy env.example to .env`);
    console.log(`   2. Add your OpenAI API key to .env`);
    console.log(`   3. Run 'npm install' to install dependencies`);
});
