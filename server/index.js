require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
