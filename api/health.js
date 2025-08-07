const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
            conversationsCount: count || 0,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
};
