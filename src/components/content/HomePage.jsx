import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import CardSwiper from './CardSwiper';
import { getCityImage } from './cityImages';
import '../../css/HomePage.css';
import destinationsData from '../../assets/Worldwide_Travel_Cities.json';

const HomePage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [showSwiper, setShowSwiper] = useState(false);
  const [destinationIndex, setDestinationIndex] = useState(0);
  const BATCH_SIZE = 12;

  useEffect(() => {
    // Check if user is signed in
    const user = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');
    
    // Show modal only if user is NOT signed in
    if (!user || !authToken) {
      setShowModal(true);
    }
  }, []);

  const loadDestinations = (startIndex) => {
    const mapped = destinationsData.slice(startIndex, startIndex + BATCH_SIZE).map((d) => ({
      city: d.city,
      country: d.country,
      description: d.short_description,
      image: getCityImage(d.city),
      bestTime: undefined, // Could be derived from avg_temp_monthly
      cost: d.budget_level,
      attractions: undefined, // Placeholder
    }));
    return mapped;
  };

  // Load destinations from JSON file
  useEffect(() => {
    const initialDestinations = loadDestinations(0);
    setDestinations(initialDestinations);
  }, []);

  const handleGetStarted = () => {
    setShowSwiper(true);
    setShowModal(false);
    setDestinationIndex(0);
    const initialDestinations = loadDestinations(0);
    setDestinations(initialDestinations);
  };

  const handleLoadMore = () => {
    const nextIndex = destinationIndex + BATCH_SIZE;
    if (nextIndex < destinationsData.length) {
      const newDestinations = loadDestinations(nextIndex);
      setDestinations(prev => [...prev, ...newDestinations]);
      setDestinationIndex(nextIndex);
    }
  };

  const handleClose = () => setShowModal(false);
  const handleSignUp = () => {
    setShowModal(false);
    navigate('/profile/signup');
  };
  const handleLogin = () => {
    setShowModal(false);
    navigate('/profile/login');
  };

  const handleSwipeRight = async (destination) => {
    const authToken = localStorage.getItem('authToken');
    
    if (authToken) {
      // Save to backend if logged in
      try {
        const response = await fetch('http://localhost:5001/api/user/trips', {
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
    <>
      <div className="tripgenie-home-bg">
        <Container className="tripgenie-home-container">
          {!showSwiper && (
            <Row className="justify-content-center align-items-center min-vh-100">
              <Col md={8} lg={6} className="text-center">
                <p className="tripgenie-subtitle mb-4">
                  Your AI-powered trip planner. Effortlessly create, customize, and optimize your travel adventures with the help of artificial intelligence!
                </p>
                <Button variant="primary" size="lg" className="tripgenie-get-started" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </Col>
            </Row>
          )}
          {showSwiper && (
            <Row className="justify-content-center mt-4">
              <Col md={8} lg={6}>
                <CardSwiper
                  destinations={destinations}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                  onReachedEnd={handleLoadMore}
                />
              </Col>
            </Row>
          )}
        </Container>

        {/* Modal for Welcome and Sign-in/Login */}
        <Modal show={showModal} onHide={handleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Welcome to TripGenie</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <p>Sign in or log in to get started planning your next adventure!</p>
            <Button variant="success" className="me-2" onClick={handleSignUp}>
              Sign Up
            </Button>
            <Button variant="outline-primary" onClick={handleLogin}>
              Log In
            </Button>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default HomePage;
