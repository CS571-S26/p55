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
    if (!response.ok) throw new Error('Gemini API error: ' + response.statusText);
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

    // Ensure user data exists before accessing properties
    if (!data.user) {
      return res.status(500).json({ error: 'User creation failed' });
    }

    // Return only essential user fields and tokens to keep JWT small
    // Note: For signup, session may be null if email verification is required
    res.json({ 
      user: {
        id: data.user.id,
        email: data.user.email
      },
      access_token: data.session?.access_token || null,
      refresh_token: data.session?.refresh_token || null
    });
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

    // Ensure user and session data exist before accessing properties
    if (!data.user || !data.session) {
      return res.status(500).json({ error: 'Login failed: incomplete session data' });
    }

    // Return only essential user fields and tokens to keep JWT small
    res.json({ 
      user: {
        id: data.user.id,
        email: data.user.email
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
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

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Use Supabase's built-in password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.REDIRECT_URL || 'http://localhost:5173'}/profile/reset-password`
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Password reset email sent. Check your inbox for instructions.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify the recovery token and update password
    const { data, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token: token,
      email: '' // Empty string as per Supabase docs when using token
    });

    if (sessionError || !data.session) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password using the verified session
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      data.session.user.id,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Password reset successfully' });
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

    // Save preferences to Supabase user_metadata using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        preferences: {
          budget,
          travelStyle,
          pace,
          duration,
          interests: interests || [],
          accessibility: accessibility || []
        }
      }
    });

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

    // Upsert trip into Supabase table
    const { data, error } = await supabase
      .from('user_trips')
      .upsert({
        user_id: user.id,
        city: tripData.city,
        country: tripData.country,
        trip_data: tripData
      }, {
        onConflict: 'user_id,city,country'
      })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
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

    // Fetch saved trips from Supabase table
    const { data: trips, error } = await supabase
      .from('user_trips')
      .select('trip_data')
      .eq('user_id', user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Extract trip_data from each row
    const savedTrips = trips.map(row => row.trip_data);

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

    // Delete trip from Supabase table
    const { error } = await supabase
      .from('user_trips')
      .delete()
      .eq('user_id', user.id)
      .eq('city', city)
      .eq('country', country);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Trip removed successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/user/itineraries', async (req, res) => {
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

    const itineraryData = req.body;

    if (!itineraryData.title) {
      return res.status(400).json({ error: 'Itinerary title is required' });
    }

    // Insert itinerary into Supabase table
    const { data, error } = await supabase
      .from('user_itineraries')
      .insert({
        user_id: user.id,
        title: itineraryData.title,
        itinerary_data: itineraryData,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Return itinerary with database ID
    const savedItinerary = data && data.length > 0 ? {
      ...data[0].itinerary_data,
      _id: data[0].id
    } : itineraryData;

    res.json({ success: true, message: 'Itinerary saved successfully', itinerary: savedItinerary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/itineraries', async (req, res) => {
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

    // Fetch saved itineraries from Supabase table
    const { data: itineraries, error } = await supabase
      .from('user_itineraries')
      .select('id, itinerary_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Map rows to include both the database ID and itinerary data
    const savedItineraries = itineraries.map(row => ({
      ...row.itinerary_data,
      _id: row.id  // Add database ID for reference
    }));

    res.json(savedItineraries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/user/itineraries/:index', async (req, res) => {
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

    const id = req.params.index;

    // Delete itinerary from Supabase table using id
    const { error } = await supabase
      .from('user_itineraries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Itinerary removed successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
