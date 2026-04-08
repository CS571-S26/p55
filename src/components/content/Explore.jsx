import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Spinner } from 'react-bootstrap';
import CardSwiper from './CardSwiper';
import { getCityImage } from './cityImages';
import destinationsData from '../../assets/Worldwide_Travel_Cities.json';

const Explore = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showSwiper, setShowSwiper] = useState(false);

  // Helper to call backend Gemini proxy
  async function getGeminiRecommendations(userInput) {
    const res = await fetch('http://localhost:5001/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput,
        destinationsData: destinationsData.slice(0, 40)
      })
    });
    if (!res.ok) throw new Error('Gemini API error');
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\[.*\]/s);
      if (match) return JSON.parse(match[0]);
      throw new Error('Could not parse Gemini response');
    }
  }

  const getRecommendations = async (userInput) => {
    setLoading(true);
    try {
      const aiResults = await getGeminiRecommendations(userInput);
      // Map to CardSwiper format
      const mapped = aiResults.map((d) => ({
        city: d.city,
        country: d.country,
        description: d.description || d.short_description,
        image: getCityImage(d.city),
        bestTime: undefined,
        cost: d.budget_level || d.cost,
        attractions: d.attractions,
      }));
      setRecommendations(mapped);
      setShowSwiper(true);
    } catch (e) {
      setRecommendations([]);
      console.error(e);
      alert('Could not get recommendations from Gemini.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await getRecommendations(input);
  };

  const handleSwipeRight = (destination) => {
    // Save to trips (implement as needed)
  };
  const handleSwipeLeft = (destination) => {
    // Discard action (optional)
  };

  return (
    <div className="p-4">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <h2>Explore</h2>
            <p>Describe your dream trip and get AI-powered recommendations!</p>
            <Form onSubmit={handleSubmit} className="mb-4">
              <Form.Group controlId="exploreInput">
                <Form.Control
                  type="text"
                  placeholder="e.g. beach, budget, Europe, adventure, food, family-friendly..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="mt-2" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Find Destinations'}
              </Button>
            </Form>
            {showSwiper && (
              <CardSwiper
                destinations={recommendations}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
              />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Explore;
