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

app.post('/api/image', async (req, res) => {
  const { city, country, state } = req.body;
  if (!city || !country) {
    return res.status(400).json({ error: 'City and country are required' });
  }

  const pixabayApiKey = process.env.PIXABAY_API_KEY;
  if (!pixabayApiKey) {
    return res.status(500).json({ error: 'Pixabay API key not configured' });
  }

  // Build search query: use state+city if available, otherwise just city+country
  const searchQuery = state && state.trim() ? `${city}, ${state}` : `${city}, ${country}`;
  const endpoint = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(searchQuery)}&image_type=photo&orientation=horizontal&per_page=5&order=popular&category=travel`;

  try {
    const response = await fetch(endpoint, { 
      method: 'GET',
      headers: {
        'User-Agent': 'TripGenie/1.0'
      }
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error(`Pixabay API returned invalid JSON for city "${city}", country "${country}":`, text.substring(0, 200));
      throw new Error(`Invalid JSON response from Pixabay: ${text.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      console.error(`Pixabay API error for city "${city}", country "${country}":`, data);
      throw new Error(data.error || `${response.status} ${response.statusText}`);
    }
    
    if (data.hits && data.hits.length > 0) {
      const images = data.hits.map(hit => hit.webformatURL);
      return res.json({ images: images });
    }
    res.json({ images: [] });
  } catch (e) {
    console.error(`Failed to fetch image for "${city}, ${country}":`, e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/gemini', async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) return res.status(400).json({ error: 'userInput is required' });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const endpoint =
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + apiKey;

  const body = {
    contents: [
      { parts: [{ text: userInput }] }
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

app.post('/api/user/trips', async (req, res) => {
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

    const tripData = req.body;

    if (!tripData.city || !tripData.country) {
      return res.status(400).json({ error: 'City and country are required' });
    }

    // Get existing trips from user metadata
    const existingTrips = user.user_metadata?.savedTrips || [];
    
    // Check if trip already exists
    const tripExists = existingTrips.some(trip => trip.city === tripData.city && trip.country === tripData.country);
    
    if (tripExists) {
      return res.status(400).json({ error: 'Trip already saved' });
    }

    // Add new trip
    const updatedTrips = [...existingTrips, tripData];

    // Save to Supabase user_metadata
    const { error: updateError } = await supabase.auth.updateUser(
      {
        data: {
          savedTrips: updatedTrips
        }
      },
      { token }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Trip saved successfully', trip: tripData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/trips', async (req, res) => {
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

    // Retrieve saved trips from user metadata
    const savedTrips = user.user_metadata?.savedTrips || [];

    res.json(savedTrips);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/user/trips/:city/:country', async (req, res) => {
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

    const { city, country } = req.params;

    // Get existing trips from user metadata
    const existingTrips = user.user_metadata?.savedTrips || [];
    
    // Filter out the trip to delete
    const updatedTrips = existingTrips.filter(trip => !(trip.city === city && trip.country === country));

    // Save to Supabase user_metadata
    const { error: updateError } = await supabase.auth.updateUser(
      {
        data: {
          savedTrips: updatedTrips
        }
      },
      { token }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Trip removed successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
