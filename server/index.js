require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  const { userInput, destinationsData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const endpoint =
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + apiKey;

  const prompt = `Given the following travel destinations data (as JSON array), and the user's preferences, recommend the top 8 cities.\n\nUser preferences: ${userInput}\n\nDestinations data:\n${JSON.stringify(destinationsData)}\n\nReturn a JSON array of objects with keys: city, country, description, budget_level.`;

  const body = {
    contents: [
      { parts: [{ text: prompt }] }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Gemini API error');
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ user: data.user, session: data.session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ user: data.user, session: data.session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/user/preferences', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { budget, travelStyle, pace, duration, interests, accessibility } = req.body;

    if (!budget || !travelStyle || !pace || !duration) {
      return res.status(400).json({ error: 'Missing required preference fields' });
    }

    // Save preferences to Supabase user_metadata or a separate preferences table
    const { error: updateError } = await supabase.auth.updateUser(
      {
        data: {
          preferences: {
            budget,
            travelStyle,
            pace,
            duration,
            interests: interests || [],
            accessibility: accessibility || []
          }
        }
      },
      { token }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Preferences saved successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/preferences', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Retrieve preferences from user metadata
    const preferences = user.user_metadata?.preferences || {
      budget: 'Moderate',
      travelStyle: 'Balanced',
      pace: 'Moderate',
      duration: '7-10',
      interests: [],
      accessibility: []
    };

    res.json(preferences);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
