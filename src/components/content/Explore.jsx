import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Spinner } from 'react-bootstrap';
import CardSwiper from './CardSwiper';
import destinationsData from '../../assets/Worldwide_Travel_Cities.json';
import API_BASE_URL from '../../config/api';

const Explore = () => {
  const [input, setInput] = useState(() => localStorage.getItem('exploreInput') || '');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(() => {
    const saved = localStorage.getItem('exploreRecommendations');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSwiper, setShowSwiper] = useState(() => {
    const saved = localStorage.getItem('exploreRecommendations');
    return saved ? JSON.parse(saved).length > 0 : false;
  });
  const [destinationBatchIndex, setDestinationBatchIndex] = useState(() => {
    const saved = localStorage.getItem('exploreDestinationBatchIndex');
    return saved ? parseInt(saved) : 0;
  });
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(() => {
    const saved = localStorage.getItem('exploreCurrentRecommendationIndex');
    return saved ? parseInt(saved) : 0;
  });
  const BATCH_SIZE = 40;

  // Save to localStorage whenever these change
  useEffect(() => {
    localStorage.setItem('exploreInput', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('exploreRecommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem('exploreDestinationBatchIndex', destinationBatchIndex.toString());
  }, [destinationBatchIndex]);

  useEffect(() => {
    localStorage.setItem('exploreCurrentRecommendationIndex', currentRecommendationIndex.toString());
  }, [currentRecommendationIndex]);

  // Helper to call backend Gemini proxy
  async function getGeminiRecommendations(userInput, startIndex = 0) {
    const prompt = `Given the following travel destinations data (as JSON array), and the user's preferences, recommend the top 8 cities.\n\nUser preferences: ${userInput}\n\nDestinations data:\n${JSON.stringify(destinationsData.slice(startIndex, startIndex + BATCH_SIZE))}\n\nReturn a JSON array of objects with keys: city, country, description, budget_level.`;
    
    const res = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: prompt
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
      const aiResults = await getGeminiRecommendations(userInput, 0);
      
      // Enrich aiResults with full destination data (including state field)
      const enrichedResults = aiResults.map(aiDest => {
        const fullData = destinationsData.find(
          d => d.city === aiDest.city && d.country === aiDest.country
        );
        return { ...fullData, ...aiDest }; // Merge full data with AI result
      });

      // Map to CardSwiper format and fetch images
      const mapped = await Promise.all(
        enrichedResults.map(async (d) => {
          let images = [];
          try {
            const res = await fetch(`${API_BASE_URL}/api/image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ city: d.city, state: d.state || '', country: d.country })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.images && data.images.length > 0) {
                images = data.images;
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch images for ${d.city}:`, e);
          }
          
          // Extract best activities based on highest ratings
          const ratings = {
            culture: d.culture || 0,
            adventure: d.adventure || 0,
            nature: d.nature || 0,
            beaches: d.beaches || 0,
            nightlife: d.nightlife || 0,
            cuisine: d.cuisine || 0,
            wellness: d.wellness || 0,
            urban: d.urban || 0,
          };
          const bestFor = Object.entries(ratings)
            .filter(([_, rating]) => rating >= 4)
            .map(([activity]) => activity.charAt(0).toUpperCase() + activity.slice(1))
            .join(', ') || 'Exploration';
          
          // Parse ideal durations if it's a string
          let durations = d.ideal_durations;
          if (typeof durations === 'string') {
            try {
              durations = JSON.parse(durations);
            } catch {
              durations = [];
            }
          }
          
          return {
            city: d.city,
            country: d.country,
            state: d.state || '',
            region: d.region,
            description: d.description || d.short_description,
            images: images,
            budget: d.budget_level || d.cost,
            bestFor: bestFor,
            idealDuration: durations && durations.length > 0 ? durations[0] : 'Flexible',
            attractions: d.attractions,
          };
        })
      );
      setRecommendations(mapped);
      setDestinationBatchIndex(1);
      setCurrentRecommendationIndex(0);
      setShowSwiper(true);
    } catch (e) {
      setRecommendations([]);
      console.error(e);
      alert('Could not get recommendations from Gemini.');
    }
    setLoading(false);
  };

  const handleLoadMore = async () => {
    const nextBatchIndex = destinationBatchIndex + 1;
    const startIndex = destinationBatchIndex * BATCH_SIZE;
    
    if (startIndex >= destinationsData.length) {
      return; // No more data to fetch
    }

    setLoading(true);
    try {
      const aiResults = await getGeminiRecommendations(input, startIndex);      
      // Enrich aiResults with full destination data (including state field)
      const enrichedResults = aiResults.map(aiDest => {
        const fullData = destinationsData.find(
          d => d.city === aiDest.city && d.country === aiDest.country
        );
        return { ...fullData, ...aiDest }; // Merge full data with AI result
      });
      // Map to CardSwiper format and fetch images
      const mapped = await Promise.all(
        enrichedResults.map(async (d) => {
          let images = [];
          try {
            const res = await fetch(`${API_BASE_URL}/api/image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ city: d.city, state: d.state || '', country: d.country })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.images && data.images.length > 0) {
                images = data.images;
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch images for ${d.city}:`, e);
          }
          
          // Extract best activities based on highest ratings
          const ratings = {
            culture: d.culture || 0,
            adventure: d.adventure || 0,
            nature: d.nature || 0,
            beaches: d.beaches || 0,
            nightlife: d.nightlife || 0,
            cuisine: d.cuisine || 0,
            wellness: d.wellness || 0,
            urban: d.urban || 0,
          };
          const bestFor = Object.entries(ratings)
            .filter(([_, rating]) => rating >= 4)
            .map(([activity]) => activity.charAt(0).toUpperCase() + activity.slice(1))
            .join(', ') || 'Exploration';
          
          // Parse ideal durations if it's a string
          let durations = d.ideal_durations;
          if (typeof durations === 'string') {
            try {
              durations = JSON.parse(durations);
            } catch {
              durations = [];
            }
          }
          
          return {
            city: d.city,
            country: d.country,
            state: d.state || '',
            region: d.region,
            description: d.description || d.short_description,
            images: images,
            budget: d.budget_level || d.cost,
            bestFor: bestFor,
            idealDuration: durations && durations.length > 0 ? durations[0] : 'Flexible',
            attractions: d.attractions,
          };
        })
      );
      
      // Append new recommendations to existing ones
      setRecommendations(prev => [...prev, ...mapped]);
      setDestinationBatchIndex(nextBatchIndex);
    } catch (e) {
      console.error('Error loading more recommendations:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await getRecommendations(input);
  };

  const handleSwipeRight = async (destination) => {
    const authToken = localStorage.getItem('authToken');
    
    if (authToken) {
      // Save to backend if logged in
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/trips`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(destination)
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Failed to save trip:', data.error);
        }
      } catch (err) {
        console.error('Error saving trip:', err);
      }
    } else {
      // Fallback to localStorage if not logged in
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const tripExists = savedTrips.some(trip => trip.city === destination.city && trip.country === destination.country);
      if (!tripExists) {
        savedTrips.push(destination);
        localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      }
    }
  };
  const handleSwipeLeft = (destination) => {
    // Discard action - no storage needed
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
                  as="textarea"
                  rows={4}
                  placeholder="E.g., I'm looking for a beach destination in Europe, with good food scene and family-friendly activities on a budget."
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
                initialIndex={currentRecommendationIndex}
                onIndexChange={setCurrentRecommendationIndex}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                onReachedEnd={handleLoadMore}
              />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Explore;
