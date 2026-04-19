import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import ImageCarousel from './ImageCarousel';

const MyTrips = () => {
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
                      <Button variant="outline-danger" size="sm" onClick={() => handleRemoveTrip(trip.city, trip.country)}>
                        Remove
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default MyTrips;
