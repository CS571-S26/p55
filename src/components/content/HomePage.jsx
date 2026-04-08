import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import CardSwiper from './CardSwiper';
import { getCityImage } from './cityImages';
import '../../css/HomePage.css';
import destinationsData from '../../assets/Worldwide_Travel_Cities.json';

const HomePage = () => {
  const [showModal, setShowModal] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [showSwiper, setShowSwiper] = useState(false);

  const handleClose = () => setShowModal(false);
  const handleSignIn = () => {
    setShowModal(false);
  };
  const handleLogin = () => {
    setShowModal(false);
  };

  // Load destinations from JSON file
  useEffect(() => {
    // Map to CardSwiper format
    const mapped = destinationsData.slice(0, 12).map((d) => ({
      city: d.city,
      country: d.country,
      description: d.short_description,
      image: getCityImage(d.city),
      bestTime: undefined, // Could be derived from avg_temp_monthly
      cost: d.budget_level,
      attractions: undefined, // Placeholder
    }));
    setDestinations(mapped);
  }, []);

  const handleGetStarted = () => {
    setShowSwiper(true);
    setShowModal(false);
  };

  const handleSwipeRight = (destination) => {
    // Save to trips (implement as needed)
    // e.g., add to localStorage or context
  };
  const handleSwipeLeft = (destination) => {
    // Discard action (optional)
  };

  return (
    <>
      <div className="tripgenie-home-bg">
        <Container className="tripgenie-home-container">
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
          {showSwiper && (
            <Row className="justify-content-center mt-4">
              <Col md={8} lg={6}>
                <CardSwiper
                  destinations={destinations}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
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
            <Button variant="success" className="me-2" onClick={handleSignIn}>
              Sign Up
            </Button>
            <Button variant="outline-primary" onClick={handleLogin}>
              Log In
            </Button>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default HomePage;
