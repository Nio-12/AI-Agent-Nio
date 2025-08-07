const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.replace(/\n/g, '') || '',
});

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    try {
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
                error: 'Invalid OpenAI API key. Please check your environment variables.' 
            });
        } else {
            res.status(500).json({ 
                error: 'An error occurred while analyzing the lead.',
                details: error.message 
            });
        }
    }
};
