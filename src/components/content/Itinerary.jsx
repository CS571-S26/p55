import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import API_BASE_URL from '../../config/api';
import '../../css/Itinerary.css';

const Itinerary = () => {
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState('city');
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState('moderate');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tripName, setTripName] = useState('');
  const [saveMode, setSaveMode] = useState('itinerary'); // 'trip' or 'itinerary'
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerateItinerary = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setError('');
    setLoading(true);
    setItinerary(null);
    setIsSaved(false);

    try {
      const prompt = `Create a detailed ${duration}-day itinerary for a trip to ${location} (${locationType}).
      
Budget level: ${budget}
Traveler interests: ${interests || 'general tourism'}

Please provide a structured JSON response with the following format:
{
  "title": "Trip Title",
  "location": "${location}",
  "duration": ${duration},
  "overview": "Brief overview of the trip",
  "budget_estimate": "Budget estimate",
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "activities": [
        {
          "time": "morning/afternoon/evening",
          "activity": "Activity name",
          "description": "Description",
          "duration": "Duration in hours"
        }
      ],
      "meals": ["breakfast", "lunch", "dinner recommendations"],
      "tips": "Tips for this day"
    }
  ],
  "packing_tips": ["item1", "item2"],
  "transport": "Transportation information"
}

Make the itinerary realistic, practical, and personalized to the interests provided. Include specific landmarks, restaurants, or activities when possible.`;

      const response = await fetch(`${API_BASE_URL}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to generate itinerary');
      }

      const data = await response.json();
      
      // Extract JSON from Gemini response
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedItinerary = JSON.parse(jsonMatch[0]);
        setItinerary(parsedItinerary);
        setTripName(`${location} - ${duration} Days`);
      } else {
        throw new Error('Could not parse itinerary response');
      }
    } catch (err) {
      console.error('Error generating itinerary:', err);
      setError('Failed to generate itinerary: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    const authToken = localStorage.getItem('authToken');
    
    if (saveMode === 'itinerary') {
      // Save as itinerary
      if (!authToken) {
        // Save locally if not authenticated
        const itineraryToSave = {
          ...itinerary,
          city: itinerary.location,
          country: locationType === 'continent' ? 'Multiple Countries' : itinerary.location,
          title: tripName,
          savedAt: new Date().toISOString()
        };
        const savedItineraries = JSON.parse(localStorage.getItem('savedItineraries') || '[]');
        savedItineraries.push(itineraryToSave);
        localStorage.setItem('savedItineraries', JSON.stringify(savedItineraries));
        setShowSaveModal(false);
        setError('');
        setIsSaved(true);
        alert('Activity itinerary saved locally!');
        return;
      }

      try {
        const itineraryToSave = {
          ...itinerary,
          city: itinerary.location,
          country: locationType === 'continent' ? 'Multiple Countries' : itinerary.location,
          title: tripName,
          savedAt: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/api/user/itineraries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(itineraryToSave)
        });

        if (response.ok) {
          setShowSaveModal(false);
          setError('');
          setIsSaved(true);
          alert('Activity itinerary saved successfully!');
        } else {
          throw new Error('Failed to save itinerary');
        }
      } catch (err) {
        setError('Failed to save itinerary: ' + err.message);
      }
      return;
    }

    // Original trip save logic (not used in new version)
    if (!authToken) {
      // Save locally if not authenticated
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const newTrip = {
        city: itinerary.location,
        country: locationType === 'continent' ? 'Multiple Countries' : itinerary.location,
        itinerary: itinerary,
        tripName: tripName,
        savedAt: new Date().toISOString()
      };
      savedTrips.push(newTrip);
      localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      setShowSaveModal(false);
      setError('');
      setIsSaved(true);
      alert('Trip saved locally!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          city: itinerary.location,
          country: locationType === 'continent' ? 'Multiple Countries' : itinerary.location,
          itinerary: itinerary,
          tripName: tripName
        })
      });

      if (response.ok) {
        setShowSaveModal(false);
        setError('');
        setIsSaved(true);
        alert('Trip saved successfully!');
      } else {
        throw new Error('Failed to save trip');
      }
    } catch (err) {
      setError('Failed to save trip: ' + err.message);
    }
  };

  return (
    <Container className="itinerary-container py-5">
      <Row className="mb-5">
        <Col md={8} className="mx-auto">
          <h1 className="mb-4 text-center">Trip Itinerary Generator</h1>
          
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Card className="shadow-sm p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Where do you want to go? <span aria-label="required">*</span></Form.Label>
                <div className="input-group">
                  <Form.Control
                    placeholder="e.g., Tokyo, France, Southeast Asia"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateItinerary()}
                    aria-required="true"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Location Type</Form.Label>
                <Form.Select value={locationType} onChange={(e) => setLocationType(e.target.value)}>
                  <option value="city">City</option>
                  <option value="country">Country</option>
                  <option value="continent">Continent</option>
                </Form.Select>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Trip Duration</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="number"
                        min="1"
                        max="30"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                      />
                      <span className="input-group-text">days</span>
                    </div>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Budget Level</Form.Label>
                    <Form.Select value={budget} onChange={(e) => setBudget(e.target.value)}>
                      <option value="budget">Budget-Friendly</option>
                      <option value="moderate">Moderate</option>
                      <option value="luxury">Luxury</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Interests (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="e.g., hiking, museums, local cuisine, nightlife, relaxation..."
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
                <Form.Text className="text-muted">Comma-separated interests to personalize your itinerary</Form.Text>
              </Form.Group>

              <Button
                onClick={handleGenerateItinerary}
                disabled={loading || !location.trim()}
                size="lg"
                className="w-100 btn-generate"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating Itinerary...
                  </>
                ) : (
                  '🎒 Generate Itinerary'
                )}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      {itinerary && (
        <Row className="mb-5">
          <Col md={10} className="mx-auto">
            <Card className="shadow-sm p-5">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h2 className="mb-2">{itinerary.title}</h2>
                  <p className="text-muted mb-3">{itinerary.overview}</p>
                  <div className="mb-3">
                    <Badge bg="info" className="me-2 px-3 py-2">{itinerary.duration} Days</Badge>
                    <Badge bg="success" className="me-2 px-3 py-2">{itinerary.budget_estimate}</Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Button
                    variant={isSaved ? "success" : "outline-info"}
                    onClick={() => {
                      setSaveMode('itinerary');
                      setTripName(`${itinerary.location} - ${duration} Days`);
                      setShowSaveModal(true);
                    }}
                    disabled={isSaved}
                    className="btn-save"
                  >
                    {isSaved ? '✓ Saved' : '📅 Save Itinerary'}
                  </Button>
                </div>
              </div>

              <div className="transport-section mb-5 p-3 bg-light rounded">
                <h5 className="mb-3">🚗 Transportation</h5>
                <p>{itinerary.transport}</p>
              </div>

              <div className="days-section mb-5">
                <h4 className="mb-4">📅 Daily Itinerary</h4>
                {itinerary.days?.map((day) => (
                  <Card key={day.day} className="mb-3 border-start border-primary border-5">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Day {day.day}: {day.theme}</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="activities mb-4">
                        <h6 className="fw-bold mb-3">Activities</h6>
                        {day.activities?.map((activity, idx) => (
                          <div key={idx} className="activity-item mb-3 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between">
                              <h6 className="mb-1">{activity.activity}</h6>
                              <Badge bg="secondary">{activity.time}</Badge>
                            </div>
                            <p className="text-muted mb-1">{activity.description}</p>
                            <small className="text-secondary">⏱️ {activity.duration}</small>
                          </div>
                        ))}
                      </div>

                      {day.meals && (
                        <div className="meals mb-4">
                          <h6 className="fw-bold mb-2">🍽️ Meals</h6>
                          {day.meals.map((meal, idx) => (
                            <p key={idx} className="mb-1">{meal}</p>
                          ))}
                        </div>
                      )}

                      {day.tips && (
                        <div className="tips p-3 bg-warning bg-opacity-10 rounded">
                          <h6 className="fw-bold mb-2">💡 Tips</h6>
                          <p className="mb-0">{day.tips}</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>

              {itinerary.packing_tips && itinerary.packing_tips.length > 0 && (
                <div className="packing-section p-4 bg-light rounded">
                  <h5 className="mb-3">🎒 Packing Tips</h5>
                  <div className="row">
                    {itinerary.packing_tips.map((tip, idx) => (
                      <div key={idx} className="col-md-6 mb-2">
                        <span className="badge bg-info me-2">✓</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{saveMode === 'itinerary' ? 'Save Your Itinerary' : 'Save Your Trip'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>{saveMode === 'itinerary' ? 'Itinerary Name' : 'Trip Name'}</Form.Label>
              <Form.Control
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder={saveMode === 'itinerary' ? "e.g., Paris City Exploration" : "e.g., Summer 2024 Tokyo Adventure"}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveTrip}>
            {saveMode === 'itinerary' ? 'Save Itinerary' : 'Save Trip'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Itinerary;
