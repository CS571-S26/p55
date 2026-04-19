import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Form, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from './ImageCarousel';

const MyTrips = () => {
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraryInput, setItineraryInput] = useState('');
  const [itineraryItems, setItineraryItems] = useState([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    setIsAuthenticated(!!authToken);
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        // Fallback to localStorage if not logged in
        const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
        setSavedTrips(trips);
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/user/trips', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        let trips = await response.json();
        // Fetch images for each trip
        trips = await Promise.all(
          trips.map(async (trip) => {
            let images = [];
            try {
              const res = await fetch('http://localhost:5001/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: trip.city, country: trip.country })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.images && data.images.length > 0) {
                  images = data.images;
                }
              }
            } catch (e) {
              console.warn(`Failed to fetch images for ${trip.city}:`, e);
            }
            return { ...trip, images };
          })
        );
        setSavedTrips(trips);
      } else if (response.status === 401) {
        setError('Please log in to view your saved trips.');
      } else {
        setError('Failed to fetch trips');
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Error fetching trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrip = async (city, country) => {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      // Fallback to localStorage if not logged in
      const updatedTrips = savedTrips.filter(trip => !(trip.city === city && trip.country === country));
      setSavedTrips(updatedTrips);
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/user/trips/${encodeURIComponent(city)}/${encodeURIComponent(country)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const updatedTrips = savedTrips.filter(trip => !(trip.city === city && trip.country === country));
        setSavedTrips(updatedTrips);
      } else {
        setError('Failed to remove trip');
      }
    } catch (err) {
      console.error('Error removing trip:', err);
      setError('Error removing trip: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all saved trips?')) {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        // Fallback to localStorage if not logged in
        setSavedTrips([]);
        localStorage.removeItem('savedTrips');
        return;
      }

      try {
        for (const trip of savedTrips) {
          await fetch(`http://localhost:5001/api/user/trips/${encodeURIComponent(trip.city)}/${encodeURIComponent(trip.country)}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });
        }
        setSavedTrips([]);
      } catch (err) {
        console.error('Error clearing trips:', err);
        setError('Error clearing trips: ' + err.message);
      }
    }
  };

  const handleOpenItineraryModal = (trip) => {
    setSelectedTrip(trip);
    if (trip.selectedItinerary && trip.selectedItinerary.length > 0) {
      setItineraryItems(trip.selectedItinerary);
      setSelectedItems(new Set(trip.selectedItinerary.map(item => item.id)));
    } else {
      setItineraryItems([]);
      setSelectedItems(new Set());
    }
    setItineraryInput('');
    setShowItineraryModal(true);
  };

  const handleCloseItineraryModal = () => {
    setShowItineraryModal(false);
    setSelectedTrip(null);
    setItineraryItems([]);
    setSelectedItems(new Set());
  };

  const handleGenerateItinerary = async () => {
    if (!selectedTrip) return;
    
    setLoadingItinerary(true);
    try {
      const prompt = `Create a detailed itinerary for ${selectedTrip.city}, ${selectedTrip.country}. 
      The user's preferences: ${itineraryInput || 'General exploration'}.
      The destination is best for: ${selectedTrip.bestFor || 'General tourism'}.
      Ideal duration: ${selectedTrip.idealDuration || 'Flexible'}.
      Budget level: ${selectedTrip.budget || 'Not specified'}.

      Please provide a day-by-day itinerary with specific activities, attractions to visit, and recommendations. 
      Return ONLY a valid JSON array with objects containing: day (string like "Day 1"), title (string), location (string - specific attraction or landmark name), activities (array of strings).
      Example: [{"day":"Day 1","title":"Arrival & Exploration","location":"Eiffel Tower","activities":["Arrive at airport","Check into hotel","Evening stroll near Eiffel Tower"]}]`;

      const res = await fetch('http://localhost:5001/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: prompt,
          destinationsData: []
        })
      });

      if (!res.ok) throw new Error('Failed to generate itinerary');
      
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      await parseAndEnhanceItinerary(text);
    } catch (e) {
      console.error('Error generating itinerary:', e);
      alert('Failed to generate itinerary. Please try again.');
    }
    setLoadingItinerary(false);
  };

  const parseAndEnhanceItinerary = async (text) => {
    try {
      let items = [];
      try {
        items = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse itinerary JSON');
        }
      }

      const enhancedItems = await Promise.all(
        items.map(async (item, index) => {
          let image = null;
          const searchLocation = item.location || selectedTrip.city;
          
          try {
            const res = await fetch('http://localhost:5001/api/image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ city: searchLocation, country: selectedTrip.country })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.images && data.images.length > 0) {
                image = data.images[0];
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch image for ${searchLocation}:`, e);
          }

          return {
            id: index,
            title: `${item.day}: ${item.title}`,
            description: item.activities ? item.activities.join(' • ') : '',
            image: image,
            selected: true
          };
        })
      );

      setItineraryItems(enhancedItems);
      setSelectedItems(new Set(enhancedItems.map(item => item.id)));
    } catch (e) {
      console.error('Error parsing itinerary:', e);
      alert('Failed to parse itinerary. Please try again.');
    }
  };

  const handleToggleItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  if (loading) {
    return (
      <div className="p-4 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <Container>
        <Row className="mb-4">
          <Col>
            <h2>My Saved Trips</h2>
            <p>Save, view, and manage your favorite destinations.</p>
          </Col>
        </Row>

        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {!isAuthenticated && (
          <Row className="mb-3">
            <Col>
              <Alert variant="warning" dismissible>
                <Alert.Heading>📌 Sign In to Save Your Trips</Alert.Heading>
                <p className="mb-2">
                  You're currently viewing trips stored on this device only. They will be lost if you clear your browser data or switch devices.
                </p>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => navigate('/profile/login')}
                  className="me-2"
                >
                  Log In
                </Button>
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => navigate('/profile/signup')}
                >
                  Sign Up
                </Button>
              </Alert>
            </Col>
          </Row>
        )}

        {savedTrips.length === 0 ? (
          <Row>
            <Col>
              <Alert variant="info">
                You haven't saved any trips yet. Explore destinations and save your favorites!
              </Alert>
            </Col>
          </Row>
        ) : (
          <>
            <Row className="mb-3">
              <Col>
                <p><strong>Total Saved Trips:</strong> {savedTrips.length}</p>
                <Button variant="danger" size="sm" onClick={handleClearAll}>
                  Clear All Trips
                </Button>
              </Col>
            </Row>
            <Row>
              {savedTrips.map((trip, index) => (
                <Col md={6} lg={4} key={index} className="mb-4">
                  <Card className="h-100 shadow">
                    {trip.images && trip.images.length > 0 ? (
                      <ImageCarousel images={trip.images} />
                    ) : trip.image ? (
                      <Card.Img variant="top" src={trip.image} alt={trip.city} style={{ height: '200px', objectFit: 'cover' }} />
                    ) : null}
                    <Card.Body>
                      <Card.Title>{trip.city}, {trip.country}</Card.Title>
                      {trip.region && <p style={{ fontSize: '0.85rem', color: '#666' }}>{trip.region.charAt(0).toUpperCase() + trip.region.slice(1).replace('_', ' ')}</p>}
                      <Card.Text>{trip.description}</Card.Text>
                      <ul className="text-start small mb-3" style={{ lineHeight: '1.6' }}>
                        {(trip.budget || trip.cost) && <li><b>Budget Level:</b> {trip.budget || trip.cost}</li>}
                        {trip.bestFor && <li><b>Best For:</b> {trip.bestFor}</li>}
                        {trip.idealDuration && <li><b>Ideal Duration:</b> {trip.idealDuration}</li>}
                        {trip.attractions && <li><b>Top Attractions:</b> {trip.attractions}</li>}
                      </ul>
                    </Card.Body>
                    <Card.Footer className="bg-white border-top">
                      <Button variant="info" size="sm" onClick={() => handleOpenItineraryModal(trip)} className="me-2">
                        📅 View/Edit Itinerary
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleRemoveTrip(trip.city, trip.country)}>
                        Remove Trip
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>

      {/* Itinerary Modal */}
      <Modal show={showItineraryModal} onHide={handleCloseItineraryModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedTrip ? `Itinerary - ${selectedTrip.city}, ${selectedTrip.country}` : 'Itinerary'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {itineraryItems.length === 0 ? (
            <div>
              <Form.Group className="mb-3">
                <Form.Label><b>Describe what you would like to do:</b></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="E.g., I have 5 days, love beach activities and local cuisine. I'm traveling with family and prefer a mix of relaxation and exploration on a mid-range budget."
                  value={itineraryInput}
                  onChange={(e) => setItineraryInput(e.target.value)}
                />
              </Form.Group>
              <Button 
                variant="primary" 
                onClick={handleGenerateItinerary} 
                disabled={loadingItinerary}
                className="w-100"
              >
                {loadingItinerary ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating Itinerary...
                  </>
                ) : (
                  'Generate AI Itinerary'
                )}
              </Button>
            </div>
          ) : (
            <div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <p className="mb-3"><b>Select the activities you'd like to include:</b></p>
                <Row className="g-3">
                  {itineraryItems.map((item) => (
                    <Col key={item.id} xs={12} md={6} lg={12}>
                      <Card className="h-100" style={{ border: selectedItems.has(item.id) ? '2px solid #0d6efd' : '1px solid #ddd' }}>
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.title}
                            style={{ height: '150px', objectFit: 'cover' }}
                          />
                        )}
                        <Card.Body>
                          <div className="d-flex align-items-start">
                            <Form.Check
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => handleToggleItem(item.id)}
                              className="me-2 mt-1"
                            />
                            <div className="flex-grow-1">
                              <Card.Title style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                                {item.title}
                              </Card.Title>
                              <Card.Text style={{ fontSize: '0.9rem', color: '#666' }}>
                                {item.description.substring(0, 150)}
                                {item.description.length > 150 ? '...' : ''}
                              </Card.Text>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setItineraryItems([]);
                  setSelectedItems(new Set());
                }}
                className="mt-3 w-100"
              >
                Generate Another Itinerary
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MyTrips;
