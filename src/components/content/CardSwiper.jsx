import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

// Simple swipeable card stack for travel destinations
const CardSwiper = ({ destinations, onSwipeRight, onSwipeLeft }) => {
  const [current, setCurrent] = useState(0);

  if (!destinations || destinations.length === 0) {
    return <div>No destinations available.</div>;
  }

  const handleSwipe = (direction) => {
    if (direction === 'right') {
      onSwipeRight(destinations[current]);
    } else {
      onSwipeLeft(destinations[current]);
    }
    setCurrent((prev) => Math.min(prev + 1, destinations.length));
  };

  if (current >= destinations.length) {
    return <div>You've seen all destinations!</div>;
  }

  const dest = destinations[current];

  return (
    <div className="d-flex flex-column align-items-center">
      <Card style={{ width: '22rem', minHeight: '32rem' }} className="mb-3 shadow">
        {dest.image && (
          <Card.Img variant="top" src={dest.image} alt={dest.city} style={{ height: '200px', objectFit: 'cover' }} />
        )}
        <Card.Body>
          <Card.Title>{dest.city}, {dest.country}</Card.Title>
          <Card.Text>{dest.description}</Card.Text>
          {/* Add more info fields as needed */}
          <ul className="text-start">
            {dest.bestTime && <li><b>Best Time:</b> {dest.bestTime}</li>}
            {dest.cost && <li><b>Cost:</b> {dest.cost}</li>}
            {dest.attractions && <li><b>Top Attractions:</b> {dest.attractions}</li>}
            {/* Add more fields as needed */}
          </ul>
        </Card.Body>
      </Card>
      <div>
        <Button variant="danger" className="me-3" onClick={() => handleSwipe('left')}>❌ Discard</Button>
        <Button variant="success" onClick={() => handleSwipe('right')}>❤️ Save</Button>
      </div>
    </div>
  );
};

CardSwiper.propTypes = {
  destinations: PropTypes.array.isRequired,
  onSwipeRight: PropTypes.func,
  onSwipeLeft: PropTypes.func,
};

CardSwiper.defaultProps = {
  onSwipeRight: () => {},
  onSwipeLeft: () => {},
};

export default CardSwiper;
