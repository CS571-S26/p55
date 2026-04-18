import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import CardSwiper from './CardSwiper';
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

  const loadDestinations = async (startIndex) => {
    const destinationsToMap = destinationsData.slice(startIndex, startIndex + BATCH_SIZE);
    
    // Fetch images from backend for all destinations in parallel
    const mappedWithImages = await Promise.all(
      destinationsToMap.map(async (d) => {
        let images = [];
        
        try {
          const res = await fetch('http://localhost:5001/api/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: d.city, country: d.country })
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
        
        return {
          city: d.city,
          country: d.country,
          description: d.short_description,
          images: images,
          bestTime: undefined,
          cost: d.budget_level,
          attractions: undefined,
        };
      })
    );
    
    return mappedWithImages;
  };

  // Load destinations from JSON file
  useEffect(() => {
    const fetchInitialDestinations = async () => {
      // Generate random starting index for variety
      const maxStartIndex = Math.max(0, destinationsData.length - BATCH_SIZE);
      const randomStartIndex = Math.floor(Math.random() * (maxStartIndex + 1));
      
      const initialDestinations = await loadDestinations(randomStartIndex);
      setDestinations(initialDestinations);
    };
    fetchInitialDestinations();
  }, []);

  const handleGetStarted = () => {
    setShowSwiper(true);
    setShowModal(false);
    setDestinationIndex(0);
    // Destinations are already loaded and randomized from the initial load
  };

  const handleLoadMore = async () => {
    const nextIndex = destinationIndex + BATCH_SIZE;
    if (nextIndex < destinationsData.length) {
      const newDestinations = await loadDestinations(nextIndex);
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
